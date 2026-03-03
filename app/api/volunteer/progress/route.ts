import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const volunteerId = searchParams.get("volunteerId");

        if (!volunteerId) {
            return NextResponse.json(
                { error: "Volunteer ID required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Ensure we properly handle UUID vs readable string
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(volunteerId as string);

        let targetUuid = volunteerId as string;

        if (!isUuid) {
            const { data: volunteer, error: volError } = await supabase
                .from("volunteers")
                .select("id")
                .ilike("volunteer_id", volunteerId as string)
                .single();

            if (volError || !volunteer) {
                return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
            }
            targetUuid = volunteer.id as string;
        }

        // Get challenge progress for goal
        const { data: progress } = await supabase
            .from("challenge_progress")
            .select("*")
            .eq("volunteer_id", targetUuid)
            .limit(1)
            .maybeSingle();

        // Get order statistics using the volunteer's UUID
        // Include all orders assigned to this volunteer (both referral and delivery duty)
        // and only orders that have not been deleted
        const { data: orders } = await supabase
            .from("orders")
            .select("*")
            .eq("volunteer_id", targetUuid)
            .is("deleted_at", null);

        // Filter all active orders (pending + confirmed + delivered)
        const activeOrders = orders?.filter(o =>
            ["pending", "confirmed", "delivered"].includes(o.order_status)
        ) || [];

        // Calculate active bottles and orders
        const activeBottles = activeOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);
        const activeOrdersCount = activeOrders.length;

        // Calculate total revenue from all active orders
        const totalRevenue = activeOrders.reduce((sum, o) => sum + o.total_price, 0);

        return NextResponse.json({
            activeBottles,
            activeOrders: activeOrdersCount,
            goal: progress?.goal || 20,
            totalRevenue: Math.round(totalRevenue),
        });
    } catch (error) {
        console.error("Progress error:", error);
        return NextResponse.json(
            { error: "Failed to fetch progress" },
            { status: 500 }
        );
    }
}
