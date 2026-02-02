import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

        if (newStatus !== "delivered" && newStatus !== "cant_reach") {
            return NextResponse.json(
                { error: "Delivery volunteers can only update status to 'delivered' or 'cant_reach'" },
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
            .select("id, order_status, volunteer_id, is_delivery_duty, quantity")
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Verify this volunteer is assigned as the delivery volunteer
        if (!order.volunteer_id || !order.is_delivery_duty || order.volunteer_id !== volunteer.id) {
            return NextResponse.json(
                { error: "You are not assigned as the delivery volunteer for this order" },
                { status: 403 }
            );
        }

        if (order.order_status === "delivered") {
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

        // If marked as delivered, calculate and update delivery commission
        if (newStatus === "delivered") {
            const deliveryCommission = order.quantity * volunteer.delivery_commission_per_bottle;
            const newTotalDeliveries = volunteer.total_deliveries + 1;
            const newTotalCommission = volunteer.total_delivery_commission + deliveryCommission;

            const { error: updateVolunteerError } = await supabase
                .from("volunteers")
                .update({
                    total_deliveries: newTotalDeliveries,
                    total_delivery_commission: newTotalCommission,
                })
                .eq("id", volunteer.id);

            if (updateVolunteerError) {
                console.error("Error updating volunteer commission:", updateVolunteerError);
                // Not critical, order status already updated
            }

            return NextResponse.json({
                success: true,
                message: "Order marked as delivered successfully",
                commission: {
                    earned: deliveryCommission,
                    totalDeliveries: newTotalDeliveries,
                    totalCommission: newTotalCommission,
                },
            });
        }

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
