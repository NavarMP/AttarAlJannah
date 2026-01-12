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

        // Get the student's UUID from their student_id
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

        // Get all orders referred by this student
        const { data: orders, error: ordersError } = await supabase
            .from("orders")
            .select("*")
            .eq("referred_by", student.id)
            .order("created_at", { ascending: false });

        if (ordersError) {
            console.error("Orders fetch error:", ordersError);
            return NextResponse.json(
                { error: "Failed to fetch orders" },
                { status: 500 }
            );
        }

        return NextResponse.json({ orders: orders || [] });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
