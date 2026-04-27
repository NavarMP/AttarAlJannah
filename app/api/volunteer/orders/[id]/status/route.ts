import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

// PATCH - Update order status (delivery volunteers only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;
        const body = await request.json();
        const { volunteerId, newStatus } = body;

        if (!volunteerId || !newStatus) {
            return NextResponse.json(
                { error: "Volunteer ID and new status are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Look up volunteer UUID from volunteer_id string
        const { data: volunteer, error: volunteerError } = await supabase
            .from("volunteers")
            .select("id, delivery_commission_per_bottle, total_deliveries, total_delivery_commission")
            .ilike("volunteer_id", volunteerId)
            .single();

        if (volunteerError || !volunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // Fetch the order and verify it exists
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id, order_status, volunteer_id, delivery_volunteer_id, is_delivery_duty, quantity")
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Determine volunteer roles for this order
        const isReferralVolunteer = order.volunteer_id === volunteer.id;
        const isDeliveryVolunteer = order.delivery_volunteer_id === volunteer.id || (order.volunteer_id === volunteer.id && order.is_delivery_duty === true);

        if (!isReferralVolunteer && !isDeliveryVolunteer) {
            return NextResponse.json(
                { error: "You are not authorized to update this order" },
                { status: 403 }
            );
        }

        // If they are strictly a delivery volunteer (and not the referral volunteer), restrict statuses
        if (isDeliveryVolunteer && !isReferralVolunteer) {
            if (newStatus !== "delivered" && newStatus !== "cant_reach") {
                return NextResponse.json(
                    { error: "Delivery volunteers can only update status to 'delivered' or 'cant_reach'" },
                    { status: 400 }
                );
            }
        }

        if (order.order_status === "delivered" && newStatus === "delivered") {
            return NextResponse.json(
                { error: "This order is already marked as delivered" },
                { status: 400 }
            );
        }

        // Update order status
        const { error: updateOrderError } = await supabase
            .from("orders")
            .update({ order_status: newStatus })
            .eq("id", orderId);

        if (updateOrderError) {
            console.error("Error updating order status:", updateOrderError);
            return NextResponse.json(
                { error: "Failed to update order status" },
                { status: 500 }
            );
        }

        // Commission Handling
        if (newStatus === "delivered" && order.order_status !== "delivered") {
            if (isDeliveryVolunteer) {
                const deliveryCommission = order.quantity * volunteer.delivery_commission_per_bottle;
                const newTotalDeliveries = volunteer.total_deliveries + 1;
                const newTotalCommission = volunteer.total_delivery_commission + deliveryCommission;

                await supabase
                    .from("volunteers")
                    .update({
                        total_deliveries: newTotalDeliveries,
                        total_delivery_commission: newTotalCommission,
                    })
                    .eq("id", volunteer.id);
            }
        } else if (order.order_status === "delivered" && newStatus !== "delivered") {
            // Reverting a delivered order -> deduct commission
            const targetVolunteerId = order.delivery_volunteer_id || (order.is_delivery_duty ? order.volunteer_id : null);
            if (targetVolunteerId) {
                // Fetch the volunteer who got the commission
                const { data: devVol } = await supabase
                    .from("volunteers")
                    .select("id, delivery_commission_per_bottle, total_deliveries, total_delivery_commission")
                    .eq("id", targetVolunteerId)
                    .single();

                if (devVol) {
                    const deliveryCommission = order.quantity * devVol.delivery_commission_per_bottle;
                    const newTotalDeliveries = Math.max(0, devVol.total_deliveries - 1);
                    const newTotalCommission = Math.max(0, devVol.total_delivery_commission - deliveryCommission);

                    await supabase
                        .from("volunteers")
                        .update({
                            total_deliveries: newTotalDeliveries,
                            total_delivery_commission: newTotalCommission,
                        })
                        .eq("id", devVol.id);
                }
            }
        }

        // Auto-insert tracking event for delivery
        if (newStatus === "delivered") {
            try {
                await supabase.from("delivery_tracking_events").insert({
                    order_id: orderId,
                    status: "delivered",
                    title: "Delivered Successfully",
                    description: `Delivered by volunteer`,
                    updated_by: volunteerId,
                });
            } catch (trackingError) {
                console.error("⚠️ Tracking event error (non-blocking):", trackingError);
            }

            await logAuditEvent({
                actor: {
                    id: volunteer.id,
                    email: volunteerId,
                    role: "volunteer"
                },
                action: "update",
                entityType: "order",
                entityId: orderId,
                details: { status: "delivered", volunteer_id: volunteerId },
                ipAddress: getClientIP(request),
            });

            return NextResponse.json({
                success: true,
                message: "Order marked as delivered successfully",
                commission: isDeliveryVolunteer ? {
                    earned: order.quantity * volunteer.delivery_commission_per_bottle,
                    totalDeliveries: volunteer.total_deliveries + 1,
                    totalCommission: volunteer.total_delivery_commission + (order.quantity * volunteer.delivery_commission_per_bottle),
                } : undefined,
            });
        }

        // Auto-insert tracking event for cant_reach
        try {
            await supabase.from("delivery_tracking_events").insert({
                order_id: orderId,
                status: "cant_reach",
                title: "Delivery Attempted — Can't Reach Customer",
                updated_by: volunteerId,
            });
        } catch (trackingError) {
            console.error("⚠️ Tracking event error (non-blocking):", trackingError);
        }

        await logAuditEvent({
            actor: {
                id: volunteer.id,
                email: volunteerId,
                role: "volunteer"
            },
            action: "update",
            entityType: "order",
            entityId: orderId,
            details: { status: "cant_reach", volunteer_id: volunteerId },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({
            success: true,
            message: `Order status updated to '${newStatus}' successfully`,
        });
    } catch (error) {
        console.error("Volunteer status update API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
