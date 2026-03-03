import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Revenue constants
const BOTTLE_PRICE = 313;
const NET_PROFIT_PER_BOTTLE = 200;
const MANUFACTURER_COST = 113;

// GET - Get revenue analytics
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

        // Fetch cash received orders for the period
        const { data: orders } = await supabase
            .from("orders")
            .select("quantity, total_price, cash_received, created_at, zone_id, volunteer_id, payment_upi_id, volunteers(name), delivery_zones(name)")
            .gt("cash_received", 0)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())
            .order("created_at", { ascending: true });

        if (!orders || orders.length === 0) {
            return NextResponse.json({
                timeline: [],
                byZone: [],
                byVolunteer: [],
                byAccount: [],
                metrics: {
                    totalGrossRevenue: 0,
                    totalNetProfit: 0,
                    totalManufacturerCost: 0,
                    profitMargin: 63.9,
                    bottlesSold: 0,
                },
            });
        }

        // Build timeline (group by date)
        const timelineMap: {
            [key: string]: {
                bottles: number;
                grossRevenue: number;
                netProfit: number;
                manufacturerCost: number;
            }
        } = {};

        orders.forEach(order => {
            const date = new Date(order.created_at).toISOString().split('T')[0];
            const bottles = order.quantity || 0;
            const cashAmount = Number(order.cash_received) || 0;

            if (!timelineMap[date]) {
                timelineMap[date] = {
                    bottles: 0,
                    grossRevenue: 0,
                    netProfit: 0,
                    manufacturerCost: 0,
                };
            }

            timelineMap[date].bottles += bottles;
            timelineMap[date].grossRevenue += cashAmount;
            timelineMap[date].netProfit += cashAmount - (bottles * MANUFACTURER_COST);
            timelineMap[date].manufacturerCost += bottles * MANUFACTURER_COST;
        });

        const timeline = Object.entries(timelineMap).map(([date, data]) => ({
            date,
            ...data,
        }));

        // Revenue by zone
        const zoneMap: {
            [key: string]: {
                zoneName: string;
                bottles: number;
                grossRevenue: number;
                netProfit: number;
            }
        } = {};

        orders.forEach(order => {
            const zoneName = (order.delivery_zones as any)?.name || "Unassigned";
            const bottles = order.quantity || 0;
            const cashAmount = Number(order.cash_received) || 0;

            if (!zoneMap[zoneName]) {
                zoneMap[zoneName] = {
                    zoneName,
                    bottles: 0,
                    grossRevenue: 0,
                    netProfit: 0,
                };
            }

            zoneMap[zoneName].bottles += bottles;
            zoneMap[zoneName].grossRevenue += cashAmount;
            zoneMap[zoneName].netProfit += cashAmount - (bottles * MANUFACTURER_COST);
        });

        const byZone = Object.values(zoneMap).sort((a, b) => b.netProfit - a.netProfit);

        // Revenue by volunteer
        const volunteerMap: {
            [key: string]: {
                name: string;
                bottles: number;
                grossRevenue: number;
                netProfit: number;
            }
        } = {};

        orders.forEach(order => {
            const volunteerName = (order.volunteers as any)?.name || "Direct";
            const bottles = order.quantity || 0;
            const cashAmount = Number(order.cash_received) || 0;

            if (!volunteerMap[volunteerName]) {
                volunteerMap[volunteerName] = {
                    name: volunteerName,
                    bottles: 0,
                    grossRevenue: 0,
                    netProfit: 0,
                };
            }

            volunteerMap[volunteerName].bottles += bottles;
            volunteerMap[volunteerName].grossRevenue += cashAmount;
            volunteerMap[volunteerName].netProfit += cashAmount - (bottles * MANUFACTURER_COST);
        });

        const byVolunteer = Object.values(volunteerMap)
            .sort((a, b) => b.netProfit - a.netProfit)
            .slice(0, 10);

        // Revenue by Account (UPI ID)
        const accountMap: {
            [key: string]: {
                name: string;
                bottles: number;
                grossRevenue: number;
                netProfit: number;
            }
        } = {};

        orders.forEach(order => {
            const accountId = order.payment_upi_id || "Unassigned/Old";
            const bottles = order.quantity || 0;
            const cashAmount = Number(order.cash_received) || 0;

            if (!accountMap[accountId]) {
                accountMap[accountId] = {
                    name: accountId,
                    bottles: 0,
                    grossRevenue: 0,
                    netProfit: 0,
                };
            }

            accountMap[accountId].bottles += bottles;
            accountMap[accountId].grossRevenue += cashAmount;
            accountMap[accountId].netProfit += cashAmount - (bottles * MANUFACTURER_COST);
        });

        const byAccount = Object.values(accountMap)
            .sort((a, b) => b.netProfit - a.netProfit);

        // Calculate overall metrics
        const bottlesSold = orders.reduce((sum, order) => sum + (order.quantity || 0), 0);
        const totalGrossRevenue = orders.reduce((sum, order) => sum + (Number(order.cash_received) || 0), 0);
        const totalManufacturerCost = bottlesSold * MANUFACTURER_COST;
        const totalNetProfit = totalGrossRevenue - totalManufacturerCost;

        return NextResponse.json({
            timeline,
            byZone,
            byVolunteer,
            byAccount,
            metrics: {
                totalGrossRevenue,
                totalNetProfit,
                totalManufacturerCost,
                profitMargin: 63.9,
                bottlesSold,
            },
        });
    } catch (error) {
        console.error("Revenue analytics API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch revenue analytics" },
            { status: 500 }
        );
    }
}
