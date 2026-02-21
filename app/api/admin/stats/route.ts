import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";

export async function GET() {
    const auth = await requireAdmin("viewer");
    if ("error" in auth) return auth.error;

    try {
        // Use service role client
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get all orders to calculate bottle quantities and order counts
        const { data: allOrders } = await adminSupabase
            .from("orders")
            .select("quantity, order_status, total_price");

        const totalBottles = allOrders?.reduce((sum, order) => sum + (order.quantity || 0), 0) || 0;
        const totalOrders = allOrders?.length || 0;

        // Active orders (ordered status)
        const orderedOrders = allOrders?.filter(o => o.order_status === "ordered") || [];
        const orderedBottles = orderedOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);
        const orderedOrdersCount = orderedOrders.length;

        // Delivered orders
        const deliveredOrders = allOrders?.filter(o => o.order_status === "delivered") || [];
        const deliveredBottles = deliveredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);
        const deliveredOrdersCount = deliveredOrders.length;

        // Get total revenue from delivered orders
        const totalRevenue = orderedOrders.reduce((sum, order) => sum + Number(order.total_price), 0);

        // Get recent orders
        const { data: recentOrders } = await adminSupabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);

        return NextResponse.json({
            stats: {
                totalBottles,
                totalOrders,
                orderedBottles,       // Renamed from pendingBottles
                orderedOrders: orderedOrdersCount,  // Renamed from pendingOrders
                deliveredBottles,
                deliveredOrders: deliveredOrdersCount,
                totalRevenue,
            },
            recentOrders: recentOrders || [],
        });
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch statistics" },
            { status: 500 }
        );
    }
}
