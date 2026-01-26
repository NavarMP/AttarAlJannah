import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const supabase = await createClient();

        // Get all volunteers
        const { data: volunteers, error: volunteersError } = await supabase
            .from("users")
            .select("id, name, volunteer_id")
            .eq("user_role", "volunteer")
            .order("name");

        if (volunteersError) {
            console.error("Volunteers fetch error:", volunteersError);
            throw volunteersError;
        }

        // Get all orders for volunteers to calculate bottle quantities
        const volunteerIds = volunteers?.map(v => v.id) || [];
        const { data: orders } = await supabase
            .from("orders")
            .select("referred_by, quantity, total_price, order_status")
            .in("referred_by", volunteerIds)
            .in("order_status", ["confirmed", "delivered"]);

        // Combine data and calculate rankings based on bottles
        const leaderboardData = volunteers?.map(volunteer => {
            const volunteerOrders = orders?.filter(o => o.referred_by === volunteer.id) || [];

            // Calculate total bottles (sum of quantities)
            const confirmedBottles = volunteerOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);
            const totalRevenue = volunteerOrders.reduce((sum, o) => sum + o.total_price, 0);

            return {
                id: volunteer.id,
                name: volunteer.name,
                volunteer_id: volunteer.volunteer_id,
                confirmed_bottles: confirmedBottles,
                confirmed_orders_count: volunteerOrders.reduce((count, o) => count + 1, 0),
                total_revenue: totalRevenue
            };
        }) || [];

        // Sort by confirmed_bottles descending
        leaderboardData.sort((a, b) => b.confirmed_bottles - a.confirmed_bottles);

        // Add rank with tie handling
        let currentRank = 1;
        const rankedLeaderboard = leaderboardData.map((entry, index) => {
            if (index > 0 && entry.confirmed_bottles < leaderboardData[index - 1].confirmed_bottles) {
                currentRank = index + 1;
            }
            return {
                ...entry,
                rank: currentRank
            };
        });

        return NextResponse.json({ leaderboard: rankedLeaderboard });

    } catch (error) {
        console.error("Leaderboard API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch leaderboard", leaderboard: [] },
            { status: 500 }
        );
    }
}
