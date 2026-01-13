import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const volunteerId = searchParams.get("volunteerId");

        if (!volunteerId) {
            return NextResponse.json({ error: "Volunteer ID required" }, { status: 400 });
        }

        const supabase = await createClient();

        // Get volunteer stats
        const { data: stats, error } = await supabase
            .from("volunteer_stats")
            .select("*")
            .eq("volunteer_id", volunteerId)
            .single();

        if (error && error.code !== "PGRST116") {
            console.error("Stats fetch error:", error);
        }

        // Return stats or default values
        return NextResponse.json(stats || {
            total_referrals: 0,
            this_week_referrals: 0,
            this_month_referrals: 0,
            total_sales: 0,
            rank: null,
        });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
