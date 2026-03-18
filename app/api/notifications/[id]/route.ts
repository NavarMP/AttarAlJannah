import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/notifications/[id] - Mark notification as read/unread
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();
        const body = await request.json();

        // Get current user (Supabase Auth OR Simple Auth ID)
        const { data: { user } } = await supabase.auth.getUser();
        let targetUserId = user?.id;

        const { is_read, user_id: bodyUserId } = body;

        // If no session, check for provided user_id (Simple Auth)
        if (!targetUserId && bodyUserId) {
            targetUserId = bodyUserId;
        }

        if (!targetUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (typeof is_read !== "boolean") {
            return NextResponse.json({ error: "is_read must be a boolean" }, { status: 400 });
        }

        // Use service role client
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Update notification (allow updating own OR public notifications)
        const { data: notification, error } = await adminSupabase
            .from("notifications")
            .update({ is_read })
            .or(`user_id.eq.${targetUserId},user_role.eq.public`)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error updating notification:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`Notification ${id} update success: is_read=${notification.is_read}`);

        return NextResponse.json({ notification });
    } catch (error: any) {
        console.error("Notification update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();
        const body = await request.json().catch(() => ({}));

        // Get current user (Supabase Auth OR Simple Auth ID)
        const { data: { user } } = await supabase.auth.getUser();
        let targetUserId = user?.id;

        // If no session, check for provided user_id (Simple Auth)
        if (!targetUserId && body.user_id) {
            targetUserId = body.user_id;
        }

        if (!targetUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use service role client
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Delete notification (allow deleting own OR public notifications)
        const { error } = await adminSupabase
            .from("notifications")
            .delete()
            .or(`user_id.eq.${targetUserId},user_role.eq.public`)
            .eq("id", id);

        if (error) {
            console.error("Error deleting notification:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Notification delete error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
