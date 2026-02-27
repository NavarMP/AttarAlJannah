import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Get volunteers analytics
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

        // Fetch all volunteers
        const { data: volunteers } = await supabase
            .from("volunteers")
            .select("id, name, volunteer_id, zone_id, goal_bottles");

        // Fetch orders (deliveries) for the period
        const { data: orders } = await supabase
            .from("orders")
            .select("volunteer_id, order_status, quantity, total_price, created_at")
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())
            .in("order_status", ["confirmed", "delivered"]);

        if (!volunteers || !orders) {
            return NextResponse.json({
                leaderboard: [],
                distribution: [],
                zoneAssignment: [],
                metrics: {}
            });
        }

        const NET_PROFIT_PER_BOTTLE = 200;

        // Build volunteer performance map
        const performanceMap: {
            [key: string]: {
                id: string;
                name: string;
                deliveries: number;
                bottles: number;
                revenue: number;
                goalProgress: number;
            }
        } = {};

        volunteers.forEach(volunteer => {
            performanceMap[volunteer.id] = {
                id: volunteer.id,
                name: volunteer.name,
                deliveries: 0,
                bottles: 0,
                revenue: 0,
                goalProgress: 0,
            };
        });

        orders.forEach(order => {
            if (order.volunteer_id && performanceMap[order.volunteer_id]) {
                performanceMap[order.volunteer_id].deliveries++;
                performanceMap[order.volunteer_id].bottles += order.quantity || 0;
                performanceMap[order.volunteer_id].revenue += (order.quantity || 0) * NET_PROFIT_PER_BOTTLE;
            }
        });

        // Calculate goal progress
        volunteers.forEach(volunteer => {
            if (performanceMap[volunteer.id] && volunteer.goal_bottles) {
                const progress = Math.round(
                    (performanceMap[volunteer.id].bottles / volunteer.goal_bottles) * 100
                );
                performanceMap[volunteer.id].goalProgress = Math.min(progress, 100);
            }
        });

        // Leaderboard (top performers)
        const leaderboard = Object.values(performanceMap)
            .filter(v => v.deliveries > 0)
            .sort((a, b) => b.bottles - a.bottles)
            .slice(0, 10);

        // Performance distribution
        const distribution = [
            { range: "0-5", count: 0 },
            { range: "6-10", count: 0 },
            { range: "11-20", count: 0 },
            { range: "20+", count: 0 },
        ];

        Object.values(performanceMap).forEach(volunteer => {
            if (volunteer.deliveries === 0) return;

            if (volunteer.deliveries <= 5) distribution[0].count++;
            else if (volunteer.deliveries <= 10) distribution[1].count++;
            else if (volunteer.deliveries <= 20) distribution[2].count++;
            else distribution[3].count++;
        });

        // Zone assignment (fetch zones and count volunteers)
        const { data: zones } = await supabase
            .from("delivery_zones")
            .select("id, name");

        const zoneAssignment = zones?.map(zone => {
            const volunteersInZone = volunteers.filter(v => v.zone_id === zone.id);
            return {
                zoneName: zone.name,
                volunteerCount: volunteersInZone.length,
                volunteers: volunteersInZone.map(v => v.name),
            };
        }) || [];

        // Metrics
        const activeVolunteers = Object.values(performanceMap).filter(v => v.deliveries > 0).length;
        const totalDeliveries = Object.values(performanceMap).reduce((sum, v) => sum + v.deliveries, 0);
        const avgDeliveries = activeVolunteers > 0
            ? Math.round(totalDeliveries / activeVolunteers)
            : 0;

        const topPerformer = leaderboard.length > 0 ? leaderboard[0].name : "N/A";

        return NextResponse.json({
            leaderboard,
            distribution,
            zoneAssignment,
            metrics: {
                activeVolunteers,
                avgDeliveries,
                topPerformer,
            },
        });
    } catch (error) {
        console.error("Volunteers analytics API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch volunteers analytics" },
            { status: 500 }
        );
    }
}
