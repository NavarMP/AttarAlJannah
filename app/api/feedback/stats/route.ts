import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";

// GET /api/feedback/stats - Get feedback analytics (admin only)
export async function GET(request: NextRequest) {
    const auth = await requireAdmin("viewer");
    if ("error" in auth) return auth.error;

    try {
        const supabase = await createClient();

        // Use the database function to get stats
        const { data: stats, error } = await supabase
            .rpc("get_feedback_stats");

        if (error) {
            console.error("Error fetching feedback stats:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get recent trends (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentFeedback, error: recentError } = await supabase
            .from("feedback")
            .select("created_at, category, rating_overall")
            .gte("created_at", thirtyDaysAgo.toISOString())
            .order("created_at", { ascending: true });

        if (recentError) {
            console.error("Error fetching recent feedback:", recentError);
        }

        // Calculate weekly trends
        const weeklyTrends = recentFeedback ? calculateWeeklyTrends(recentFeedback) : [];

        return NextResponse.json({
            stats: {
                total_feedback: stats[0]?.total_feedback || 0,
                avg_rating_packing: stats[0]?.avg_rating_packing || 0,
                avg_rating_delivery: stats[0]?.avg_rating_delivery || 0,
                avg_rating_ordering: stats[0]?.avg_rating_ordering || 0,
                avg_rating_overall: stats[0]?.avg_rating_overall || 0,
                by_status: stats[0]?.feedback_by_status || {},
                by_category: stats[0]?.feedback_by_category || {},
                by_priority: stats[0]?.feedback_by_priority || {},
            },
            recent_trends: weeklyTrends,
        });
    } catch (error: any) {
        console.error("Feedback stats error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Helper function to calculate weekly trends
function calculateWeeklyTrends(feedback: any[]) {
    const weeks: { [key: string]: { count: number; avg_rating: number } } = {};

    feedback.forEach((item) => {
        const date = new Date(item.created_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split("T")[0];

        if (!weeks[weekKey]) {
            weeks[weekKey] = { count: 0, avg_rating: 0 };
        }

        weeks[weekKey].count += 1;
        weeks[weekKey].avg_rating += item.rating_overall || 0;
    });

    // Calculate average ratings
    Object.keys(weeks).forEach((key) => {
        weeks[key].avg_rating = weeks[key].avg_rating / weeks[key].count;
    });

    // Convert to array and sort by week
    return Object.entries(weeks)
        .map(([week, data]) => ({ week, ...data }))
        .sort((a, b) => a.week.localeCompare(b.week));
}
