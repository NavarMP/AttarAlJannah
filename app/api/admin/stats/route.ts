import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Get total orders count
        const { count: totalOrders } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true });

        // Get pending orders count
        const { count: pendingOrders } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("order_status", "pending");

        // Get delivered orders count
        const { count: deliveredOrders } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("order_status", "delivered");

        // Get total revenue
        const { data: revenueData } = await supabase
            .from("orders")
            .select("total_price")
            .eq("order_status", "delivered");

        const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

        // Get recent orders
        const { data: recentOrders } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);

        return NextResponse.json({
            stats: {
                totalOrders: totalOrders || 0,
                pendingOrders: pendingOrders || 0,
                deliveredOrders: deliveredOrders || 0,
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
