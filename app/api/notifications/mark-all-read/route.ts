import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/notifications/mark-all-read - Mark all notifications as read for current user
export async function POST(request: NextRequest) {
    try {
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

        // Use service role client for bypassing RLS
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Update all unread notifications for this user AND public notifications
        const { data, error } = await adminSupabase
            .from("notifications")
            .update({ is_read: true })
            .or(`user_id.eq.${targetUserId},user_role.eq.public`)
            .eq("is_read", false)
            .select();

        if (error) {
            console.error("Error marking all as read:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            count: data?.length || 0,
            message: `Marked ${data?.length || 0} notifications as read`
        });
    } catch (error: any) {
        console.error("Mark all read error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
