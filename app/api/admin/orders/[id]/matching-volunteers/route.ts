import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findMatchingVolunteers } from "@/lib/services/volunteer-assignment";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const supabase = await createClient();

        // Verify user is admin
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: volunteer, error: volError } = await supabase
            .from("volunteers")
            .select("role")
            .eq("auth_id", user.id)
            .single();

        if (volError || volunteer?.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

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
