import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        // Service Role setup for creating auth users
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
            name, email, phone, volunteer_id, password,
            profile_photo, // Profile photo URL
            // Address fields
            houseBuilding, town, pincode, post, city, district, state, locationLink
        } = body;

        // Validation
        if (!password || !volunteer_id || !phone || !name) {
            return NextResponse.json(
                { error: "Missing required fields (Name, Phone, Volunteer ID, Password)" },
                { status: 400 }
            );
        }

        // 1. Check for duplicate Volunteer ID
        const { data: existingVolId } = await adminSupabase
            .from("volunteers")
            .select("id")
            .ilike("volunteer_id", volunteer_id)
            .single();

        if (existingVolId) {
            return NextResponse.json(
                { error: "Volunteer ID already exists" },
                { status: 400 }
            );
        }

        // 2. Check for duplicate Phone
        const { data: existingPhone } = await adminSupabase
            .from("volunteers")
            .select("id")
            .eq("phone", phone)
            .single();

        if (existingPhone) {
            return NextResponse.json(
                { error: "Volunteer with this phone number already exists" },
                { status: 400 }
            );
        }

        // 3. Generate email if not provided
        const authEmail = email || `${phone}@attaraljannah.local`;

        // 4. Create Supabase Auth User
        let authUser: any = null;
        let isNewUser = true;

        const { data: createdUser, error: authError } = await adminSupabase.auth.admin.createUser({
            email: authEmail,
            password: password,
            email_confirm: true,
            user_metadata: {
                name: name,
                role: 'volunteer',
                volunteer_id: volunteer_id
            }
        });

        if (authError) {
            // Check if error is due to existing email
            if (authError.code === 'email_exists' || authError.message?.includes('already been registered')) {
                console.log("ℹ️ Auth user already exists. Linking to existing user:", authEmail);
                isNewUser = false;

                // Fetch existing user to get ID
                const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers();
                if (listError) {
                    console.error("Failed to list users for recovery:", listError);
                    return NextResponse.json({ error: "User exists but could not be retrieved." }, { status: 500 });
                }

                const existingUser = users.find((u: any) => u.email?.toLowerCase() === authEmail.toLowerCase());

                if (!existingUser) {
                    return NextResponse.json({ error: "User exists (reported by Auth) but could not be found." }, { status: 500 });
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

        // 5. Create Volunteer Profile with PENDING status
        const { data: newVolunteer, error: dbError } = await adminSupabase
            .from("volunteers")
            .insert({
                auth_id: authUser.user.id,
                volunteer_id: volunteer_id,
                name: name,
                email: authEmail,
                phone: phone,
                role: "volunteer",
                profile_photo: profile_photo || null, // Profile photo URL
                total_sales: 0,
                status: "pending", // NEW: Set as pending for admin approval
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
            // Rollback if we created a NEW user
            if (isNewUser) {
                console.log("⚠️ DB Insert failed. Rolling back new Auth User:", authUser.user.id);
                await adminSupabase.auth.admin.deleteUser(authUser.user.id);
            }
            console.error("DB Insertion Error:", dbError);
            if (dbError.code === '23505') { // Unique violation
                return NextResponse.json({ error: 'Volunteer with this Phone or ID already exists.' }, { status: 400 });
            }
            throw dbError;
        }

        // 6. Initialize Challenge Progress
        const { error: progressError } = await adminSupabase
            .from("challenge_progress")
            .insert({
                volunteer_id: newVolunteer.id,
                confirmed_orders: 0,
                goal: 20, // Default goal
            });

        if (progressError) {
            console.error("Progress creation error:", progressError);
            // Non-fatal, can be created later
        }

        return NextResponse.json({
            success: true,
            message: "Signup successful! Your account is pending admin approval. You'll be able to log in once approved.",
            volunteer: {
                id: newVolunteer.id,
                name: newVolunteer.name,
                volunteerId: newVolunteer.volunteer_id,
                status: newVolunteer.status
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating volunteer signup:", error);
        return NextResponse.json(
            { error: "Failed to process signup" },
            { status: 500 }
        );
    }
}
