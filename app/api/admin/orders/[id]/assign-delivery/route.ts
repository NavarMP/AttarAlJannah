import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

// POST - Manual delivery assignment by admin
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { id: orderId } = await params;
        const body = await request.json();
        const { volunteerId, deliveryMethod, removeAssignment } = body;

        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Handle removal of delivery assignment
        if (removeAssignment) {
            const { error: updateError } = await adminSupabase
                .from("orders")
                .update({
                    volunteer_id: null,
                    is_delivery_duty: false,
                    delivery_method: null,
                })
                .eq("id", orderId);

            if (updateError) {
                console.error("Error removing delivery assignment:", updateError);
                return NextResponse.json(
                    { error: "Failed to remove delivery assignment" },
                    { status: 500 }
                );
            }

            await logAuditEvent({
                actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
                action: "update",
                entityType: "order",
                entityId: orderId,
                details: { action: "remove_delivery_assignment" },
                ipAddress: getClientIP(request),
            });

            return NextResponse.json({
                success: true,
                message: "Delivery assignment removed successfully",
            });
        }

        // Validate for assignment
        if (deliveryMethod === "volunteer" && !volunteerId) {
            return NextResponse.json(
                { error: "Volunteer ID is required for volunteer delivery" },
                { status: 400 }
            );
        }

        if (!deliveryMethod) {
            return NextResponse.json(
                { error: "Delivery method is required" },
                { status: 400 }
            );
        }


        let volunteer = null;

        // Look up volunteer UUID from volunteer_id string only if it's a volunteer delivery
        if (deliveryMethod === "volunteer") {
            const { data: volData, error: volunteerError } = await adminSupabase
                .from("volunteers")
                .select("id, name, volunteer_id, phone")
                .ilike("volunteer_id", volunteerId)
                .single();

            if (volunteerError || !volData) {
                return NextResponse.json(
                    { error: "Volunteer not found" },
                    { status: 404 }
                );
            }
            volunteer = volData;
        }

        // Check order exists
        const { data: order, error: orderError } = await adminSupabase
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
        const { error: updateError } = await adminSupabase
            .from("orders")
            .update({
                volunteer_id: volunteer ? volunteer.id : null,
                is_delivery_duty: deliveryMethod === "volunteer",
                delivery_method: deliveryMethod,
            })
            .eq("id", orderId);

        if (updateError) {
            console.error("Error updating order:", updateError);
            return NextResponse.json(
                { error: "Failed to assign delivery" },
                { status: 500 }
            );
        }

        // Create an auto-approved delivery request only for volunteer delivery
        const now = new Date().toISOString();
        if (volunteer) {
            const { error: requestError } = await adminSupabase
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
            }

            // Trigger notification for delivery assignment
            try {
                const { NotificationService } = await import("@/lib/services/notification-service");
                await NotificationService.notifyDeliveryAssigned(orderId, volunteer.id);
                console.log("📧 Delivery assignment notification sent");
            } catch (notifError) {
                console.error("⚠️ Notification error (non-blocking):", notifError);
            }
        }

        // Auto-insert tracking event for delivery assignment
        try {
            const trackingTitle = volunteer
                ? `Delivery Volunteer Assigned: ${volunteer.name}`
                : `Delivery Method: ${deliveryMethod}`;
            await adminSupabase.from("delivery_tracking_events").insert({
                order_id: orderId,
                status: volunteer ? "volunteer_assigned" : "method_assigned",
                title: trackingTitle,
                updated_by: "system",
            });
        } catch (trackingError) {
            console.error("⚠️ Tracking event error (non-blocking):", trackingError);
        }

        return NextResponse.json({
            success: true,
            message: "Delivery assigned successfully",
            volunteer: volunteer ? {
                id: volunteer.id,
                name: volunteer.name,
                volunteer_id: volunteer.volunteer_id,
                phone: volunteer.phone,
            } : null,
            deliveryMethod,
        });
    } catch (error) {
        console.error("Assign delivery API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
