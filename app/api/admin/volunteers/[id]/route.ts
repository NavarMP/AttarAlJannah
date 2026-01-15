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
            .from("users")
            .select("*")
            .eq("id", volunteerId)
            .eq("user_role", "volunteer")
            .single();

        if (volunteerError || !volunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // Get challenge progress
        const { data: progress } = await supabase
            .from("challenge_progress")
            .select("*")
            .eq("volunteer_id", volunteer.volunteer_id)
            .single();

        // Get order statistics using UUID (referred_by is UUID)
        const { data: orders } = await supabase
            .from("orders")
            .select("*")
            .eq("referred_by", volunteer.id);

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

        // Check if volunteer exists
        const { data: existingVolunteer, error: fetchError } = await supabase
            .from("users")
            .select("volunteer_id")
            .eq("id", volunteerId)
            .eq("user_role", "volunteer")
            .single();

        if (fetchError || !existingVolunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // If volunteer_id is being changed, check uniqueness
        if (volunteer_id && volunteer_id !== existingVolunteer.volunteer_id) {
            const { data: duplicateCheck } = await supabase
                .from("users")
                .select("id")
                .eq("volunteer_id", volunteer_id)
                .single();

            if (duplicateCheck) {
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
        if (address !== undefined) updates.address = address;
        if (volunteer_id) updates.volunteer_id = volunteer_id;

        // Update password if provided
        if (password) {
            const { data: hashedPassword } = await supabase
                .rpc("crypt", { password_input: password, salt: "gen_salt('bf')" });
            updates.password_hash = hashedPassword || password;
        }

        // Update user record
        const { data: updatedVolunteer, error: updateError } = await supabase
            .from("users")
            .update(updates)
            .eq("id", volunteerId)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        // Update goal in challenge_progress if provided
        if (goal !== undefined) {
            // Use upsert to handle both update and insert cases
            // Use the volunteer's UUID from the updated record
            const volunteerUuidForProgress = updatedVolunteer.id;

            console.log("Updating goal for volunteer UUID:", volunteerUuidForProgress, "to:", goal);

            const { error: progressError } = await supabase
                .from("challenge_progress")
                .upsert(
                    {
                        volunteer_id: volunteerUuidForProgress, // Use UUID instead of volunteer_id string
                        goal: parseInt(goal),
                        confirmed_orders: 0 // Default value if inserting
                    },
                    {
                        onConflict: 'volunteer_id',
                        ignoreDuplicates: false
                    }
                );

            if (progressError) {
                console.error("Error updating goal:", progressError);
                // Return error to user so they know it failed
                return NextResponse.json(
                    { error: "Volunteer updated but goal update failed: " + progressError.message },
                    { status: 500 }
                );
            }

            console.log("Goal updated successfully");
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
        const supabase = await createClient();

        const { id } = await params;
        const volunteerId = id;

        // Check if volunteer exists
        const { data: volunteer, error: fetchError } = await supabase
            .from("users")
            .select("volunteer_id")
            .eq("id", volunteerId)
            .eq("user_role", "volunteer")
            .single();

        if (fetchError || !volunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // Delete challenge_progress entry
        await supabase
            .from("challenge_progress")
            .delete()
            .eq("volunteer_id", volunteer.volunteer_id);

        // Delete user record
        const { error: deleteError } = await supabase
            .from("users")
            .delete()
            .eq("id", volunteerId);

        if (deleteError) {
            throw deleteError;
        }

        // Note: Orders with referred_by = volunteer_id are kept for historical purposes

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
