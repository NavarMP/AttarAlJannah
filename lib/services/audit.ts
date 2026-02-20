import { AdminUser } from "@/lib/middleware/auth-guard";

interface AuditEventParams {
    admin: AdminUser;
    action: string;
    entityType: string;
    entityId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
}

/**
 * Log an audit event for admin actions.
 * Uses the service role client to bypass RLS.
 */
export async function logAuditEvent({
    admin,
    action,
    entityType,
    entityId,
    details,
    ipAddress,
}: AuditEventParams): Promise<void> {
    try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabase.from("audit_logs").insert({
            admin_id: admin.id,
            admin_email: admin.email,
            action,
            entity_type: entityType,
            entity_id: entityId || null,
            details: details || null,
            ip_address: ipAddress || null,
        });
    } catch (error) {
        // Audit logging should never break the main operation
        console.error("Audit log error:", error);
    }
}

/**
 * Extract client IP address from request headers.
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const realIP = request.headers.get("x-real-ip");
    if (realIP) {
        return realIP;
    }
    return "unknown";
}
