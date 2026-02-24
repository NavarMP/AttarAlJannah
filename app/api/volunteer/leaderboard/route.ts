import { NextRequest, NextResponse } from "next/server";
import { getLeaderboardData } from "@/lib/services/leaderboard-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const metric = searchParams.get("metric") || "overall"; // referral | delivery | revenue | overall
        const period = searchParams.get("period") || "all"; // all | month | week
        const limit = parseInt(searchParams.get("limit") || "100");

        const rankedLeaderboard = await getLeaderboardData(metric, period, limit);

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
