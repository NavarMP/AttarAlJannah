import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const { identifier } = await request.json();
        const supabase = await createClient();

        // Try to find student by phone or ID
        const { data: student, error } = await supabase
            .from("users")
            .select("*")
            .eq("role", "student")
            .or(`phone.eq.${identifier},id.eq.${identifier}`)
            .single();

        if (error || !student) {
            return NextResponse.json(
                { success: false, message: "Student not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            studentId: student.id,
            studentName: student.name,
            totalSales: student.total_sales,
        });
    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json(
            { success: false, message: "Authentication failed" },
            { status: 500 }
        );
    }
}
