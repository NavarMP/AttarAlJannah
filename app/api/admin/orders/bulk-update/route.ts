import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { orderIds, status } = await request.json();

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ error: "Invalid order IDs" }, { status: 400 });
        }

        if (!status || !["pending", "confirmed", "delivered", "ordered", "cant_reach", "cancelled"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Update orders
        const { error, count } = await adminSupabase
            .from("orders")
            .update({ order_status: status })
            .in("id", orderIds);

        if (error) {
            console.error("Error bulk updating orders:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "bulk_update",
            entityType: "order",
            entityId: orderIds.join(","),
            details: { count: orderIds.length, newStatus: status },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({
            success: true,
            message: `Updated status to ${status} for ${orderIds.length} order(s)`
        });

    } catch (error: any) {
        console.error("Bulk update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
