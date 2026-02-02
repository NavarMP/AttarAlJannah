import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config/admin";

export async function GET() {
    try {
        const supabase = await createClient();

        // Verify user is admin
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!isAdminEmail(user.email)) {
            return NextResponse.json({
                error: `Forbidden - Admin access required`
            }, { status: 403 });
        }

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
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + Number(order.total_price), 0);

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
