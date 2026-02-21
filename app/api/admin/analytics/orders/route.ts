import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Get orders analytics
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

        // Fetch orders for the period
        const { data: orders } = await supabase
            .from("orders")
            .select("*")
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())
            .order("created_at", { ascending: true });

        if (!orders) {
            return NextResponse.json({
                timeline: [],
                statusDistribution: {},
                topCustomers: [],
                metrics: {}
            });
        }

        // Build timeline (group by date)
        const timelineMap: { [key: string]: { orderCount: number; bottleCount: number } } = {};

        orders.forEach(order => {
            const date = new Date(order.created_at).toISOString().split('T')[0];
            if (!timelineMap[date]) {
                timelineMap[date] = { orderCount: 0, bottleCount: 0 };
            }
            timelineMap[date].orderCount++;
            timelineMap[date].bottleCount += order.quantity || 0;
        });

        const timeline = Object.entries(timelineMap).map(([date, data]) => ({
            date,
            orderCount: data.orderCount,
            bottleCount: data.bottleCount,
        }));

        // Status distribution
        const statusDistribution = {
            ordered: orders.filter(o => o.order_status === "ordered").length,
            payment_pending: orders.filter(o => o.order_status === "payment_pending").length,
            delivered: orders.filter(o => o.order_status === "delivered").length,
            cancelled: orders.filter(o => o.order_status === "cancelled").length,
        };

        // Top customers (group by customer name/phone)
        const customerMap: {
            [key: string]: {
                name: string;
                phone: string;
                orderCount: number;
                bottleCount: number;
                totalSpent: number;
            }
        } = {};

        orders.forEach(order => {
            const key = `${order.customer_name}_${order.customer_phone}`;
            if (!customerMap[key]) {
                customerMap[key] = {
                    name: order.customer_name,
                    phone: order.customer_phone,
                    orderCount: 0,
                    bottleCount: 0,
                    totalSpent: 0,
                };
            }
            customerMap[key].orderCount++;
            customerMap[key].bottleCount += order.quantity || 0;
            customerMap[key].totalSpent += Number(order.total_price) || 0;
        });

        const topCustomers = Object.values(customerMap)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);

        // Calculate metrics
        const totalOrders = orders.length;
        const deliveredOrders = orders.filter(o => o.order_status === "delivered");
        const completionRate = totalOrders > 0
            ? Math.round((deliveredOrders.length / totalOrders) * 100)
            : 0;

        // Average processing time (for delivered orders)
        let avgProcessingTime = 0;
        if (deliveredOrders.length > 0) {
            const totalTime = deliveredOrders.reduce((sum, order) => {
                const created = new Date(order.created_at).getTime();
                const updated = new Date(order.updated_at).getTime();
                return sum + (updated - created);
            }, 0);
            avgProcessingTime = Math.round(totalTime / deliveredOrders.length / (1000 * 60 * 60)); // hours
        }

        return NextResponse.json({
            timeline,
            statusDistribution,
            topCustomers,
            metrics: {
                totalOrders,
                completionRate,
                avgProcessingTime,
            },
        });
    } catch (error) {
        console.error("Orders analytics API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders analytics" },
            { status: 500 }
        );
    }
}
