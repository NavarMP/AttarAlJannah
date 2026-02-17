
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const volunteerId = id;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status");

        const offset = (page - 1) * limit;

        const supabase = await createClient();

        // Verify admin
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get volunteer details first to get the volunteer_id (string)
        const { data: volunteer, error: volunteerError } = await supabase
            .from("volunteers")
            .select("id")
            .eq("id", volunteerId)
            .single();

        if (volunteerError || !volunteer) {
            return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
        }

        // Build query for orders
        let query = supabase
            .from("orders")
            .select("*", { count: "exact" })
            .eq("volunteer_id", volunteerId) // Use the UUID directly
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (status && status !== "all") {
            query = query.eq("status", status);
        }

        const { data: orders, count, error: ordersError } = await query;

        if (ordersError) {
            console.error("Error fetching orders:", ordersError);
            return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
        }

        return NextResponse.json({
            orders,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error) {
        console.error("Error in volunteer orders:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
