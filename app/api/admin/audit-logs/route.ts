import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";

// GET - Fetch audit logs with filtering (super_admin only)
export async function GET(request: NextRequest) {
    const auth = await requireAdmin("super_admin");
    if ("error" in auth) return auth.error;

    try {
        const searchParams = request.nextUrl.searchParams;
        const adminEmail = searchParams.get("adminEmail");
        const action = searchParams.get("action");
        const entityType = searchParams.get("entityType");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = 50;

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let query = supabase
            .from("audit_logs")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false });

        if (adminEmail) {
            query = query.eq("admin_email", adminEmail);
        }
        if (action) {
            query = query.eq("action", action);
        }
        if (entityType) {
            query = query.eq("entity_type", entityType);
        }
        if (startDate) {
            const startIST = new Date(`${startDate}T00:00:00+05:30`);
            query = query.gte("created_at", startIST.toISOString());
        }
        if (endDate) {
            const endIST = new Date(`${endDate}T23:59:59.999+05:30`);
            query = query.lte("created_at", endIST.toISOString());
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await query.range(from, to);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            logs: data || [],
            totalCount: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        });
    } catch (error) {
        console.error("Audit logs error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
