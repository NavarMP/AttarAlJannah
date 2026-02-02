import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - List all scheduled notifications
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "pending";

        const supabase = createAdminClient();

        let query = supabase
            .from("scheduled_notifications")
            .select("*")
            .order("scheduled_for", { ascending: true });

        if (status && status !== "all") {
            query = query.eq("status", status);
        }

        const { data: scheduled, error } = await query;

        if (error) {
            console.error("Error fetching scheduled notifications:", error);
            return NextResponse.json(
                { error: "Failed to fetch scheduled notifications" },
                { status: 500 }
            );
        }

        return NextResponse.json({ scheduled: scheduled || [] });
    } catch (error) {
        console.error("Scheduled notifications API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create scheduled notification
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            title,
            message,
            actionUrl,
            priority = "medium",
            targetType,
            targetRole,
            targetUserIds,
            filters,
            scheduledFor,
            recurrence = "once",
        } = body;

        if (!title || !message) {
            return NextResponse.json(
                { error: "Title and message are required" },
                { status: 400 }
            );
        }

        if (!scheduledFor) {
            return NextResponse.json(
                { error: "Scheduled date/time is required" },
                { status: 400 }
            );
        }

        // Validate scheduled time is in the future
        const scheduledDate = new Date(scheduledFor);
        if (scheduledDate <= new Date()) {
            return NextResponse.json(
                { error: "Scheduled time must be in the future" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get current admin user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Build target filters JSON
        const targetFilters: any = { type: targetType };
        if (targetRole) targetFilters.role = targetRole;
        if (targetUserIds) targetFilters.userIds = targetUserIds;
        if (filters) targetFilters.filters = filters;

        const { data: scheduled, error } = await supabase
            .from("scheduled_notifications")
            .insert({
                title,
                message,
                action_url: actionUrl || null,
                priority,
                target_filters: targetFilters,
                scheduled_for: scheduledFor,
                recurrence,
                status: "pending",
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating scheduled notification:", error);
            return NextResponse.json(
                { error: "Failed to schedule notification" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            scheduled,
            message: `Notification scheduled for ${new Date(scheduledFor).toLocaleString()}`,
        });
    } catch (error: any) {
        console.error("Schedule notification error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to schedule notification" },
            { status: 500 }
        );
    }
}

// PATCH - Update scheduled notification
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Notification ID is required" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Check if notification is still pending
        const { data: existing, error: fetchError } = await supabase
            .from("scheduled_notifications")
            .select("status")
            .eq("id", id)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json(
                { error: "Scheduled notification not found" },
                { status: 404 }
            );
        }

        if (existing.status !== "pending") {
            return NextResponse.json(
                { error: "Can only update pending notifications" },
                { status: 400 }
            );
        }

        const { data: updated, error } = await supabase
            .from("scheduled_notifications")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error updating scheduled notification:", error);
            return NextResponse.json(
                { error: "Failed to update scheduled notification" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            scheduled: updated,
        });
    } catch (error) {
        console.error("Update scheduled notification error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Cancel scheduled notification
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Notification ID is required" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Check if notification is still pending
        const { data: existing, error: fetchError } = await supabase
            .from("scheduled_notifications")
            .select("status")
            .eq("id", id)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json(
                { error: "Scheduled notification not found" },
                { status: 404 }
            );
        }

        if (existing.status !== "pending") {
            return NextResponse.json(
                { error: "Can only cancel pending notifications" },
                { status: 400 }
            );
        }

        // Update status to cancelled instead of deleting
        const { error } = await supabase
            .from("scheduled_notifications")
            .update({ status: "cancelled" })
            .eq("id", id);

        if (error) {
            console.error("Error cancelling scheduled notification:", error);
            return NextResponse.json(
                { error: "Failed to cancel scheduled notification" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Scheduled notification cancelled",
        });
    } catch (error) {
        console.error("Cancel scheduled notification error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
