import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { customerIds } = await request.json();

        if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
            return NextResponse.json({ error: "No customer IDs provided" }, { status: 400 });
        }

        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Soft-delete: set deleted_at instead of removing
        const { error, count } = await supabase
            .from("customers")
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: auth.admin.email,
            })
            .in("id", customerIds)
            .is("deleted_at", null);

        if (error) {
            console.error("Bulk customer soft-delete error:", error);
            return NextResponse.json({ error: "Failed to delete customers" }, { status: 500 });
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "bulk_delete",
            entityType: "customer",
            entityId: customerIds.join(","),
            details: { count: customerIds.length },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({
            success: true,
            message: `Moved ${count || customerIds.length} customer(s) to trash`,
            deletedCount: count || customerIds.length,
        });
    } catch (error) {
        console.error("Bulk customer delete error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
