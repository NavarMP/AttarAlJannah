import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { orderIds } = await request.json();

        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });
        }

        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Soft delete orders from database
        const { data, error } = await adminSupabase
            .from("orders")
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: auth.admin.email,
            })
            .in("id", orderIds)
            .select();

        if (error) {
            console.error("Bulk delete error:", error);
            return NextResponse.json(
                { error: "Failed to delete orders", details: error.message },
                { status: 500 }
            );
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "bulk_delete",
            entityType: "order",
            entityId: orderIds.join(","),
            details: { count: orderIds.length },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({
            success: true,
            deletedCount: data?.length || 0,
            message: `Successfully moved ${data?.length || 0} order(s) to trash`,
        });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
