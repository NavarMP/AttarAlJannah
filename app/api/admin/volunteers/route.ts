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

        // Get challenge progress for goal using UUID (not readable ID)
        const volunteerUUIDs = volunteers?.map(s => s.id) || [];
        const { data: progressData } = await supabase
            .from("challenge_progress")
            .select("volunteer_id, goal")
            .in("volunteer_id", volunteerUUIDs);

        // Get orders for bottle count (using UUID)
        const { data: orders } = await supabase
            .from("orders")
            .select("referred_by, quantity, order_status")
            .in("referred_by", volunteerUUIDs)
            .in("order_status", ["confirmed", "delivered"]);

        // Merge data
        const volunteersWithProgress = volunteers?.map(volunteer => {
            // Match by UUID now
            const progress = progressData?.find(p => p.volunteer_id === volunteer.id);

            // Calculate bottles from orders
            const volunteerOrders = orders?.filter(o => o.referred_by === volunteer.id) || [];
            const confirmedBottles = volunteerOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);

            const goal = progress?.goal || 20;

            return {
                ...volunteer,
                confirmed_bottles: confirmedBottles,
                goal: goal,
                progress_percentage: Math.round((confirmedBottles / goal) * 100)
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

        if (!password || !volunteer_id) {
            return NextResponse.json(
                { error: "Volunteer ID and Password are required" },
                { status: 400 }
            );
        }

        const finalVolunteerId = volunteer_id;

        // Check if volunteer_id already exists (case-insensitive) - STRICT CHECK

        // Check if volunteer_id already exists (case-insensitive) - STRICT CHECK
        const { data: existingVolunteerId } = await supabase
            .from("users")
            .select("id, volunteer_id")
            .ilike("volunteer_id", finalVolunteerId);

        // If ID exists on DIFFERENT user, error. If same user, it's fine (update).
        // But we don't know the user yet unless we check phone. So check ID globally first.
        // Actually, if we are "updating" a user, we should allow them to keep their ID? 
        // But we are creating a *new* volunteer assignment usually. 
        // If ID exists, deny it to avoid confusion, unless it's the SAME user.

        // Let's first finding the user by phone to see if we are updating.
        const { data: existingUserByPhone } = await supabase
            .from("users")
            .select("id, volunteer_id, user_role, name")
            .eq("phone", phone)
            .single();

        if (existingVolunteerId && existingVolunteerId.length > 0) {
            // If ID exists, check if it belongs to the user we are about to update.
            const idOwner = existingVolunteerId[0];
            if (existingUserByPhone && idOwner.id === existingUserByPhone.id) {
                // Same user, allowed (idempotent update)
            } else {
                return NextResponse.json(
                    { error: "Volunteer ID already exists" },
                    { status: 400 }
                );
            }
        }

        // Hash password using pgcrypto
        const { data: hashedPassword, error: hashError } = await supabase
            .rpc("hash_password", { password });

        if (hashError) {
            console.error("Password hashing error:", hashError);
        }

        let userId = "";

        if (existingUserByPhone) {
            // MERGE/UPDATE Logic
            userId = existingUserByPhone.id;
            console.log(`Updating existing user ${userId} to be a volunteer`);

            // Don't downgrade Admin to Volunteer
            const newRole = existingUserByPhone.user_role === 'admin' ? 'admin' : 'volunteer';

            const { error: updateError } = await supabase
                .from("users")
                .update({
                    name, // usage name from form, maybe they want to correct it
                    email: email || undefined, // Update email if provided
                    volunteer_id: finalVolunteerId,
                    user_role: newRole,
                    password_hash: hashedPassword || password,
                    address: address || null,
                })
                .eq("id", userId);

            if (updateError) throw updateError;

        } else {
            // CREATE Logic
            // Check email uniqueness only for NEW users (or if updating email?)
            // If updating user and email is different, we handled in update? Supabase might error if email unique constraint.
            if (email) {
                const { data: existingEmail } = await supabase
                    .from("users")
                    .select("id")
                    .eq("email", email)
                    .single();
                if (existingEmail) {
                    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
                }
            }

            const { data: newUser, error: createError } = await supabase
                .from("users")
                .insert({
                    name,
                    email,
                    phone,
                    volunteer_id: finalVolunteerId,
                    user_role: "volunteer",
                    password_hash: hashedPassword || password,
                    address: address || null,
                })
                .select()
                .single();

            if (createError) throw createError;
            userId = newUser.id;
        }

        // Check/Create Challenge Progress
        const { data: existingProgress } = await supabase
            .from("challenge_progress")
            .select("id")
            .eq("volunteer_id", userId)
            .single();

        if (!existingProgress) {
            const { error: progressError } = await supabase
                .from("challenge_progress")
                .insert({
                    volunteer_id: userId,
                    confirmed_orders: 0,
                    goal: goal,
                });
            if (progressError) console.error("Error creating progress:", progressError);
        }

        return NextResponse.json({
            success: true,
            message: existingUserByPhone ? "User updated to Volunteer" : "Volunteer created",
            volunteer: {
                id: userId,
                name: name,
                volunteerId: finalVolunteerId
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
