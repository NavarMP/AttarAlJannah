import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const body = await request.json();

        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await adminSupabase
            .from("promo_content")
            .insert([body])
            .select()
            .single();

        if (error) {
            console.error("Error creating promo content:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "create",
            entityType: "promo_content",
            entityId: data.id,
            details: { title: data.title, type: data.content_type },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Promo create error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: "Promo ID is required" }, { status: 400 });
        }

        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await adminSupabase
            .from("promo_content")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error updating promo content:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "update",
            entityType: "promo_content",
            entityId: id,
            details: { changes: Object.keys(updateData) },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Promo update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
