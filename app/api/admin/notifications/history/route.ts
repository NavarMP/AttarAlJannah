import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Notification history with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const priority = searchParams.get("priority");
        const days = parseInt(searchParams.get("days") || "30");
        const limit = parseInt(searchParams.get("limit") || "50");

        const supabase = await createClient();

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        let query = supabase
            .from("notifications")
            .select("*")
            .gte("created_at", cutoffDate.toISOString())
            .order("created_at", { ascending: false })
            .limit(limit);

        if (category) {
            query = query.eq("category", category);
        }

        if (priority) {
            query = query.eq("priority", priority);
        }

        const { data: notifications, error } = await query;

        if (error) {
            console.error("Error fetching notification history:", error);
            return NextResponse.json(
                { error: "Failed to fetch notifications" },
                { status: 500 }
            );
        }

        // Get aggregated stats
        const { data: stats } = await supabase
            .from("notifications")
            .select("priority, delivery_status, is_read")
            .gte("created_at", cutoffDate.toISOString());

        const aggregatedStats = {
            total: stats?.length || 0,
            sent: stats?.filter(n => n.delivery_status === 'sent').length || 0,
            read: stats?.filter(n => n.is_read).length || 0,
            byPriority: {
                critical: stats?.filter(n => n.priority === 'critical').length || 0,
                high: stats?.filter(n => n.priority === 'high').length || 0,
                medium: stats?.filter(n => n.priority === 'medium').length || 0,
                low: stats?.filter(n => n.priority === 'low').length || 0,
            }
        };

        return NextResponse.json({
            notifications: notifications || [],
            stats: aggregatedStats,
        });
    } catch (error) {
        console.error("Notification history API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Resend notification
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { notificationId } = body;

        if (!notificationId) {
            return NextResponse.json(
                { error: "Notification ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Fetch original notification
        const { data: original, error: fetchError } = await supabase
            .from("notifications")
            .select("*")
            .eq("id", notificationId)
            .single();

        if (fetchError || !original) {
            return NextResponse.json(
                { error: "Notification not found" },
                { status: 404 }
            );
        }

        // Create new notification with same content
        const { data: newNotification, error: createError } = await supabase
            .from("notifications")
            .insert({
                user_id: original.user_id,
                user_role: original.user_role,
                type: original.type,
                title: original.title,
                message: original.message,
                action_url: original.action_url,
                metadata: {
                    ...original.metadata,
                    resent_from: notificationId,
                    resent_at: new Date().toISOString(),
                },
                category: original.category,
                priority: original.priority,
                is_read: false,
                delivery_status: 'pending',
            })
            .select()
            .single();

        if (createError) {
            console.error("Error resending notification:", createError);
            return NextResponse.json(
                { error: "Failed to resend notification" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            notification: newNotification,
        });
    } catch (error) {
        console.error("Resend notification error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
