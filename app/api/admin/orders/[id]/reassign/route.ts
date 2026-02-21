import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { reassignDeliveryVolunteer } from "@/lib/services/volunteer-assignment";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const params = await context.params;
        const body = await request.json();
        const { volunteerId } = body;



        // Reassign the order
        const result = await reassignDeliveryVolunteer(params.id, volunteerId || null);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to reassign volunteer" },
                { status: 500 }
            );
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "update",
            entityType: "order",
            entityId: params.id,
            details: { action: "reassign_volunteer", volunteerId },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({
            success: true,
            message: volunteerId ? "Volunteer assigned successfully" : "Volunteer removed successfully"
        });

    } catch (error: any) {
        console.error("Error reassigning volunteer:", error);
        return NextResponse.json(
            { error: "Failed to reassign volunteer" },
            { status: 500 }
        );
    }
}
