import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

// PUT - Update admin user role/status (super_admin only)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin("super_admin");
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const body = await request.json();
        const { name, role, is_active } = body;

        // Prevent self-demotion
        if (id === auth.admin.id && role && role !== auth.admin.role) {
            return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
        }

        if (id === auth.admin.id && is_active === false) {
            return NextResponse.json({ error: "Cannot deactivate yourself" }, { status: 400 });
        }

        if (role && !["super_admin", "admin", "viewer"].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (role !== undefined) updateData.role = role;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data, error } = await supabase
            .from("admin_users")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "update",
            entityType: "admin_user",
            entityId: id,
            details: { changes: updateData },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ user: data });
    } catch (error) {
        console.error("Admin user update error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE - Permanently delete admin user (super_admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin("super_admin");
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;

        if (id === auth.admin.id) {
            return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
        }

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch user first for audit logging
        const { data: userToDelete } = await supabase
            .from("admin_users")
            .select("email, name")
            .eq("id", id)
            .single();

        const { error } = await supabase
            .from("admin_users")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "delete",
            entityType: "admin_user",
            entityId: id,
            details: { email: userToDelete?.email, name: userToDelete?.name },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin user delete error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
