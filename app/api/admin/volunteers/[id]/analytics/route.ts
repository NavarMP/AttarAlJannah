
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const volunteerId = id;
        const supabase = await createClient();

        // Verify admin
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get volunteer details
        const { data: volunteer, error: volunteerError } = await supabase
            .from("volunteers")
            .select("*")
            .eq("id", volunteerId)
            .single();

        if (volunteerError || !volunteer) {
            return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
        }

        // Get orders for this volunteer
        const { data: orders, error: ordersError } = await supabase
            .from("orders")
            .select("*")
            .eq("volunteer_id", volunteer.id)
            .order("created_at", { ascending: false });

        if (ordersError) {
            console.error("Error fetching orders:", ordersError);
            return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
        }

        // Calculate analytics
        const totalOrders = orders.length;
        const deliveredOrders = orders.filter((o) => o.order_status === "ordered" || o.order_status === "delivered");
        const pendingOrders = orders.filter((o) => o.order_status === "pending" || o.order_status === "pending");
        const cancelledOrders = orders.filter((o) => o.order_status === "cancelled" || o.order_status === "cant_reach");

        // Calculate bottles and revenue (only for confirmed/delivered orders)
        const totalBottlesSold = deliveredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);

        // Calculate commission (20% of revenue)
        const commission = totalRevenue * 0.20;

        // Calculate performance metrics
        const conversionRate = totalOrders > 0
            ? Math.round((deliveredOrders.length / totalOrders) * 100)
            : 0;

        const successRate = (deliveredOrders.length + cancelledOrders.length) > 0
            ? Math.round((deliveredOrders.length / (deliveredOrders.length + cancelledOrders.length)) * 100)
            : 0;

        // Calculate active days (days since first order)
        let activeDays = 0;
        if (orders.length > 0) {
            const firstOrderDate = new Date(orders[orders.length - 1].created_at);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - firstOrderDate.getTime());
            activeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Get goal progress
        const { data: goalData } = await supabase
            .from("challenge_progress")
            .select("goal, confirmed_orders")
            .eq("volunteer_id", volunteer.id) // using UUID for challenge_progress
            .single();

        const goalTarget = goalData?.goal || 20;
        const goalCurrent = totalBottlesSold; // Use calculated total bottles
        const goalProgress = goalTarget > 0 ? Math.round((goalCurrent / goalTarget) * 100) : 0;

        // Generate timeline data (last 30 days)
        const timeline = generateTimeline(orders);

        return NextResponse.json({
            overview: {
                totalBottles: totalBottlesSold,
                totalRevenue,
                commission,
                activeOrders: pendingOrders.length,
                totalOrdersCount: totalOrders
            },
            performance: {
                conversionRate,
                successRate,
                avgOrderValue: deliveredOrders.length > 0 ? Math.round(totalRevenue / deliveredOrders.length) : 0,
                activeDays,
                goal: {
                    target: goalTarget,
                    current: goalCurrent,
                    progress: goalProgress
                }
            },
            deliveryStats: {
                totalDeliveries: deliveredOrders.length,
                pendingDeliveries: pendingOrders.length,
                cancelledDeliveries: cancelledOrders.length
            },
            timeline
        });

    } catch (error) {
        console.error("Error in volunteer analytics:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

function generateTimeline(orders: any[]) {
    // Group orders by date for the last 30 days
    const days = 30;
    const timeline = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Find orders for this day
        const dayOrders = orders.filter(o => o.created_at.startsWith(dateStr));
        const dayRevenue = dayOrders
            .filter(o => o.order_status === "ordered" || o.order_status === "delivered")
            .reduce((sum, o) => sum + (o.total_price || 0), 0);

        timeline.push({
            date: dateStr,
            count: dayOrders.length,
            revenue: dayRevenue
        });
    }

    return timeline;
}
