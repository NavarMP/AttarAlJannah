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

        // Get challenge progress
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

        // Count confirmed orders (order_status = 'confirmed')
        const confirmedOrders = orders?.filter(
            (o) => o.order_status === "confirmed" || o.order_status === "delivered"
        ).length || 0;

        const pendingOrders = orders?.filter(
            (o) => o.order_status === "pending"
        ).length || 0;

        // Calculate total revenue from confirmed orders
        const totalRevenue = orders
            ?.filter((o) => o.order_status === "confirmed" || o.order_status === "delivered")
            .reduce((sum, o) => sum + o.total_price, 0) || 0;

        return NextResponse.json({
            confirmedOrders: progress?.confirmed_orders || confirmedOrders,
            goal: progress?.goal || 20,
            pendingOrders,
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
