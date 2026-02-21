import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { findMatchingVolunteers } from "@/lib/services/volunteer-assignment";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin("viewer");
    if ("error" in auth) return auth.error;

    try {
        const params = await context.params;

        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("house_name, town, post_office")
            .eq("id", params.id)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Find matching volunteers
        const matches = await findMatchingVolunteers({
            houseBuilding: order.house_name,
            town: order.town,
            post: order.post_office,
        });

        return NextResponse.json({
            matches,
            count: matches.length,
        });

    } catch (error: any) {
        console.error("Error fetching matching volunteers:", error);
        return NextResponse.json(
            { error: "Failed to fetch matching volunteers" },
            { status: 500 }
        );
    }
}
