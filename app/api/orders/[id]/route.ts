import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Order ID is required" },
                { status: 400 }
            );
        }

        // Use Admin Client to bypass RLS (since anonymous users need to see their receipt)
        // Ensure service role key exists
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY");
            // Fallback to anon client (will likely fail RLS but worth a try)
        }

        const supabase = createAdminClient();

        console.log(`🔍 Fetching order ${id} with Admin Client...`);  // Debug log

        const { data: order, error } = await supabase
            .from("orders")
            // Disambiguate join using the FK column name: volunteer_id
            .select("*, volunteer:volunteers!volunteer_id(name, volunteer_id)")
            .eq("id", id)
            .single();

        if (error) {
            console.error(`❌ Error fetching order ${id}:`, error.message, error.details, error.hint);
        }

        if (!order) {
            console.error(`❌ Order ${id} not found (returned null)`);
        }

        if (error || !order) {
            return NextResponse.json(
                { error: "Order not found", details: error?.message },
                { status: 404 }
            );
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
