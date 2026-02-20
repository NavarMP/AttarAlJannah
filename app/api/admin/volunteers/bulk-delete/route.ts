import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { volunteerIds } = await request.json();

        if (!Array.isArray(volunteerIds) || volunteerIds.length === 0) {
            return NextResponse.json({ error: "No volunteer IDs provided" }, { status: 400 });
        }

        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Soft-delete: set deleted_at instead of removing
        const { data, error } = await adminSupabase
            .from("volunteers")
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: auth.admin.email,
            })
            .in("id", volunteerIds)
            .is("deleted_at", null)
            .select();

        if (error) {
            console.error("Bulk volunteer soft-delete error:", error);
            return NextResponse.json(
                { error: "Failed to delete volunteers", details: error.message },
                { status: 500 }
            );
        }

        await logAuditEvent({
            admin: auth.admin,
            action: "bulk_delete",
            entityType: "volunteer",
            entityId: volunteerIds.join(","),
            details: { count: data?.length || 0 },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({
            success: true,
            deletedCount: data?.length || 0,
            message: `Moved ${data?.length || 0} volunteer(s) to trash`,
        });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
