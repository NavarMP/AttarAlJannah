import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST - Manual delivery assignment by admin
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;
        const body = await request.json();
        const { volunteerId, deliveryMethod } = body;

        if (!volunteerId || !deliveryMethod) {
            return NextResponse.json(
                { error: "Volunteer ID and delivery method are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Look up volunteer UUID from volunteer_id string
        const { data: volunteer, error: volunteerError } = await supabase
            .from("volunteers")
            .select("id, name, volunteer_id, phone")
            .ilike("volunteer_id", volunteerId)
            .single();

        if (volunteerError || !volunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // Check order exists
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id, order_status, volunteer_id, is_delivery_duty")
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Update order with delivery volunteer and method
        const { error: updateError } = await supabase
            .from("orders")
            .update({
                volunteer_id: volunteer.id,
                is_delivery_duty: true,
                delivery_method: deliveryMethod,
            })
            .eq("id", orderId);

        if (updateError) {
            console.error("Error updating order:", updateError);
            return NextResponse.json(
                { error: "Failed to assign delivery volunteer" },
                { status: 500 }
            );
        }

        // Create an auto-approved delivery request for tracking
        const now = new Date().toISOString();
        const { error: requestError } = await supabase
            .from("delivery_requests")
            .insert({
                order_id: orderId,
                volunteer_id: volunteer.id,
                status: "approved",
                responded_at: now,
                notes: "Manually assigned by admin",
            });

        if (requestError) {
            console.error("Error creating delivery request:", requestError);
            // Not critical, assignment already done
        }

        // Reject any pending requests for this order
        const { error: rejectError } = await supabase
            .from("delivery_requests")
            .update({
                status: "rejected",
                responded_at: now,
                notes: "Admin manually assigned another volunteer",
            })
            .eq("order_id", orderId)
            .eq("status", "pending");

        if (rejectError) {
            console.error("Error rejecting pending requests:", rejectError);
            // Not critical
        }

        // Trigger notification for delivery assignment
        try {
            const { NotificationService } = await import("@/lib/services/notification-service");
            await NotificationService.notifyDeliveryAssigned(orderId, volunteer.id);
            console.log("📧 Delivery assignment notification sent");
        } catch (notifError) {
            console.error("⚠️ Notification error (non-blocking):", notifError);
        }

        return NextResponse.json({
            success: true,
            message: "Delivery volunteer assigned successfully",
            volunteer: {
                id: volunteer.id,
                name: volunteer.name,
                volunteer_id: volunteer.volunteer_id,
                phone: volunteer.phone,
            },
        });
    } catch (error) {
        console.error("Assign delivery API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
            ;
    }
}
