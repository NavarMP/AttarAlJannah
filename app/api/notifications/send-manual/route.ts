import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config/admin";
import { NotificationService } from "@/lib/services/notification-service";

// POST /api/notifications/send-manual - Send manual notifications (admin only)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // Verify user is admin
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!isAdminEmail(user.email)) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        // Validate required fields
        const { target_type, target_role, target_user_ids, title, message, action_url, priority } = body;

        if (!target_type || !title || !message) {
            return NextResponse.json(
                { error: "Missing required fields: target_type, title, message" },
                { status: 400 }
            );
        }

        if (!["all", "role", "individual"].includes(target_type)) {
            return NextResponse.json(
                { error: "Invalid target_type. Must be: all, role, or individual" },
                { status: 400 }
            );
        }

        if (target_type === "role" && !target_role) {
            return NextResponse.json(
                { error: "target_role is required when target_type is 'role'" },
                { status: 400 }
            );
        }

        if (target_type === "individual" && (!target_user_ids || target_user_ids.length === 0)) {
            return NextResponse.json(
                { error: "target_user_ids array is required when target_type is 'individual'" },
                { status: 400 }
            );
        }

        // Create system announcement using the notification service
        const result = await NotificationService.createSystemAnnouncement(
            title,
            message,
            target_type,
            {
                targetRole: target_role,
                targetUserIds: target_user_ids,
                actionUrl: action_url,
                priority: priority || "medium",
            }
        );

        if (result.error) {
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            sent_count: result.count || 0,
            notification_ids: result.data?.map((n: any) => n.id) || [],
            message: `Successfully sent ${result.count || 0} notifications`,
        }, { status: 201 });
    } catch (error: any) {
        console.error("Manual notification send error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
