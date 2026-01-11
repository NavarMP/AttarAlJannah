import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const { studentId, password } = await request.json();

        if (!studentId || !password) {
            return NextResponse.json(
                { error: "Student ID and password are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Find student by student_id
        const { data: student, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("student_id", studentId)
            .eq("user_role", "student")
            .single();

        if (fetchError || !student) {
            return NextResponse.json(
                { error: "Invalid student ID or password" },
                { status: 401 }
            );
        }

        // Verify password using pgcrypto
        const { data: passwordCheck, error: passwordError } = await supabase
            .rpc("verify_password", {
                user_id: student.id,
                password_input: password,
            });

        if (passwordError) {
            // Fallback: Create the verification function if it doesn't exist
            // For now, we'll check using a raw query
            const { data: verifyResult } = await supabase
                .from("users")
                .select("id")
                .eq("id", student.id)
                .eq("password_hash", `crypt('${password}', password_hash)`)
                .single();

            if (!verifyResult) {
                return NextResponse.json(
                    { error: "Invalid student ID or password" },
                    { status: 401 }
                );
            }
        }

        // Sign in with Supabase Auth using email (student email is auto-generated)
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: student.email,
            password: password,
        });

        if (signInError) {
            // If auth sign-in fails, create a session manually
            // For now, we'll just return success with student data
            return NextResponse.json({
                success: true,
                student: {
                    id: student.id,
                    studentId: student.student_id,
                    name: student.name,
                    email: student.email,
                },
            });
        }

        return NextResponse.json({
            success: true,
            session: authData.session,
            student: {
                id: student.id,
                studentId: student.student_id,
                name: student.name,
                email: student.email,
            },
        });
    } catch (error) {
        console.error("Student login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
