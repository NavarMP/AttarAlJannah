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
        // We only want orders where they are the referrer, not the delivery volunteer
        // and only orders that have not been deleted
        const { data: orders } = await supabase
            .from("orders")
            .select("*")
            .eq("volunteer_id", targetUuid)
            .is("deleted_at", null)
            .or("is_delivery_duty.is.null,is_delivery_duty.eq.false");

        // Filter confirmed/delivered orders
        const confirmedOrders = orders?.filter(o => o.order_status === "confirmed" || o.order_status === "delivered") || [];
        const pendingOrders = orders?.filter(o => o.order_status === "pending") || [];

        // Calculate confirmed bottles and orders
        const confirmedBottles = confirmedOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);
        const confirmedOrdersCount = confirmedOrders.length;

        const pendingBottles = pendingOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);
        const pendingOrdersCount = pendingOrders.length;

        // Calculate total revenue from confirmed orders
        const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.total_price, 0);

        return NextResponse.json({
            confirmedBottles,
            confirmedOrders: confirmedOrdersCount,
            pendingBottles,
            pendingOrders: pendingOrdersCount,
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
