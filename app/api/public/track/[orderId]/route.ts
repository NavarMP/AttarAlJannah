import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Get order tracking information (public, no auth)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await params;

        if (!orderId) {
            return NextResponse.json(
                { error: "Order ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Fetch order with volunteer info (if assigned)
        const { data: order, error } = await supabase
            .from("orders")
            .select(`
                id,
                customer_name,
                customer_phone,
                product_name,
                quantity,
                total_price,
                order_status,
                payment_status,
                delivery_method,
                is_delivery_duty,
                created_at,
                updated_at,
                volunteers!orders_volunteer_id_fkey(name, phone, volunteer_id)
            `)
            .eq("id", orderId)
            .single();

        if (error || !order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Get delivery schedule if exists
        const { data: schedule } = await supabase
            .from("delivery_schedules")
            .select("*")
            .eq("order_id", orderId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        // Build tracking timeline
        const timeline = [
            {
                status: "ordered",
                label: "Order Placed",
                timestamp: order.created_at,
                completed: true
            },
            {
                status: "payment_verified",
                label: "Payment Verified",
                timestamp: order.payment_status === "paid" ? order.updated_at : null,
                completed: order.payment_status === "paid"
            }
        ];

        if (order.is_delivery_duty && order.volunteers) {
            timeline.push({
                status: "delivery_assigned",
                label: "Delivery Volunteer Assigned",
                timestamp: order.updated_at,
                completed: true
            });
        }

        if (schedule) {
            timeline.push({
                status: "scheduled",
                label: "Delivery Scheduled",
                timestamp: schedule.created_at,
                completed: true
            });

            if (schedule.started_at) {
                timeline.push({
                    status: "in_transit",
                    label: "Out for Delivery",
                    timestamp: schedule.started_at,
                    completed: true
                });
            }
        }

        if (order.order_status === "delivered") {
            timeline.push({
                status: "delivered",
                label: "Delivered",
                timestamp: schedule?.completed_at || order.updated_at,
                completed: true
            });
        }

        // Prepare response with limited customer info for privacy
        const trackingInfo = {
            order_id: order.id,
            customer_name: order.customer_name.split(' ')[0] + " " + order.customer_name.split(' ')[order.customer_name.split(' ').length - 1][0] + ".", // "John D."
            product: order.product_name,
            quantity: order.quantity,
            status: order.order_status,
            timeline,
            delivery_info: order.is_delivery_duty && order.volunteers ? {
                volunteer_name: Array.isArray(order.volunteers) ? order.volunteers[0]?.name : (order.volunteers as any).name,
                volunteer_phone: Array.isArray(order.volunteers) ? order.volunteers[0]?.phone : (order.volunteers as any).phone,
                volunteer_id: Array.isArray(order.volunteers) ? order.volunteers[0]?.volunteer_id : (order.volunteers as any).volunteer_id
            } : null,
            schedule_info: schedule ? {
                scheduled_date: schedule.scheduled_date,
                time_slot: schedule.scheduled_time_slot,
                status: schedule.status
            } : null
        };

        return NextResponse.json({ tracking: trackingInfo });
    } catch (error) {
        console.error("Order tracking API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch tracking information" },
            { status: 500 }
        );
    }
}
