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

        // First, refresh the materialized view to get latest data
        await supabase.rpc("refresh_leaderboard_stats");

        // Build query from materialized view
        let query = supabase
            .from("volunteer_leaderboard_stats")
            .select("*");

        // Apply time period filter if not "all"
        if (period === "month") {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            query = query.gte("created_at", oneMonthAgo.toISOString());
        } else if (period === "week") {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            query = query.gte("created_at", oneWeekAgo.toISOString());
        }

        // Sort by selected metric
        let sortColumn = "overall_score";
        switch (metric) {
            case "referral":
                sortColumn = "referred_bottles";
                break;
            case "delivery":
                sortColumn = "delivered_orders";
                break;
            case "revenue":
                sortColumn = "total_commission";
                break;
            case "overall":
            default:
                sortColumn = "overall_score";
                break;
        }

        query = query.order(sortColumn, { ascending: false });

        // Apply limit
        if (limit > 0) {
            query = query.limit(limit);
        }

        const { data: leaderboardData, error } = await query;

        if (error) {
            console.error("Leaderboard fetch error:", error);
            throw error;
        }

        // Add rank with tie handling based on selected metric
        let currentRank = 1;
        const rankedLeaderboard = (leaderboardData || []).map((entry, index) => {
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
