import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { fetchCourierTracking, COURIER_MAP } from "@/lib/services/courier-tracking";

// POST - Sync tracking for orders with tracking numbers via TrackingMore API
export async function POST(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { orderIds } = await request.json();

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Build query for orders with tracking numbers
        let query = supabase
            .from("orders")
            .select("id, tracking_number, courier_name")
            .not("tracking_number", "is", null);

        // If specific order IDs provided, filter to those
        if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
            query = query.in("id", orderIds);
        }

        const { data: orders, error: ordersError } = await query;

        if (ordersError) {
            return NextResponse.json({ error: ordersError.message }, { status: 500 });
        }

        if (!orders || orders.length === 0) {
            return NextResponse.json({
                success: true,
                synced: 0,
                message: "No orders with tracking numbers found",
            });
        }

        let syncedCount = 0;
        let errorCount = 0;
        const results: Array<{ orderId: string; eventsAdded: number; error?: string }> = [];

        for (const order of orders) {
            try {
                const courierInfo = COURIER_MAP[order.courier_name];
                if (!courierInfo) {
                    results.push({ orderId: order.id, eventsAdded: 0, error: "Unknown courier" });
                    errorCount++;
                    continue;
                }

                // Fetch from TrackingMore
                const events = await fetchCourierTracking(
                    order.tracking_number,
                    courierInfo.code
                );

                if (events.length === 0) {
                    results.push({ orderId: order.id, eventsAdded: 0 });
                    continue;
                }

                // Fetch existing courier_api events to avoid duplicates
                const { data: existingEvents } = await supabase
                    .from("delivery_tracking_events")
                    .select("created_at, title")
                    .eq("order_id", order.id)
                    .eq("updated_by", "courier_api");

                const existingSet = new Set(
                    (existingEvents || []).map(
                        (e: { created_at: string; title: string }) => `${e.created_at}|${e.title}`
                    )
                );

                // Insert only new events
                const newEvents = events
                    .filter(
                        (e) => !existingSet.has(`${e.created_at}|${e.title}`)
                    )
                    .map((e) => ({
                        ...e,
                        order_id: order.id,
                    }));

                if (newEvents.length > 0) {
                    await supabase
                        .from("delivery_tracking_events")
                        .insert(newEvents);
                }

                // Update last sync timestamp
                await supabase
                    .from("orders")
                    .update({ last_tracking_sync: new Date().toISOString() })
                    .eq("id", order.id);

                syncedCount++;
                results.push({ orderId: order.id, eventsAdded: newEvents.length });
            } catch (err) {
                console.error(`Sync error for order ${order.id}:`, err);
                results.push({
                    orderId: order.id,
                    eventsAdded: 0,
                    error: "API call failed",
                });
                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            synced: syncedCount,
            errors: errorCount,
            total: orders.length,
            results,
        });
    } catch (error) {
        console.error("Tracking sync error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
