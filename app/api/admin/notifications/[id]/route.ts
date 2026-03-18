import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";

export const dynamic = "force-dynamic";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// DELETE /api/admin/notifications/[id] - Admin delete any notification
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;

        const supabase = createAdminClient();

        // Delete any notification (admin has full access)
        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting notification:", error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Notification deleted successfully"
        });
    } catch (error: any) {
        console.error("Admin notification delete error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/notifications/[id] - Admin update any notification
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const body = await request.json();

        const supabase = createAdminClient();

        const { error } = await supabase
            .from("notifications")
            .update({
                ...(body.is_read !== undefined && { is_read: body.is_read }),
                ...(body.title && { title: body.title }),
                ...(body.message && { message: body.message }),
                ...(body.priority && { priority: body.priority }),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error updating notification:", error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Notification updated successfully"
        });
    } catch (error: any) {
        console.error("Admin notification update error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
