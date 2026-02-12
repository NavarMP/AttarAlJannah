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
        const sort = searchParams.get("sort") || "created_at";
        const offset = (page - 1) * limit;

        // Determine if we need in-memory sorting (for computed fields)
        const isMemorySort = sort === "bottles" || sort === "goal" || sort === "progress";

        // Build query for volunteers
        let query = supabase
            .from("volunteers")
            .select("*", { count: "exact" });

        // Apply DB-level sorting if applicable
        if (!isMemorySort) {
            if (sort === "name") {
                query = query.order("name", { ascending: true });
            } else {
                // Default to created_at DESC
                query = query.order("created_at", { ascending: false });
            }
        } else {
            // For memory sort, we might still want a stable DB sort order
            query = query.order("created_at", { ascending: false });
        }

        // Add search filter if provided
        if (search) {
            query = query.or(`name.ilike.%${search}%,volunteer_id.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        // Apply pagination ONLY if we are NOT doing memory sort
        // If memory sort, we must fetch all matching records to sort them correctly
        if (!isMemorySort) {
            query = query.range(offset, offset + limit - 1);
        }

        const { data: volunteers, error: volunteersError, count } = await query;

        if (volunteersError) {
            throw volunteersError;
        }

        // Get challenge progress
        const volunteerUUIDs = volunteers?.map(s => s.id) || [];
        // Note: If fetching ALL (memory sort), this might hit URL length limits for 'in' clause if too many users.
        // But for < few hundred it's fine. If 1000+, we should rethink.
        // Optimization: If memory sort, maybe fetch ALL challenge_progress and match in memory?
        // Or chunk it? For now, we assume admin panel scale is manageable.

        // Optimizing for larger sets if memory sort:
        let progressData: any[] = [];
        let orders: any[] = [];

        if (volunteerUUIDs.length > 0) {
            const { data: prog } = await supabase
                .from("challenge_progress")
                .select("volunteer_id, goal")
                .in("volunteer_id", volunteerUUIDs);
            progressData = prog || [];

            const { data: ord } = await supabase
                .from("orders")
                .select("volunteer_id, quantity, order_status")
                .in("volunteer_id", volunteerUUIDs)
                .in("order_status", ["ordered", "delivered"]);
            orders = ord || [];
        }

        // Merge data
        let volunteersWithProgress = volunteers?.map(volunteer => {
            const progress = progressData?.find(p => p.volunteer_id === volunteer.id);
            const volunteerOrders = orders?.filter(o => o.volunteer_id === volunteer.id) || [];
            const confirmedBottles = volunteerOrders.reduce((sum: number, o: any) => sum + (o.quantity || 0), 0);
            const goal = progress?.goal || 20;

            return {
                ...volunteer,
                confirmed_bottles: confirmedBottles,
                goal: goal,
                progress_percentage: Math.round((confirmedBottles / goal) * 100)
            };
        }) || [];

        // Apply In-Memory Sorting
        if (isMemorySort) {
            volunteersWithProgress.sort((a, b) => {
                if (sort === "bottles") return b.confirmed_bottles - a.confirmed_bottles;
                if (sort === "goal") return b.goal - a.goal;
                if (sort === "progress") return b.progress_percentage - a.progress_percentage;
                return 0;
            });
        }

        // Apply Pagination for Memory Sort
        const finalVolunteers = isMemorySort
            ? volunteersWithProgress.slice(offset, offset + limit)
            : volunteersWithProgress;

        return NextResponse.json({
            volunteers: finalVolunteers,
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
        // We need Service Role query for Admin Auth management
        // Standard createClient uses Anon key or User session, which cannot create other users
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!serviceRoleKey || !supabaseUrl) {
            console.error("Missing Service Role Key or URL");
            return NextResponse.json(
                { error: "Server configuration error - Missing Service Role Key" },
                { status: 500 }
            );
        }

        const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const body = await request.json();
        const {
            name, email, phone, password, volunteer_id, goal = 20, role,
            profile_photo, // Profile photo URL
            // Optional address fields
            houseBuilding, town, pincode, post, city, district, state, locationLink
        } = body;

        // Validation
        if (!password || !volunteer_id || !phone || !name) {
            return NextResponse.json(
                { error: "Missing required fields (Name, Phone, Volunteer ID, Password)" },
                { status: 400 }
            );
        }

        const finalVolunteerId = volunteer_id;

        // 1. Check for duplicate Volunteer ID in VOLUNTEERS table
        const { data: existingVolId } = await adminSupabase
            .from("volunteers")
            .select("id")
            .ilike("volunteer_id", finalVolunteerId)
            .single();

        if (existingVolId) {
            return NextResponse.json(
                { error: "Volunteer ID already exists" },
                { status: 400 }
            );
        }

        // 2. Check for duplicate Phone in VOLUNTEERS table
        const { data: existingPhone } = await adminSupabase
            .from("volunteers")
            .select("id, auth_id")
            .eq("phone", phone)
            .single();

        // If volunteer exists, we might be updating or it's an error.
        // For simplicity in this refactor, if phone exists, we assume duplication error for "Create New".
        // Use PUT/PATCH for updates.
        if (existingPhone) {
            return NextResponse.json(
                { error: "Volunteer with this phone number already exists" },
                { status: 400 }
            );
        }

        // 3. Create Supabase Auth User
        // We use email if provided, otherwise generate a dummy email or use phone?
        // Volunteer usually needs Email to login effectively in many Supabase defaults, 
        // OR Phone auth (OTP). But requirements said "Volunteer has password".
        // Password login requires Email.
        // If email is missing, we can construct one: `volunteer_PHONE@attaraljannah.local`
        const authEmail = email || `${phone}@attaraljannah.local`;

        let authUser: any = null;
        let isNewUser = true;

        const { data: createdUser, error: authError } = await adminSupabase.auth.admin.createUser({
            email: authEmail,
            password: password,
            email_confirm: true,
            user_metadata: {
                name: name,
                role: 'volunteer',
                volunteer_id: finalVolunteerId
            }
        });

        if (authError) {
            // Check if error is due to existing email
            // output: { __isAuthError: true, status: 422, code: 'email_exists' } or message check
            if (authError.code === 'email_exists' || authError.message?.includes('already been registered')) {
                console.log("ℹ️ Auth user already exists. Linking to existing user:", authEmail);
                isNewUser = false;

                // Fetch existing user to get ID
                // listUsers is the most reliable admin way to search by email if strictly needed, 
                // or if we trust the email is unique in Auth.
                const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers();
                if (listError) {
                    console.error("Failed to list users for recovery:", listError);
                    return NextResponse.json({ error: "Calculated error: User exists but could not be retrieved." }, { status: 500 });
                }

                // Find user case-insensitively
                const existingUser = users.find((u: any) => u.email?.toLowerCase() === authEmail.toLowerCase());

                if (!existingUser) {
                    return NextResponse.json({ error: "User exists (reported by Auth) but could not be found in list." }, { status: 500 });
                }

                authUser = { user: existingUser };
            } else {
                console.error("Auth creation error:", authError);
                return NextResponse.json({ error: authError.message }, { status: 400 });
            }
        } else {
            authUser = createdUser;
        }

        if (!authUser || !authUser.user) {
            throw new Error("Failed to resolve auth user");
        }

        // 4. Create Volunteer Profile in 'volunteers' table
        const { data: newVolunteer, error: dbError } = await adminSupabase
            .from("volunteers") // New Table
            .insert({
                auth_id: authUser.user.id,
                volunteer_id: volunteer_id,
                name: name,
                email: authEmail,
                phone: phone,
                role: role || "volunteer",
                profile_photo: profile_photo || null, // Profile photo URL
                total_sales: 0,
                status: "active", // Admin-created volunteers are auto-approved
                // Optional address fields
                house_building: houseBuilding || null,
                town: town || null,
                pincode: pincode || null,
                post: post || null,
                city: city || null,
                district: district || null,
                state: state || null,
                location_link: locationLink || null,
            })
            .select()
            .single();

        if (dbError) {
            // Only rollback if we created a NEW user
            if (isNewUser) {
                console.log("⚠️ DB Insert failed. Rolling back new Auth User:", authUser.user.id);
                await adminSupabase.auth.admin.deleteUser(authUser.user.id);
            }
            console.error("DB Insertion Error:", dbError);
            // If it's a conflict constraint (e.g. phone in volunteers), show that
            if (dbError.code === '23505') { // Unique violation
                return NextResponse.json({ error: 'Volunteer with this Phone or ID already exists in database.' }, { status: 400 });
            }
            throw dbError;
        }

        // 5. Initialize Challenge Progress
        const { error: progressError } = await adminSupabase
            .from("challenge_progress")
            .insert({
                volunteer_id: newVolunteer.id, // Using new volunteers.id (UUID)
                confirmed_orders: 0,
                goal: goal,
            });

        if (progressError) {
            console.error("Progress creation error:", progressError);
            // Non-fatal, can be created later or ignored
        }

        return NextResponse.json({
            success: true,
            message: "Volunteer created successfully",
            volunteer: {
                id: newVolunteer.id,
                name: newVolunteer.name,
                volunteerId: newVolunteer.volunteer_id
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
