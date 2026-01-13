import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get query parameters for pagination and search
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const offset = (page - 1) * limit;

        // Build query for volunteers
        let query = supabase
            .from("users")
            .select("*", { count: "exact" })
            .eq("user_role", "volunteer")
            .order("created_at", { ascending: false });

        // Add search filter if provided
        if (search) {
            query = query.or(`name.ilike.%${search}%,volunteer_id.ilike.%${search}%,email.ilike.%${search}%`);
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data: volunteers, error: volunteersError, count } = await query;

        if (volunteersError) {
            throw volunteersError;
        }

        // Get challenge progress for each volunteer
        const volunteerIds = volunteers?.map(s => s.volunteer_id) || [];

        const { data: progressData } = await supabase
            .from("challenge_progress")
            .select("*")
            .in("volunteer_id", volunteerIds);

        // Merge progress data with volunteers
        const volunteersWithProgress = volunteers?.map(volunteer => {
            const progress = progressData?.find(p => p.volunteer_id === volunteer.volunteer_id);
            return {
                ...volunteer,
                confirmed_orders: progress?.confirmed_orders || 0,
                goal: progress?.goal || 20,
                progress_percentage: progress ? Math.round((progress.confirmed_orders / progress.goal) * 100) : 0
            };
        });

        return NextResponse.json({
            volunteers: volunteersWithProgress,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching volunteers:", error);
        return NextResponse.json(
            { error: "Failed to fetch volunteers" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const body = await request.json();
        const { name, email, phone, password, address, volunteer_id, goal = 20 } = body;

        // Validate required fields
        if (!name || !email || !phone || !password) {
            return NextResponse.json(
                { error: "Name, email, phone, and password are required" },
                { status: 400 }
            );
        }

        // Generate volunteer_id if not provided
        let finalVolunteerId = volunteer_id;
        if (!finalVolunteerId) {
            // Get the last volunteer_id
            const { data: lastVolunteer } = await supabase
                .from("users")
                .select("volunteer_id")
                .eq("user_role", "volunteer")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (lastVolunteer && lastVolunteer.volunteer_id) {
                // Extract number from VOL001 format
                const lastNumber = parseInt(lastVolunteer.volunteer_id.replace("VOL", ""));
                finalVolunteerId = `VOL${String(lastNumber + 1).padStart(3, "0")}`;
            } else {
                finalVolunteerId = "VOL001";
            }
        }

        // Check if volunteer_id already exists
        const { data: existingVolunteer } = await supabase
            .from("users")
            .select("id")
            .eq("volunteer_id", finalVolunteerId)
            .single();

        if (existingVolunteer) {
            return NextResponse.json(
                { error: "Volunteer ID already exists" },
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
        const { data: newVolunteer, error: createError } = await supabase
            .from("users")
            .insert({
                name,
                email,
                phone,
                volunteer_id: finalVolunteerId,
                user_role: "volunteer",
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
                volunteer_id: finalVolunteerId,
                confirmed_orders: 0,
                goal: goal,
            });

        if (progressError) {
            console.error("Error creating challenge progress:", progressError);
        }

        return NextResponse.json({
            success: true,
            volunteer: {
                ...newVolunteer,
                confirmed_orders: 0,
                goal,
                progress_percentage: 0
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating volunteer:", error);
        return NextResponse.json(
            { error: "Failed to create volunteer" },
            { status: 500 }
        );
    }
}
