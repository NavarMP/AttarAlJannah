import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

// GET - Get single zone details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: zone, error } = await supabase
            .from("delivery_zones")
            .select(`
                *,
                volunteer_delivery_zones(
                    volunteer_id,
                    volunteers(id, name, volunteer_id, phone)
                )
            `)
            .eq("id", id)
            .single();

        if (error || !zone) {
            return NextResponse.json(
                { error: "Zone not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ zone });
    } catch (error) {
        console.error("Zone fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch zone" },
            { status: 500 }
        );
    }
}

// PATCH - Update zone
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const body = await request.json();
        const supabase = await createClient();

        const updateData: any = {};
        if (body.name) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.district) updateData.district = body.district;
        if (body.state) updateData.state = body.state;
        if (body.pincodes) updateData.pincodes = body.pincodes;
        if (body.pincodeStart !== undefined) updateData.pincode_start = body.pincodeStart;
        if (body.pincodeEnd !== undefined) updateData.pincode_end = body.pincodeEnd;
        if (body.isActive !== undefined) updateData.is_active = body.isActive;

        const { data: zone, error } = await supabase
            .from("delivery_zones")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Zone update error:", error);
            throw error;
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "update",
            entityType: "delivery_zone",
            entityId: zone.id,
            details: { changes: Object.keys(updateData) },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ zone, message: "Zone updated successfully" });
    } catch (error) {
        console.error("Zone update API error:", error);
        return NextResponse.json(
            { error: "Failed to update zone" },
            { status: 500 }
        );
    }
}

// DELETE - Delete zone
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const supabase = await createClient();

        const { error } = await supabase
            .from("delivery_zones")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Zone deletion error:", error);
            throw error;
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "delete",
            entityType: "delivery_zone",
            entityId: id,
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ message: "Zone deleted successfully" });
    } catch (error) {
        console.error("Zone deletion API error:", error);
        return NextResponse.json(
            { error: "Failed to delete zone" },
            { status: 500 }
        );
    }
}
