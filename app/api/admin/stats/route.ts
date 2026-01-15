import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Get all orders to calculate bottle quantities
        const { data: allOrders } = await supabase
            .from("orders")
            .select("quantity, order_status, total_price");

        const totalBottles = allOrders?.reduce((sum, order) => sum + (order.quantity || 0), 0) || 0;
        const pendingBottles = allOrders
            ?.filter(o => o.order_status === "pending")
            .reduce((sum, order) => sum + (order.quantity || 0), 0) || 0;
        const deliveredBottles = allOrders
            ?.filter(o => o.order_status === "delivered")
            .reduce((sum, order) => sum + (order.quantity || 0), 0) || 0;

        // Get total revenue from delivered orders
        const totalRevenue = allOrders
            ?.filter(o => o.order_status === "delivered")
            .reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

        // Get recent orders
        const { data: recentOrders } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);

        return NextResponse.json({
            stats: {
                totalBottles,
                pendingBottles,
                deliveredBottles,
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
