import { NextRequest, NextResponse } from "next/server";
import { getStatusLabel, getCourierDisplayName } from "@/lib/services/courier-tracking";

export const dynamic = "force-dynamic";

// GET - Public order tracking (no auth required)
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

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const selectFields = `
                id,
                customer_name,
                product_name,
                quantity,
                total_price,
                order_status,
                payment_status,
                delivery_method,
                tracking_number,
                courier_name,
                tracking_url,
                created_at,
                updated_at,
                delivery_volunteer:volunteers!orders_delivery_volunteer_id_fkey(name, phone, volunteer_id)
            `;

        // Try exact UUID match first
        let { data: order, error } = await supabase
            .from("orders")
            .select(selectFields)
            .eq("id", orderId)
            .is("deleted_at", null)
            .single();

        // If not found and orderId looks like a short prefix, try prefix match
        if ((error || !order) && orderId.length < 36) {
            const { data: prefixOrder, error: prefixError } = await supabase
                .from("orders")
                .select(selectFields)
                .ilike("id", `${orderId}%`)
                .is("deleted_at", null)
                .limit(1)
                .single();

            if (!prefixError && prefixOrder) {
                order = prefixOrder;
                error = null;
            }
        }

        if (error || !order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Fetch tracking events
        const { data: events } = await supabase
            .from("delivery_tracking_events")
            .select("status, title, description, location, updated_by, created_at")
            .eq("order_id", orderId)
            .order("created_at", { ascending: true });

        // Build timeline from tracking events
        const timeline = (events || []).map((event) => ({
            status: event.status,
            label: event.title || getStatusLabel(event.status),
            description: event.description,
            location: event.location,
            updated_by: event.updated_by,
            timestamp: event.created_at,
            completed: true,
        }));

        // If no tracking events exist, build a basic timeline from order data
        if (timeline.length === 0) {
            timeline.push({
                status: "order_placed",
                label: "Order Placed",
                description: null,
                location: null,
                updated_by: "system",
                timestamp: order.created_at,
                completed: true,
            });

            if (order.payment_status === "paid" || order.payment_status === "verified") {
                timeline.push({
                    status: "payment_verified",
                    label: "Payment Verified",
                    description: null,
                    location: null,
                    updated_by: "system",
                    timestamp: order.updated_at,
                    completed: true,
                });
            }

            if (order.order_status === "delivered") {
                timeline.push({
                    status: "delivered",
                    label: "Delivered",
                    description: null,
                    location: null,
                    updated_by: "system",
                    timestamp: order.updated_at,
                    completed: true,
                });
            }
        }

        // Determine current status for display
        const lastEvent = timeline[timeline.length - 1];
        const currentStatus = lastEvent?.status || order.order_status;

        // Privacy-safe customer name
        const nameParts = order.customer_name.split(" ");
        const safeName =
            nameParts.length > 1
                ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
                : nameParts[0];

        // Build delivery volunteer info (only for volunteer method)
        const deliveryVolunteer = order.delivery_volunteer;
        const volunteerInfo =
            order.delivery_method === "volunteer" && deliveryVolunteer
                ? {
                    name: Array.isArray(deliveryVolunteer)
                        ? deliveryVolunteer[0]?.name
                        : (deliveryVolunteer as { name: string }).name,
                    phone: Array.isArray(deliveryVolunteer)
                        ? deliveryVolunteer[0]?.phone
                        : (deliveryVolunteer as { phone: string }).phone,
                    volunteer_id: Array.isArray(deliveryVolunteer)
                        ? deliveryVolunteer[0]?.volunteer_id
                        : (deliveryVolunteer as { volunteer_id: string }).volunteer_id,
                }
                : null;

        // Build courier info
        const courierInfo =
            (order.delivery_method === "post" || order.delivery_method === "courier") &&
                order.tracking_number
                ? {
                    tracking_number: order.tracking_number,
                    courier_name: order.courier_name,
                    courier_display_name: order.courier_name
                        ? getCourierDisplayName(order.courier_name)
                        : null,
                    tracking_url: order.tracking_url,
                }
                : null;

        const trackingInfo = {
            order_id: order.id,
            customer_name: safeName,
            product: order.product_name,
            quantity: order.quantity,
            status: currentStatus,
            order_status: order.order_status,
            delivery_method: order.delivery_method,
            timeline,
            volunteer_info: volunteerInfo,
            courier_info: courierInfo,
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
