import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get("studentId");

        if (!studentId) {
            return NextResponse.json(
                { error: "Student ID required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Get challenge progress
        const { data: progress } = await supabase
            .from("challenge_progress")
            .select("*")
            .eq("student_id", studentId)
            .single();

        // Get order statistics
        const { data: orders } = await supabase
            .from("orders")
            .select("*")
            .eq("referred_by", studentId);

        const verifiedSales = orders?.filter(
            (o) => o.payment_status === "verified" && o.order_status !== "pending"
        ).length || 0;

        const pendingOrders = orders?.filter(
            (o) => o.payment_status !== "verified" || o.order_status === "pending"
        ).length || 0;

        const totalEarnings = orders
            ?.filter((o) => o.payment_status === "verified")
            .reduce((sum, o) => sum + (o.total_price * 0.1), 0) || 0; // 10% commission

        return NextResponse.json({
            verifiedSales: progress?.verified_sales || verifiedSales,
            goal: progress?.goal || 20,
            pendingOrders,
            totalEarnings: Math.round(totalEarnings),
        });
    } catch (error) {
        console.error("Progress error:", error);
        return NextResponse.json(
            { error: "Failed to fetch progress" },
            { status: 500 }
        );
    }
}
