import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

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
        const { data: volunteer, error: fetchError } = await adminSupabase
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
            const { error: updateError } = await adminSupabase
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

            await logAuditEvent({
                actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
                action: "approve",
                entityType: "volunteer",
                entityId: volunteerId,
                details: { name: volunteer.name, volunteer_id: volunteer.volunteer_id },
                ipAddress: getClientIP(request),
            });

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

            await logAuditEvent({
                actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
                action: "reject",
                entityType: "volunteer",
                entityId: volunteerId,
                details: { name: volunteer.name, reason: reason || "No reason provided" },
                ipAddress: getClientIP(request),
            });

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
