import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

const VALID_ENTITY_TYPES = ["orders", "volunteers", "customers"];

// GET - List soft-deleted items from trash
export async function GET(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const searchParams = request.nextUrl.searchParams;
        const entityType = searchParams.get("type") || "orders";
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = 20;

        if (!VALID_ENTITY_TYPES.includes(entityType)) {
            return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
        }

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let selectFields = "*";
        if (entityType === "orders") {
            selectFields = "id, customer_name, customer_phone, product_name, quantity, total_price, order_status, deleted_at, deleted_by, created_at";
        } else if (entityType === "volunteers") {
            selectFields = "id, name, phone, volunteer_id, total_sales, deleted_at, deleted_by, created_at";
        } else if (entityType === "customers") {
            selectFields = "id, name, phone, total_orders, deleted_at, deleted_by, created_at";
        }

        const { data, error, count } = await supabase
            .from(entityType)
            .select(selectFields, { count: "exact" })
            .not("deleted_at", "is", null)
            .order("deleted_at", { ascending: false })
            .range(from, to);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            items: data || [],
            totalCount: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        });
    } catch (error) {
        console.error("Trash list error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST - Restore items from trash
export async function POST(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { entityType, ids } = await request.json();

        if (!entityType || !ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "entityType and ids are required" }, { status: 400 });
        }

        if (!VALID_ENTITY_TYPES.includes(entityType)) {
            return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
        }

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabase
            .from(entityType)
            .update({ deleted_at: null, deleted_by: null })
            .in("id", ids);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logAuditEvent({
            admin: auth.admin,
            action: "restore",
            entityType: entityType.replace(/s$/, ""),
            entityId: ids.join(","),
            details: { count: ids.length },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ success: true, restoredCount: ids.length });
    } catch (error) {
        console.error("Trash restore error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE - Permanently delete items from trash (super_admin only)
export async function DELETE(request: NextRequest) {
    const auth = await requireAdmin("super_admin");
    if ("error" in auth) return auth.error;

    try {
        const { entityType, ids } = await request.json();

        if (!entityType || !ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "entityType and ids are required" }, { status: 400 });
        }

        if (!VALID_ENTITY_TYPES.includes(entityType)) {
            return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
        }

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Find auth_ids to delete if destroying volunteers
        let authIdsToDelete: string[] = [];
        if (entityType === "volunteers") {
            const { data } = await supabase
                .from("volunteers")
                .select("auth_id")
                .in("id", ids);

            if (data) {
                authIdsToDelete = data
                    .filter(v => v.auth_id !== null)
                    .map(v => v.auth_id);
            }
        }

        // Only allow permanent deletion of already soft-deleted items
        const { error } = await supabase
            .from(entityType)
            .delete()
            .in("id", ids)
            .not("deleted_at", "is", null);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Clean up Supabase Auth users for permanently deleted volunteers
        if (authIdsToDelete.length > 0) {
            for (const authId of authIdsToDelete) {
                await supabase.auth.admin.deleteUser(authId);
            }
        }

        await logAuditEvent({
            admin: auth.admin,
            action: "permanent_delete",
            entityType: entityType.replace(/s$/, ""),
            entityId: ids.join(","),
            details: { count: ids.length },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ success: true, deletedCount: ids.length });
    } catch (error) {
        console.error("Trash permanent delete error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
