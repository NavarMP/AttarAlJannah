import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Revenue constants
const BOTTLE_PRICE = 313;
const NET_PROFIT_PER_BOTTLE = 200;
const MANUFACTURER_COST = 113;

// GET - Get overview analytics metrics
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        if (!start || !end) {
            return NextResponse.json(
                { error: "Start and end dates are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const startDate = new Date(start);
        const endDate = new Date(end);

        // Calculate previous period for growth comparison
        const periodLength = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - periodLength);
        const prevEndDate = new Date(startDate);

        // Fetch current period data
        const { data: currentOrders } = await supabase
            .from("orders")
            .select("*")
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString());

        // Fetch previous period data for growth calculations
        const { data: previousOrders } = await supabase
            .from("orders")
            .select("*")
            .gte("created_at", prevStartDate.toISOString())
            .lt("created_at", prevEndDate.toISOString());

        // Calculate metrics using NET PROFIT (₹200 per bottle)
        const cashReceivedOrders = currentOrders?.filter(o => o.cash_received === true) || [];
        const bottlesSold = cashReceivedOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);
        const totalRevenue = bottlesSold * NET_PROFIT_PER_BOTTLE; // Net profit, not gross
        const activeOrders = currentOrders?.filter(o => o.order_status === "confirmed" || o.order_status === "pending").length || 0;
        const totalOrders = currentOrders?.length || 0;

        // Previous period metrics
        const prevCashOrders = previousOrders?.filter(o => o.cash_received === true) || [];
        const prevBottles = prevCashOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);
        const prevRevenue = prevBottles * NET_PROFIT_PER_BOTTLE;
        const prevActiveOrders = previousOrders?.filter(o => o.order_status === "confirmed" || o.order_status === "pending").length || 0;

        // Calculate growth percentages
        const revenueGrowth = prevRevenue === 0 ? 100 : Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);
        const ordersGrowth = prevActiveOrders === 0 ? 100 : Math.round(((activeOrders - prevActiveOrders) / prevActiveOrders) * 100);

        // Get volunteer data
        const { data: volunteers } = await supabase
            .from("volunteers")
            .select("id, name");

        // Calculate volunteer performance (simplified: avg deliveries per volunteer)
        const totalVolunteers = volunteers?.length || 1;
        const deliveriesPerVolunteer = cashReceivedOrders.length / totalVolunteers;
        const volunteerPerformance = Math.min(Math.round((deliveriesPerVolunteer / 10) * 100), 100); // Assumes 10 deliveries = 100%

        // Customer satisfaction from feedback
        const { data: feedback } = await supabase
            .from("feedback")
            .select("rating_overall")
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString());

        const avgRating = feedback && feedback.length > 0
            ? feedback.reduce((sum, f) => sum + (f.rating_overall || 0), 0) / feedback.length
            : 4.5; // Default

        // Delivery success rate
        const totalDeliveries = currentOrders?.filter(o =>
            o.order_status === "delivered" || o.order_status === "cancelled" || o.order_status === "cant_reach"
        ).length || 1;
        const successfulDeliveries = currentOrders?.filter(o => o.order_status === "delivered").length || 0;
        const deliverySuccessRate = Math.round((successfulDeliveries / totalDeliveries) * 100);

        // Average Order Value
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const prevAOV = previousOrders && previousOrders.length > 0
            ? prevRevenue / previousOrders.length
            : 0;
        const aovGrowth = prevAOV === 0 ? 100 : Math.round(((averageOrderValue - prevAOV) / prevAOV) * 100);

        // Active zones
        const { data: zones } = await supabase
            .from("delivery_zones")
            .select("id, is_active")
            .eq("is_active", true);

        const activeZones = zones?.length || 0;

        // Monthly growth (comparing this month to last month)
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const { data: thisMonthOrders } = await supabase
            .from("orders")
            .select("total_price, order_status, cash_received")
            .gte("created_at", thisMonthStart.toISOString())
            .lte("created_at", now.toISOString());

        const { data: lastMonthOrders } = await supabase
            .from("orders")
            .select("total_price, order_status, cash_received")
            .gte("created_at", lastMonthStart.toISOString())
            .lte("created_at", lastMonthEnd.toISOString());

        const thisMonthRevenue = thisMonthOrders
            ?.filter(o => o.cash_received === true)
            .reduce((sum, o) => sum + Number(o.total_price), 0) || 0;

        const lastMonthRevenue = lastMonthOrders
            ?.filter(o => o.cash_received === true)
            .reduce((sum, o) => sum + Number(o.total_price), 0) || 1;

        const monthlyGrowth = Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

        return NextResponse.json({
            metrics: {
                totalRevenue,
                revenueGrowth,
                activeOrders,
                ordersGrowth,
                volunteerPerformance,
                volunteerGrowth: 0, // Can be calculated if we track historical performance
                customerSatisfaction: Number(avgRating.toFixed(1)),
                deliverySuccessRate,
                averageOrderValue,
                aovGrowth,
                activeZones,
                monthlyGrowth,
            },
        });
    } catch (error) {
        console.error("Analytics overview API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics overview" },
            { status: 500 }
        );
    }
}
