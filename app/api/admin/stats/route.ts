import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Get all orders to calculate bottle quantities and order counts
        const { data: allOrders } = await supabase
            .from("orders")
            .select("quantity, order_status, total_price");

        const totalBottles = allOrders?.reduce((sum, order) => sum + (order.quantity || 0), 0) || 0;
        const totalOrders = allOrders?.length || 0;

        const pendingOrders = allOrders?.filter(o => o.order_status === "pending") || [];
        const pendingBottles = pendingOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);
        const pendingOrdersCount = pendingOrders.length;

        const deliveredOrders = allOrders?.filter(o => o.order_status === "delivered") || [];
        const deliveredBottles = deliveredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);
        const deliveredOrdersCount = deliveredOrders.length;

        // Get total revenue from delivered orders
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + Number(order.total_price), 0);

        // Get recent orders
        const { data: recentOrders } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);

        return NextResponse.json({
            stats: {
                totalBottles,
                totalOrders,
                pendingBottles,
                pendingOrders: pendingOrdersCount,
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
