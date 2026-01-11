import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check if user is authenticated and is admin
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get query parameters for pagination and search
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const offset = (page - 1) * limit;

        // Build query for students
        let query = supabase
            .from("users")
            .select("*", { count: "exact" })
            .eq("user_role", "student")
            .order("created_at", { ascending: false });

        // Add search filter if provided
        if (search) {
            query = query.or(`name.ilike.%${search}%,student_id.ilike.%${search}%,email.ilike.%${search}%`);
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data: students, error: studentsError, count } = await query;

        if (studentsError) {
            throw studentsError;
        }

        // Get challenge progress for each student
        const studentIds = students?.map(s => s.student_id) || [];

        const { data: progressData } = await supabase
            .from("challenge_progress")
            .select("*")
            .in("student_id", studentIds);

        // Merge progress data with students
        const studentsWithProgress = students?.map(student => {
            const progress = progressData?.find(p => p.student_id === student.student_id);
            return {
                ...student,
                verified_sales: progress?.verified_sales || 0,
                goal: progress?.goal || 20,
                progress_percentage: progress ? Math.round((progress.verified_sales / progress.goal) * 100) : 0
            };
        });

        return NextResponse.json({
            students: studentsWithProgress,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json(
            { error: "Failed to fetch students" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check if user is authenticated and is admin
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, email, phone, password, address, student_id, goal = 20 } = body;

        // Validate required fields
        if (!name || !email || !phone || !password) {
            return NextResponse.json(
                { error: "Name, email, phone, and password are required" },
                { status: 400 }
            );
        }

        // Generate student_id if not provided
        let finalStudentId = student_id;
        if (!finalStudentId) {
            // Get the last student_id
            const { data: lastStudent } = await supabase
                .from("users")
                .select("student_id")
                .eq("user_role", "student")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (lastStudent && lastStudent.student_id) {
                // Extract number from STU001 format
                const lastNumber = parseInt(lastStudent.student_id.replace("STU", ""));
                finalStudentId = `STU${String(lastNumber + 1).padStart(3, "0")}`;
            } else {
                finalStudentId = "STU001";
            }
        }

        // Check if student_id already exists
        const { data: existingStudent } = await supabase
            .from("users")
            .select("id")
            .eq("student_id", finalStudentId)
            .single();

        if (existingStudent) {
            return NextResponse.json(
                { error: "Student ID already exists" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const { data: existingEmail } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();

        if (existingEmail) {
            return NextResponse.json(
                { error: "Email already exists" },
                { status: 400 }
            );
        }

        // Hash password using pgcrypto
        const { data: hashedPassword } = await supabase
            .rpc("crypt", { password_input: password, salt: "gen_salt('bf')" });

        // Create user record
        const { data: newStudent, error: createError } = await supabase
            .from("users")
            .insert({
                name,
                email,
                phone,
                student_id: finalStudentId,
                user_role: "student",
                password_hash: hashedPassword || password, // Fallback if RPC fails
                address: address || null,
            })
            .select()
            .single();

        if (createError) {
            throw createError;
        }

        // Create challenge progress entry
        const { error: progressError } = await supabase
            .from("challenge_progress")
            .insert({
                student_id: finalStudentId,
                verified_sales: 0,
                goal: goal,
            });

        if (progressError) {
            console.error("Error creating challenge progress:", progressError);
        }

        return NextResponse.json({
            success: true,
            student: {
                ...newStudent,
                verified_sales: 0,
                goal,
                progress_percentage: 0
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating student:", error);
        return NextResponse.json(
            { error: "Failed to create student" },
            { status: 500 }
        );
    }
}
