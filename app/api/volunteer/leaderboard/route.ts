import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Get all volunteers with their challenge progress
        const { data: volunteers, error: volunteersError } = await supabase
            .from("users")
            .select("id, name, volunteer_id")
            .eq("user_role", "volunteer")
            .order("name");

        if (volunteersError) {
            console.error("Volunteers fetch error:", volunteersError);
            throw volunteersError;
        }

        // Get challenge progress for all volunteers
        const { data: progressData, error: progressError } = await supabase
            .from("challenge_progress")
            .select("volunteer_id, confirmed_orders");

        if (progressError) {
            console.error("Progress fetch error:", progressError);
            // Don't throw, just use empty array
        }

        // Get orders to calculate revenue
        const volunteerIds = volunteers?.map(v => v.id) || [];
        const { data: orders } = await supabase
            .from("orders")
            .select("referred_by, total_price, order_status")
            .in("referred_by", volunteerIds)
            .in("order_status", ["confirmed", "delivered"]);

        // Combine data and calculate rankings
        const leaderboardData = volunteers?.map(volunteer => {
            const progress = progressData?.find(p => p.volunteer_id === volunteer.volunteer_id);
            const volunteerOrders = orders?.filter(o => o.referred_by === volunteer.id) || [];
            const totalRevenue = volunteerOrders.reduce((sum, o) => sum + o.total_price, 0);

            return {
                id: volunteer.id,
                name: volunteer.name,
                volunteer_id: volunteer.volunteer_id,
                confirmed_orders: progress?.confirmed_orders || 0,
                total_revenue: totalRevenue
            };
        }) || [];

        // Sort by confirmed_orders descending
        leaderboardData.sort((a, b) => b.confirmed_orders - a.confirmed_orders);

        // Add rank
        const rankedLeaderboard = leaderboardData.map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));

        return NextResponse.json({ leaderboard: rankedLeaderboard });

    } catch (error) {
        console.error("Leaderboard API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch leaderboard", leaderboard: [] },
            { status: 500 }
        );
    }
}
