
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Try getting by volunteer_id first
        let query = supabase
            .from("volunteers")
            .select("*")
            .eq("volunteer_id", id)
            .is("deleted_at", null)
            .single();

        let { data: volunteer, error } = await query;

        // Fallback to UUID if not found
        if (error || !volunteer) {
            const uuidQuery = supabase
                .from("volunteers")
                .select("*")
                .eq("id", id)
                .is("deleted_at", null)
                .single();

            const uuidResult = await uuidQuery;
            volunteer = uuidResult.data;
            error = uuidResult.error;
        }

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(volunteer);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const body = await request.json();
        const supabase = await createClient();

        // Sanitize body — remove fields that don't belong in volunteers table
        const { confirmPassword, goal, ...updateData } = body;
        if (updateData.password === "") {
            delete updateData.password;
        }

        // Try update by volunteer_id
        let { data, error } = await supabase
            .from("volunteers")
            .update(updateData)
            .eq("volunteer_id", id)
            .is("deleted_at", null)
            .select()
            .single();

        // Fallback to update by UUID
        if (error || !data) {
            const uuidResult = await supabase
                .from("volunteers")
                .update(updateData)
                .eq("id", id)
                .is("deleted_at", null)
                .select()
                .single();
            data = uuidResult.data;
            error = uuidResult.error;
        }

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Update goal in challenge_progress table if provided
        if (goal !== undefined && goal !== null && typeof goal === "number" && data) {
            const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
            const adminSupabase = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            // Upsert: update if exists, insert if not
            const { error: goalError } = await adminSupabase
                .from("challenge_progress")
                .upsert(
                    { volunteer_id: data.id, goal: goal },
                    { onConflict: "volunteer_id" }
                );

            if (goalError) {
                console.error("Failed to update goal in challenge_progress:", goalError);
            }
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "update",
            entityType: "volunteer",
            entityId: data?.id || id,
            details: { changes: Object.keys(updateData).concat(goal !== undefined ? ["goal"] : []) },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;

        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Find the volunteer first
        const { data: vol } = await supabase
            .from("volunteers")
            .select("id, name, phone, volunteer_id")
            .or(`volunteer_id.eq.${id},id.eq.${id}`)
            .is("deleted_at", null)
            .single();

        if (!vol) {
            return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
        }

        // Soft-delete
        const { error } = await supabase
            .from("volunteers")
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: auth.admin.email,
            })
            .eq("id", vol.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "delete",
            entityType: "volunteer",
            entityId: vol.id,
            details: { name: vol.name, phone: vol.phone, volunteer_id: vol.volunteer_id },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({
            success: true,
            message: "Volunteer moved to trash. Can be restored within 30 days.",
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
