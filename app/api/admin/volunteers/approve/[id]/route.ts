import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config/admin";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify admin authentication
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify user is admin (check email whitelist)
        console.log("🔍 Checking admin auth - User email:", user.email);

        if (!isAdminEmail(user.email)) {
            console.log("❌ Admin check failed - email not in whitelist:", user.email);
            return NextResponse.json(
                { error: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        console.log("✅ Admin verified successfully");

        // Get volunteer ID from URL path
        const url = new URL(request.url);
        const volunteerId = url.pathname.split("/").pop();

        // Get action and reason from request body
        const body = await request.json();
        const { action, reason } = body;

        if (!action || !["approve", "reject"].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action. Must be 'approve' or 'reject'" },
                { status: 400 }
            );
        }

        // Find volunteer
        const { data: volunteer, error: fetchError } = await supabase
            .from("volunteers")
            .select("id, auth_id, name, volunteer_id, status")
            .eq("id", volunteerId)
            .single();

        if (fetchError || !volunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        if (volunteer.status !== "pending") {
            return NextResponse.json(
                { error: "Volunteer is not in pending status" },
                { status: 400 }
            );
        }

        if (action === "approve") {
            // Update status to active
            const { error: updateError } = await supabase
                .from("volunteers")
                .update({ status: "active" })
                .eq("id", volunteerId);

            if (updateError) {
                console.error("Error approving volunteer:", updateError);
                return NextResponse.json(
                    { error: "Failed to approve volunteer" },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: `Volunteer ${volunteer.name} has been approved`,
                volunteer: {
                    id: volunteer.id,
                    name: volunteer.name,
                    volunteerId: volunteer.volunteer_id,
                    status: "active"
                }
            });

        } else if (action === "reject") {
            // Need service role to delete auth user
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

            if (!serviceRoleKey || !supabaseUrl) {
                return NextResponse.json(
                    { error: "Server configuration error" },
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

            // Delete challenge progress first (foreign key constraint)
            await adminSupabase
                .from("challenge_progress")
                .delete()
                .eq("volunteer_id", volunteerId);

            // Delete volunteer record
            const { error: deleteError } = await adminSupabase
                .from("volunteers")
                .delete()
                .eq("id", volunteerId);

            if (deleteError) {
                console.error("Error deleting volunteer:", deleteError);
                return NextResponse.json(
                    { error: "Failed to reject volunteer" },
                    { status: 500 }
                );
            }

            // Delete auth user
            if (volunteer.auth_id) {
                await adminSupabase.auth.admin.deleteUser(volunteer.auth_id);
            }

            return NextResponse.json({
                success: true,
                message: `Volunteer ${volunteer.name} has been rejected and removed`,
                reason: reason || "No reason provided"
            });
        }

    } catch (error) {
        console.error("Error processing volunteer approval:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
