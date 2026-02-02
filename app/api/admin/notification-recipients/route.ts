import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Count recipients based on filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const zone = searchParams.get("zone");
        const orderStatus = searchParams.get("orderStatus");

        const supabase = createAdminClient();
        let count = 0;

        // Build query based on filters
        let query = supabase.from("volunteers").select("id", { count: "exact", head: true });

        if (zone) {
            query = query.eq("zone_id", zone);
        }

        if (orderStatus) {
            // Get volunteers who have orders with the specified status
            const { data: orders } = await supabase
                .from("orders")
                .select("volunteer_id")
                .eq("order_status", orderStatus)
                .not("volunteer_id", "is", null);

            const volunteerIds = [...new Set(orders?.map((o) => o.volunteer_id) || [])];

            if (volunteerIds.length > 0) {
                query = query.in("id", volunteerIds);
            } else {
                // No matches
                return NextResponse.json({ count: 0 });
            }
        }

        const { count: volunteerCount, error } = await query;

        if (error) {
            console.error("Error counting recipients:", error);
            return NextResponse.json(
                { error: "Failed to count recipients" },
                { status: 500 }
            );
        }

        count = volunteerCount || 0;

        return NextResponse.json({ count });
    } catch (error) {
        console.error("Recipient count API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
