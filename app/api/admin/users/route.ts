import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

// GET - List all admin users (super_admin only)
export async function GET() {
    const auth = await requireAdmin("super_admin");
    if ("error" in auth) return auth.error;

    try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
            .from("admin_users")
            .select("id, email, name, role, is_active, created_at, last_login_at")
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ users: data });
    } catch (error) {
        console.error("Admin users list error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST - Create a new admin user (super_admin only)
export async function POST(request: NextRequest) {
    const auth = await requireAdmin("super_admin");
    if ("error" in auth) return auth.error;

    try {
        const { email, name, role } = await request.json();

        if (!email || !name) {
            return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
        }

        if (role && !["super_admin", "admin", "viewer"].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
            .from("admin_users")
            .insert({
                email: email.toLowerCase(),
                name,
                role: role || "viewer",
                created_by: auth.admin.id,
            })
            .select()
            .single();

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json({ error: "An admin with this email already exists" }, { status: 409 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "create",
            entityType: "admin_user",
            entityId: data.id,
            details: { email, name, role: role || "viewer" },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ user: data }, { status: 201 });
    } catch (error) {
        console.error("Admin user create error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
