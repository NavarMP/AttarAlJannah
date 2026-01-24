import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

        // Get challenge progress for goal
        const { data: progress } = await supabase
            .from("challenge_progress")
            .select("*")
            .eq("volunteer_id", volunteerId)
            .single();

        // Get order statistics using the volunteer's UUID
        const { data: orders } = await supabase
            .from("orders")
            .select("*")
            .eq("referred_by", volunteerId);

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
            goal: progress?.goal || 20,
            pendingBottles,
            pendingOrders: pendingOrdersCount,
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
