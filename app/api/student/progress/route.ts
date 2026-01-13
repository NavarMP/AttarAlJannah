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

        // First, get the student's database UUID from their student_id
        const { data: student, error: studentError } = await supabase
            .from("users")
            .select("id")
            .eq("student_id", studentId)
            .eq("user_role", "student")
            .single();

        if (studentError || !student) {
            return NextResponse.json(
                { error: "Student not found" },
                { status: 404 }
            );
        }

        const studentUuid = student.id;

        // Get challenge progress
        const { data: progress } = await supabase
            .from("challenge_progress")
            .select("*")
            .eq("student_id", studentId)
            .single();

        // Get order statistics using the student's UUID (not student_id)
        const { data: orders } = await supabase
            .from("orders")
            .select("*")
            .eq("referred_by", studentUuid);

        const verifiedSales = orders?.filter(
            (o) => o.payment_status === "verified" && (o.order_status === "confirmed" || o.order_status === "delivered")
        ).length || 0;

        const pendingOrders = orders?.filter(
            (o) => o.payment_status !== "verified" || o.order_status === "pending"
        ).length || 0;

        const totalRevenue = orders
            ?.filter((o) => o.payment_status === "verified")
            .reduce((sum, o) => sum + o.total_price, 0) || 0; // Total revenue

        return NextResponse.json({
            verifiedSales: progress?.verified_sales || verifiedSales,
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
