import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - List all delivery requests (admin)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const orderId = searchParams.get("orderId");

        const supabase = await createClient();

        // Build query with joins
        let query = supabase
            .from("delivery_requests")
            .select(`
        *,
        volunteer:volunteers!delivery_requests_volunteer_id_fkey(
          id,
          name,
          volunteer_id,
          phone
        ),
        order:orders(
          id,
          customer_name,
          customer_address,
          quantity,
          total_price,
          order_status,
          volunteer_id,
          is_delivery_duty
        )
      `)
            .order("requested_at", { ascending: false });

        if (orderId) {
            query = query.eq("order_id", orderId);
        }

        if (status && status !== "all") {
            query = query.eq("status", status);
        }

        const { data: requests, error } = await query;

        if (error) {
            console.error("Error fetching delivery requests:", error);
            return NextResponse.json(
                { error: "Failed to fetch delivery requests" },
                { status: 500 }
            );
        }

        return NextResponse.json({ requests: requests || [] });
    } catch (error) {
        console.error("Admin delivery requests API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH - Approve or reject delivery request
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { requestId, action, notes } = body;

        if (!requestId || !action) {
            return NextResponse.json(
                { error: "Request ID and action are required" },
                { status: 400 }
            );
        }

        if (action !== "approve" && action !== "reject") {
            return NextResponse.json(
                { error: "Action must be 'approve' or 'reject'" },
                { status: 400 }
            );
        }

        // Use Admin Client to bypass RLS for updates
        const supabase = createAdminClient();

        // Fetch the delivery request
        const { data: deliveryRequest, error: fetchError } = await supabase
            .from("delivery_requests")
            .select(`
        *,
        order:orders(id, order_status, delivery_volunteer_id)
      `)
            .eq("id", requestId)
            .single();

        if (fetchError || !deliveryRequest) {
            return NextResponse.json(
                { error: "Delivery request not found" },
                { status: 404 }
            );
        }

        if (deliveryRequest.status !== "pending") {
            return NextResponse.json(
                { error: "Only pending requests can be approved or rejected" },
                { status: 400 }
            );
        }

        const now = new Date().toISOString();

        if (action === "approve") {
            // Check if order already has a delivery volunteer
            if (deliveryRequest.order.volunteer_id && deliveryRequest.order.is_delivery_duty) {
                return NextResponse.json(
                    { error: "This order already has a delivery volunteer assigned" },
                    { status: 400 }
                );
            }

            // Update delivery request status
            const { error: updateRequestError } = await supabase
                .from("delivery_requests")
                .update({
                    status: "approved",
                    responded_at: now,
                    notes: notes || null,
                })
                .eq("id", requestId);

            if (updateRequestError) {
                console.error("Error updating delivery request:", updateRequestError);
                return NextResponse.json(
                    { error: "Failed to approve delivery request" },
                    { status: 500 }
                );
            }

            // Update order with delivery volunteer
            const { error: updateOrderError } = await supabase
                .from("orders")
                .update({
                    volunteer_id: deliveryRequest.volunteer_id,
                    is_delivery_duty: true,
                    delivery_method: "volunteer",
                })
                .eq("id", deliveryRequest.order_id);

            if (updateOrderError) {
                console.error("Error updating order:", updateOrderError);
                return NextResponse.json(
                    { error: "Failed to assign delivery volunteer to order" },
                    { status: 500 }
                );
            }

            // Reject other pending requests for the same order
            const { error: rejectOthersError } = await supabase
                .from("delivery_requests")
                .update({
                    status: "rejected",
                    responded_at: now,
                    notes: "Another volunteer was assigned to this order",
                })
                .eq("order_id", deliveryRequest.order_id)
                .eq("status", "pending")
                .neq("id", requestId);

            if (rejectOthersError) {
                console.error("Error rejecting other requests:", rejectOthersError);
                // Not critical, continue
            }

            // Trigger notifications for approval
            try {
                const { NotificationService } = await import("@/lib/services/notification-service");

                // Notify volunteer of approval
                await NotificationService.notifyDeliveryRequestUpdate(
                    requestId,
                    'approved',
                    deliveryRequest.volunteer_id
                );

                // Notify delivery assigned (volunteer + customer)
                await NotificationService.notifyDeliveryAssigned(
                    deliveryRequest.order_id,
                    deliveryRequest.volunteer_id
                );

                console.log("📧 Delivery request approval notifications sent");
            } catch (notifError) {
                console.error("⚠️ Notification error (non-blocking):", notifError);
            }

            return NextResponse.json({
                success: true,
                message: "Delivery request approved successfully",
            });
        } else {
            // Reject request
            const { error: updateError } = await supabase
                .from("delivery_requests")
                .update({
                    status: "rejected",
                    responded_at: now,
                    notes: notes || null,
                })
                .eq("id", requestId);

            if (updateError) {
                console.error("Error rejecting delivery request:", updateError);
                return NextResponse.json(
                    { error: "Failed to reject delivery request" },
                    { status: 500 }
                );
            }

            // Trigger notification for rejection
            try {
                const { NotificationService } = await import("@/lib/services/notification-service");
                await NotificationService.notifyDeliveryRequestUpdate(
                    requestId,
                    'rejected',
                    deliveryRequest.volunteer_id
                );
                console.log("📧 Delivery request rejection notification sent");
            } catch (notifError) {
                console.error("⚠️ Notification error (non-blocking):", notifError);
            }

            return NextResponse.json({
                success: true,
                message: "Delivery request rejected successfully",
            });
        }
    } catch (error) {
        console.error("Admin delivery requests API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
