import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const metric = searchParams.get("metric") || "overall"; // referral | delivery | revenue | overall
        const period = searchParams.get("period") || "all"; // all | month | week
        const limit = parseInt(searchParams.get("limit") || "100");

        const supabase = await createClient();

        // 1. Fetch all volunteers
        const { data: volunteers, error: volError } = await supabase
            .from("volunteers")
            .select("id, volunteer_id, name, phone, delivery_commission_per_bottle")
            .eq("status", "active");

        if (volError) throw volError;

        // 2. Fetch orders in the period
        let ordersQuery = supabase
            .from("orders")
            .select("volunteer_id, delivery_volunteer_id, order_status, quantity")
            .in("order_status", ["ordered", "delivered"]);

        // Apply time period filter if not "all"
        if (period === "month") {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            ordersQuery = ordersQuery.gte("created_at", oneMonthAgo.toISOString());
        } else if (period === "week") {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            ordersQuery = ordersQuery.gte("created_at", oneWeekAgo.toISOString());
        }

        const { data: orders, error: ordersError } = await ordersQuery;

        if (ordersError) throw ordersError;

        // 3. Build stats map
        const statsMap = new Map();

        volunteers?.forEach(v => {
            statsMap.set(v.id, {
                id: v.id,
                volunteer_id: v.volunteer_id,
                name: v.name,
                phone: v.phone,
                referred_bottles: 0,
                referred_orders: 0,
                total_referral_commission: 0,
                delivered_orders: 0,
                delivered_bottles: 0,
                total_delivery_commission: 0,
                total_commission: 0,
                overall_score: 0,
                _delivery_commission_rate: v.delivery_commission_per_bottle || 10
            });
        });

        const REFERRAL_COMMISSION_PER_BOTTLE = 10;

        orders?.forEach(order => {
            const quantity = order.quantity || 0;

            // Referral Stats (any valid order)
            if (order.volunteer_id && statsMap.has(order.volunteer_id)) {
                const vol = statsMap.get(order.volunteer_id);
                vol.referred_orders += 1;
                vol.referred_bottles += quantity;
                vol.total_referral_commission += (quantity * REFERRAL_COMMISSION_PER_BOTTLE);
            }

            // Delivery Stats (only delivered orders)
            if (order.delivery_volunteer_id && statsMap.has(order.delivery_volunteer_id) && order.order_status === "delivered") {
                const vol = statsMap.get(order.delivery_volunteer_id);
                vol.delivered_orders += 1;
                vol.delivered_bottles += quantity;
                vol.total_delivery_commission += (quantity * vol._delivery_commission_rate);
            }
        });

        // Compute totals and convert to array
        let leaderboardData = Array.from(statsMap.values()).map(vol => {
            vol.total_commission = vol.total_referral_commission + vol.total_delivery_commission;
            vol.overall_score = (vol.referred_bottles * 10) + (vol.delivered_orders * 50) + (vol.total_commission * 0.5);
            delete vol._delivery_commission_rate;
            return vol;
        });

        // Filter and sort
        let sortColumn = "overall_score";
        switch (metric) {
            case "referral": sortColumn = "referred_bottles"; break;
            case "delivery": sortColumn = "delivered_orders"; break;
            case "revenue": sortColumn = "total_commission"; break;
            case "overall": default: sortColumn = "overall_score"; break;
        }

        // Only include those who have actually done some activity
        leaderboardData = leaderboardData.filter(v => v.referred_orders > 0 || v.delivered_orders > 0);

        leaderboardData.sort((a: any, b: any) => b[sortColumn] - a[sortColumn]);

        // Apply limit
        if (limit > 0) {
            leaderboardData = leaderboardData.slice(0, limit);
        }

        // Add rank with tie handling
        let currentRank = 1;
        const rankedLeaderboard = leaderboardData.map((entry: any, index: number) => {
            if (index > 0) {
                const currentValue = entry[sortColumn];
                const previousValue = leaderboardData[index - 1][sortColumn];
                if (currentValue < previousValue) {
                    currentRank = index + 1;
                }
            }
            return {
                ...entry,
                rank: currentRank
            };
        });

        return NextResponse.json({
            leaderboard: rankedLeaderboard,
            metric,
            period,
            total: rankedLeaderboard.length
        });

    } catch (error) {
        console.error("Leaderboard API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch leaderboard", leaderboard: [] },
            { status: 500 }
        );
    }
}
