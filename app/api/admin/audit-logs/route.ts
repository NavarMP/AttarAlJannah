import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";

// GET - Fetch audit logs with filtering (super_admin only)
export async function GET(request: NextRequest) {
    const auth = await requireAdmin("super_admin");
    if ("error" in auth) return auth.error;

    try {
        const searchParams = request.nextUrl.searchParams;
        const actorEmail = searchParams.get("actorEmail");
        const actorRole = searchParams.get("actorRole");
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

        if (actorEmail) {
            query = query.eq("actor_email", actorEmail);
        }
        if (actorRole) {
            query = query.eq("actor_role", actorRole);
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

        const logsData = data || [];

        // --- Fallback logic to append missing actor_name and actor_role ---
        // (audit_logs table presently lacks these columns in some DB instances)
        const uniqueEmails = [...new Set(logsData.map(l => l.admin_email || l.actor_email).filter(Boolean))];
        const actorMap = new Map();

        if (uniqueEmails.length > 0) {
            const [
                { data: admins },
                { data: volunteers },
                { data: customers }
            ] = await Promise.all([
                supabase.from('admin_users').select('email, name, role').in('email', uniqueEmails),
                supabase.from('volunteers').select('email, name').in('email', uniqueEmails),
                supabase.from('customers').select('email, name').in('email', uniqueEmails)
            ]);

            (admins || []).forEach(a => actorMap.set(a.email, { name: a.name, role: a.role }));
            (volunteers || []).forEach(v => actorMap.set(v.email, { name: v.name, role: 'volunteer' }));
            (customers || []).forEach(c => actorMap.set(c.email, { name: c.name, role: 'customer' }));
        }

        const enrichedLogs = logsData.map(log => {
            const emailToLookup = log.admin_email || log.actor_email;
            const fallback = actorMap.get(emailToLookup) || { name: 'Unknown', role: 'unknown' };
            return {
                ...log,
                actor_email: emailToLookup, // Ensure UI receives actor_email
                actor_name: log.actor_name || fallback.name,
                actor_role: log.actor_role || fallback.role,
            };
        });

        return NextResponse.json({
            logs: enrichedLogs,
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
