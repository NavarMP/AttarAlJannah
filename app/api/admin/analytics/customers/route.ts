import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Revenue constants
const NET_PROFIT_PER_BOTTLE = 200;

// GET - Get customers analytics
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

        // Get all orders in period with customer info
        const { data: orders } = await supabase
            .from("orders")
            .select("customer_id, customers(name, phone_number), created_at, quantity, total_price, order_status")
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString());

        // Get all customers who ordered before the period (for new vs returning)
        const { data: previousCustomers } = await supabase
            .from("orders")
            .select("customer_id")
            .lt("created_at", startDate.toISOString());

        const previousCustomerIds = new Set(previousCustomers?.map(o => o.customer_id) || []);

        // Track customer metrics
        const customerMap: { [key: string]: any } = {};
        let newCustomers = 0;
        let returningCustomers = 0;

        orders?.forEach(order => {
            const cid = order.customer_id;
            if (!cid) return;

            if (!customerMap[cid]) {
                customerMap[cid] = {
                    id: cid,
                    name: (order.customers as any)?.name || 'Unknown',
                    phone: (order.customers as any)?.phone_number || '',
                    orders: 0,
                    bottles: 0,
                    totalSpent: 0,
                    lastOrder: order.created_at,
                    firstOrderInPeriod: order.created_at
                };

                // Check if new or returning customer
                if (previousCustomerIds.has(cid)) {
                    returningCustomers++;
                } else {
                    newCustomers++;
                }
            }

            customerMap[cid].orders++;
            customerMap[cid].bottles += order.quantity || 0;
            customerMap[cid].totalSpent += Number(order.total_price) || 0;

            // Track last order date
            if (new Date(order.created_at) > new Date(customerMap[cid].lastOrder)) {
                customerMap[cid].lastOrder = order.created_at;
            }
        });

        const totalCustomers = Object.keys(customerMap).length;

        // Calculate repeat purchase rate (customers with more than 1 order)
        const repeatCustomers = Object.values(customerMap).filter((c: any) => c.orders > 1).length;
        const repeatPurchaseRate = totalCustomers > 0
            ? Math.round((repeatCustomers / totalCustomers) * 100)
            : 0;

        // Calculate average order frequency
        const totalOrders = orders?.length || 0;
        const avgOrderFrequency = totalCustomers > 0
            ? Number((totalOrders / totalCustomers).toFixed(1))
            : 0;

        // Top customers by total spent
        const topCustomers = Object.values(customerMap)
            .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
            .slice(0, 10)
            .map((c: any) => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                orders: c.orders,
                bottles: c.bottles,
                totalSpent: c.totalSpent,
                lastOrder: c.lastOrder
            }));

        // Group by date for growth timeline
        const growthMap: { [key: string]: { date: string; newCustomers: number; returningCustomers: number } } = {};

        orders?.forEach(order => {
            const cid = order.customer_id;
            if (!cid) return;

            const date = new Date(order.created_at).toISOString().split('T')[0];
            if (!growthMap[date]) {
                growthMap[date] = { date, newCustomers: 0, returningCustomers: 0 };
            }

            // Only count first order in period for growth
            const customer = customerMap[cid];
            if (customer && order.created_at === customer.firstOrderInPeriod) {
                if (previousCustomerIds.has(cid)) {
                    growthMap[date].returningCustomers++;
                } else {
                    growthMap[date].newCustomers++;
                }
            }
        });

        const growth = Object.values(growthMap).sort((a, b) => a.date.localeCompare(b.date));

        // Customer Lifetime Value Distribution
        // Group customers by total spent ranges
        const clvRanges = [
            { range: '₹0-1k', min: 0, max: 1000, count: 0 },
            { range: '₹1k-5k', min: 1000, max: 5000, count: 0 },
            { range: '₹5k-10k', min: 5000, max: 10000, count: 0 },
            { range: '₹10k+', min: 10000, max: Infinity, count: 0 }
        ];

        Object.values(customerMap).forEach((c: any) => {
            for (const range of clvRanges) {
                if (c.totalSpent >= range.min && c.totalSpent < range.max) {
                    range.count++;
                    break;
                }
            }
        });

        const clvDistribution = clvRanges.map(r => ({
            range: r.range,
            count: r.count
        }));

        return NextResponse.json({
            metrics: {
                totalCustomers,
                newCustomers,
                returningCustomers,
                repeatPurchaseRate,
                avgOrderFrequency
            },
            growth,
            clvDistribution,
            topCustomers
        });
    } catch (error) {
        console.error("Customers analytics API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch customers analytics" },
            { status: 500 }
        );
    }
}
