import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { NotificationService } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        // For self-hosted: optional cron secret check (not required)
        // If CRON_SECRET is set in environment, verify it
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = request.headers.get('authorization');
        
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const now = new Date();

        // Get all pending scheduled notifications that are due
        const { data: dueNotifications, error: fetchError } = await supabase
            .from("scheduled_notifications")
            .select("*")
            .eq("status", "pending")
            .lte("scheduled_for", now.toISOString());

        if (fetchError) {
            console.error("Error fetching due notifications:", fetchError);
            return NextResponse.json(
                { error: "Failed to fetch due notifications" },
                { status: 500 }
            );
        }

        if (!dueNotifications || dueNotifications.length === 0) {
            return NextResponse.json({
                success: true,
                processed: 0,
                message: "No notifications due",
            });
        }

        console.log(`📅 Processing ${dueNotifications.length} scheduled notifications`);

        let processedCount = 0;
        let errorCount = 0;

        for (const scheduled of dueNotifications) {
            try {
                const targetFilters = scheduled.target_filters;
                let recipientIds: string[] = [];
                const notifications: any[] = [];

                // Determine recipients based on target filters
                switch (targetFilters?.type) {
                    case "all": {
                        const [customersRes, volunteersRes] = await Promise.all([
                            supabase.from("customers").select("id"),
                            supabase.from("volunteers").select("id"),
                        ]);

                        const customerIds = customersRes.data?.map((c) => ({
                            id: c.id,
                            role: "customer",
                        })) || [];
                        const volunteerIds = volunteersRes.data?.map((v) => ({
                            id: v.id,
                            role: "volunteer",
                        })) || [];

                        notifications.push(
                            ...customerIds.map((u) => ({
                                user_id: u.id,
                                user_role: u.role,
                                type: "scheduled",
                                category: "scheduled",
                                title: scheduled.title,
                                message: scheduled.message,
                                action_url: scheduled.action_url,
                                priority: scheduled.priority,
                                is_read: false,
                                delivery_status: "sent",
                            })),
                            ...volunteerIds.map((u) => ({
                                user_id: u.id,
                                user_role: u.role,
                                type: "scheduled",
                                category: "scheduled",
                                title: scheduled.title,
                                message: scheduled.message,
                                action_url: scheduled.action_url,
                                priority: scheduled.priority,
                                is_read: false,
                                delivery_status: "sent",
                            }))
                        );

                        recipientIds = [
                            ...customerIds.map((c) => c.id),
                            ...volunteerIds.map((v) => v.id),
                        ];
                        break;
                    }

                    case "role": {
                        const role = targetFilters?.role;
                        if (!role) {
                            console.error(`Scheduled notification ${scheduled.id} missing role, skipping`);
                            break;
                        }
                        const tableName = role === "customer" ? "customers" : "volunteers";
                        const { data: users } = await supabase.from(tableName).select("id");

                        notifications.push(
                            ...(users || []).map((user) => ({
                                user_id: user.id,
                                user_role: role,
                                type: "scheduled",
                                category: "scheduled",
                                title: scheduled.title,
                                message: scheduled.message,
                                action_url: scheduled.action_url,
                                priority: scheduled.priority,
                                is_read: false,
                                delivery_status: "sent",
                            }))
                        );

                        recipientIds = users?.map((u) => u.id) || [];
                        break;
                    }

                    case "individual": {
                        const userIds = targetFilters?.userIds || [];
                        const role = targetFilters?.role || "customer";

                        notifications.push(
                            ...userIds.map((userId: string) => ({
                                user_id: userId,
                                user_role: role,
                                type: "scheduled",
                                category: "scheduled",
                                title: scheduled.title,
                                message: scheduled.message,
                                action_url: scheduled.action_url,
                                priority: scheduled.priority,
                                is_read: false,
                                delivery_status: "sent",
                            }))
                        );

                        recipientIds = userIds;
                        break;
                    }

                    case "filtered": {
                        const filters = targetFilters?.filters || {};
                        let query = supabase.from("volunteers").select("id");

                        if (filters.zone) {
                            query = query.eq("zone_id", filters.zone);
                        }

                        if (filters.orderStatus) {
                            const { data: orders } = await supabase
                                .from("orders")
                                .select("volunteer_id")
                                .eq("order_status", filters.orderStatus)
                                .not("volunteer_id", "is", null);

                            const volunteerIds = [
                                ...new Set(orders?.map((o) => o.volunteer_id) || []),
                            ];

                            if (volunteerIds.length > 0) {
                                query = query.in("id", volunteerIds);
                            } else {
                                break; // No matches
                            }
                        }

                        const { data: users } = await query;

                        notifications.push(
                            ...(users || []).map((user) => ({
                                user_id: user.id,
                                user_role: "volunteer",
                                type: "scheduled",
                                category: "scheduled",
                                title: scheduled.title,
                                message: scheduled.message,
                                action_url: scheduled.action_url,
                                priority: scheduled.priority,
                                is_read: false,
                                delivery_status: "sent",
                            }))
                        );

                        recipientIds = users?.map((u) => u.id) || [];
                        break;
                    }

                    default:
                        console.error(`Unknown target type: ${targetFilters?.type}`);
                }

                // Send notifications
                if (notifications.length > 0) {
                    await NotificationService.createBulkNotifications(notifications);
                }

                // Update scheduled notification status
                let nextStatus = "sent";
                let nextScheduledFor = scheduled.scheduled_for;

                // Handle recurring notifications
                if (scheduled.recurrence && scheduled.recurrence !== "once") {
                    const currentDate = new Date(scheduled.scheduled_for);

                    switch (scheduled.recurrence) {
                        case "daily":
                            currentDate.setDate(currentDate.getDate() + 1);
                            break;
                        case "weekly":
                            currentDate.setDate(currentDate.getDate() + 7);
                            break;
                        case "monthly":
                            currentDate.setMonth(currentDate.getMonth() + 1);
                            break;
                    }

                    nextStatus = "pending";
                    nextScheduledFor = currentDate.toISOString();
                }

                await supabase
                    .from("scheduled_notifications")
                    .update({
                        status: nextStatus,
                        last_sent_at: now.toISOString(),
                        scheduled_for: nextScheduledFor,
                    })
                    .eq("id", scheduled.id);

                console.log(
                    `✅ Sent scheduled notification "${scheduled.title}" to ${recipientIds.length} recipients`
                );
                processedCount++;
            } catch (error) {
                console.error(`❌ Error processing scheduled notification ${scheduled.id}:`, error);
                errorCount++;

                // Mark as failed
                await supabase
                    .from("scheduled_notifications")
                    .update({ status: "failed" })
                    .eq("id", scheduled.id);
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            errors: errorCount,
            message: `Processed ${processedCount} notifications, ${errorCount} errors`,
        });
    } catch (error: any) {
        console.error("Cron process scheduled notifications error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process notifications" },
            { status: 500 }
        );
    }
}
