import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    const params = await props.params;
    try {
        const customerId = params.id;

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get customer details before soft-deleting (for audit log)
        const { data: customer } = await supabase
            .from("customers")
            .select("name, phone")
            .eq("id", customerId)
            .single();

        // Soft-delete: set deleted_at instead of removing
        const { error } = await supabase
            .from("customers")
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: auth.admin.email,
            })
            .eq("id", customerId)
            .is("deleted_at", null);  // Only soft-delete if not already deleted

        if (error) {
            console.error("Customer soft-delete error:", error);
            return NextResponse.json(
                { error: "Failed to delete customer" },
                { status: 500 }
            );
        }

        await logAuditEvent({
            admin: auth.admin,
            action: "delete",
            entityType: "customer",
            entityId: customerId,
            details: { name: customer?.name, phone: customer?.phone },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({
            success: true,
            message: "Customer moved to trash. Can be restored within 30 days.",
        });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
