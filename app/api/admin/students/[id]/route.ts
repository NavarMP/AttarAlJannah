import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();

        const { id } = await params;
        const studentId = id;

        // Get student by ID
        const { data: student, error: studentError } = await supabase
            .from("users")
            .select("*")
            .eq("id", studentId)
            .eq("user_role", "student")
            .single();

        if (studentError || !student) {
            return NextResponse.json(
                { error: "Student not found" },
                { status: 404 }
            );
        }

        // Get challenge progress
        const { data: progress } = await supabase
            .from("challenge_progress")
            .select("*")
            .eq("student_id", student.student_id)
            .single();

        // Get order statistics using UUID (required_by is UUID)
        const { data: orders } = await supabase
            .from("orders")
            .select("*")
            .eq("referred_by", student.id);

        const totalOrders = orders?.length || 0;
        const verifiedOrders = orders?.filter(o => o.payment_status === "verified" && (o.order_status === "confirmed" || o.order_status === "delivered")).length || 0;
        const pendingOrders = orders?.filter(o => o.payment_status !== "verified" || o.order_status === "pending").length || 0;

        return NextResponse.json({
            student: {
                ...student,
                verified_sales: progress?.verified_sales || 0,
                goal: progress?.goal || 20,
                progress_percentage: progress ? Math.round((progress.verified_sales / progress.goal) * 100) : 0,
                stats: {
                    totalOrders,
                    verifiedOrders,
                    pendingOrders
                }
            }
        });

    } catch (error) {
        console.error("Error fetching student:", error);
        return NextResponse.json(
            { error: "Failed to fetch student" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();

        const { id } = await params;
        const studentId = id;
        const body = await request.json();
        const { name, email, phone, address, student_id, goal, password } = body;

        // Check if student exists
        const { data: existingStudent, error: fetchError } = await supabase
            .from("users")
            .select("student_id")
            .eq("id", studentId)
            .eq("user_role", "student")
            .single();

        if (fetchError || !existingStudent) {
            return NextResponse.json(
                { error: "Student not found" },
                { status: 404 }
            );
        }

        // If student_id is being changed, check uniqueness
        if (student_id && student_id !== existingStudent.student_id) {
            const { data: duplicateCheck } = await supabase
                .from("users")
                .select("id")
                .eq("student_id", student_id)
                .single();

            if (duplicateCheck) {
                return NextResponse.json(
                    { error: "Student ID already exists" },
                    { status: 400 }
                );
            }
        }

        // Build update object
        const updates: any = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (phone) updates.phone = phone;
        if (address !== undefined) updates.address = address;
        if (student_id) updates.student_id = student_id;

        // Update password if provided
        if (password) {
            const { data: hashedPassword } = await supabase
                .rpc("crypt", { password_input: password, salt: "gen_salt('bf')" });
            updates.password_hash = hashedPassword || password;
        }

        // Update user record
        const { data: updatedStudent, error: updateError } = await supabase
            .from("users")
            .update(updates)
            .eq("id", studentId)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        // Update goal in challenge_progress if provided
        if (goal !== undefined) {
            await supabase
                .from("challenge_progress")
                .update({ goal })
                .eq("student_id", updatedStudent.student_id);
        }

        return NextResponse.json({
            success: true,
            student: updatedStudent
        });

    } catch (error) {
        console.error("Error updating student:", error);
        return NextResponse.json(
            { error: "Failed to update student" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();

        const { id } = await params;
        const studentId = id;

        // Check if student exists
        const { data: student, error: fetchError } = await supabase
            .from("users")
            .select("student_id")
            .eq("id", studentId)
            .eq("user_role", "student")
            .single();

        if (fetchError || !student) {
            return NextResponse.json(
                { error: "Student not found" },
                { status: 404 }
            );
        }

        // Delete challenge_progress entry
        await supabase
            .from("challenge_progress")
            .delete()
            .eq("student_id", student.student_id);

        // Delete user record
        const { error: deleteError } = await supabase
            .from("users")
            .delete()
            .eq("id", studentId);

        if (deleteError) {
            throw deleteError;
        }

        // Note: Orders with referred_by = student_id are kept for historical purposes

        return NextResponse.json({
            success: true,
            message: "Student deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting student:", error);
        return NextResponse.json(
            { error: "Failed to delete student" },
            { status: 500 }
        );
    }
}
