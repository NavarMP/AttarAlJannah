import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/stats/live - Get live statistics for homepage
export async function GET() {
    try {
        const supabase = await createClient();

        // Get total orders count
        const { count: totalOrders, error: ordersError } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true });

        if (ordersError) {
            console.error("Error fetching orders count:", ordersError);
        }

        // Get average rating from feedback
        const { data: feedbackData, error: feedbackError } = await supabase
            .from("feedback")
            .select("rating_overall")
            .not("rating_overall", "is", null);

        if (feedbackError) {
            console.error("Error fetching feedback:", feedbackError);
        }

        // Calculate average rating
        const avgRating = feedbackData && feedbackData.length > 0
            ? feedbackData.reduce((sum, f) => sum + (f.rating_overall || 0), 0) / feedbackData.length
            : 0;

        return NextResponse.json({
            totalOrders: totalOrders || 0,
            averageRating: parseFloat(avgRating.toFixed(1)),
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Live stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch live stats" },
            { status: 500 }
        );
    }
}
