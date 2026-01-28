import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();

        const { id } = await params;
        const volunteerId = id;

        // Get volunteer by ID
        const { data: volunteer, error: volunteerError } = await supabase
            .from("volunteers") // New Table
            .select("*")
            .eq("id", volunteerId)
            // .eq("role", "volunteer")
            .single();

        if (volunteerError || !volunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // Get challenge progress using UUID
        const { data: progress } = await supabase
            .from("challenge_progress")
            .select("*")
            .eq("volunteer_id", volunteer.id)
            .limit(1)
            .maybeSingle();

        // Get order statistics using UUID (referred_by is UUID)
        const { data: orders } = await supabase
            .from("orders")
            .select("*")
            .eq("referred_by", volunteer.id); // volunteer.id is UUID

        const totalBottles = orders?.reduce((sum, o) => sum + (o.quantity || 0), 0) || 0;
        const confirmedBottles = orders
            ?.filter(o => o.order_status === "confirmed" || o.order_status === "delivered")
            .reduce((sum, o) => sum + (o.quantity || 0), 0) || 0;
        const pendingBottles = orders
            ?.filter(o => o.order_status === "pending")
            .reduce((sum, o) => sum + (o.quantity || 0), 0) || 0;

        return NextResponse.json({
            volunteer: {
                ...volunteer,
                confirmed_bottles: confirmedBottles,
                goal: progress?.goal || 20,
                progress_percentage: progress ? Math.round((confirmedBottles / progress.goal) * 100) : 0,
                stats: {
                    totalBottles,
                    confirmedBottles,
                    pendingBottles
                }
            }
        });

    } catch (error) {
        console.error("Error fetching volunteer:", error);
        return NextResponse.json(
            { error: "Failed to fetch volunteer" },
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
        const volunteerId = id;
        const body = await request.json();
        const { name, email, phone, address, volunteer_id, goal, password } = body;

        // Check if volunteer exists in volunteers table
        const { data: existingVolunteer, error: fetchError } = await supabase
            .from("volunteers")
            .select("volunteer_id, auth_id")
            .eq("id", volunteerId)
            .single();

        if (fetchError || !existingVolunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // If volunteer_id is being changed, check uniqueness (case-insensitive)
        if (volunteer_id && volunteer_id !== existingVolunteer.volunteer_id) {
            const { data: duplicateCheck } = await supabase
                .from("volunteers")
                .select("id")
                .ilike("volunteer_id", volunteer_id)
                .neq("id", volunteerId);

            if (duplicateCheck && duplicateCheck.length > 0) {
                return NextResponse.json(
                    { error: "Volunteer ID already exists" },
                    { status: 400 }
                );
            }
        }

        // Build update object
        const updates: any = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (phone) updates.phone = phone;
        // if (address !== undefined) updates.address = address; // Volunteers table doesn't have address in my schema?
        // Wait, step 40 schema check: "address TEXT,"? No. Volunteers table: name, email, phone, role, total_sales. Customers has address.
        // Volunteers DO NOT have address in my new schema.

        if (volunteer_id) updates.volunteer_id = volunteer_id;

        // Update volunteer record
        const { data: updatedVolunteer, error: updateError } = await supabase
            .from("volunteers")
            .update(updates)
            .eq("id", volunteerId)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        // Update password if provided - Require Admin Service Role!
        if (password && existingVolunteer.auth_id) {
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

            if (serviceRoleKey && supabaseUrl) {
                const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
                const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

                const { error: authError } = await adminSupabase.auth.admin.updateUserById(
                    existingVolunteer.auth_id,
                    { password: password }
                );

                if (authError) console.error("Failed to update auth password:", authError);
            }
        }

        // Update goal in challenge_progress if provided
        if (goal !== undefined) {
            const volunteerUuid = updatedVolunteer.id;
            console.log("Updating goal for volunteer UUID:", volunteerUuid, "to:", goal);

            const { error: progressError } = await supabase
                .from("challenge_progress")
                .upsert(
                    {
                        volunteer_id: volunteerUuid, // Use UUID
                        goal: parseInt(goal),
                        confirmed_orders: 0
                    },
                    {
                        onConflict: 'volunteer_id',
                        ignoreDuplicates: false
                    }
                );

            if (progressError) {
                console.error("Error updating goal:", progressError);
                return NextResponse.json(
                    { error: "Volunteer updated but goal update failed: " + progressError.message },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            volunteer: updatedVolunteer,
        });

    } catch (error) {
        console.error("Error updating volunteer:", error);
        return NextResponse.json(
            { error: "Failed to update volunteer" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Need Service Role for deleting Auth User
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        // Use regular client for verification first? Or just go straight to Admin Op?
        // Let's use standard client to verify it exists and get auth_id
        const supabase = await createClient(); // Authenticated Admin session

        const { id } = await params;
        const volunteerId = id;

        // Check if volunteer exists
        const { data: volunteer, error: fetchError } = await supabase
            .from("volunteers")
            .select("auth_id")
            .eq("id", volunteerId)
            .single();

        if (fetchError || !volunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // Initialize Admin Client
        let adminSupabase = supabase;
        if (serviceRoleKey && supabaseUrl) {
            const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
            adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey);
        }

        // Delete challenge_progress
        await adminSupabase
            .from("challenge_progress")
            .delete()
            .eq("volunteer_id", volunteerId);

        // Delete user record from 'volunteers'
        const { error: deleteError } = await adminSupabase
            .from("volunteers")
            .delete()
            .eq("id", volunteerId);

        if (deleteError) throw deleteError;

        // Delete Auth User
        if (volunteer.auth_id) {
            const { error: authError } = await adminSupabase.auth.admin.deleteUser(volunteer.auth_id);
            if (authError) console.error("Error deleting auth user:", authError);
        }

        return NextResponse.json({
            success: true,
            message: "Volunteer deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting volunteer:", error);
        return NextResponse.json(
            { error: "Failed to delete volunteer" },
            { status: 500 }
        );
    }
}
