import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get("studentId");
        const orderId = searchParams.get("orderId");

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

        // If orderId is provided, fetch single order
        if (orderId) {
            const { data: order, error } = await supabase
                .from("orders")
                .select("*")
                .eq("id", orderId)
                .eq("referred_by", student.id)
                .single();

            if (error) {
                console.error("Order fetch error:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            if (!order) {
                return NextResponse.json({ error: "Order not found" }, { status: 404 });
            }

            return NextResponse.json({ order });
        }

        // Otherwise fetch all orders referred by this student
        const { data: orders, error } = await supabase
            .from("orders")
            .select("*")
            .eq("referred_by", student.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Orders fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
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
