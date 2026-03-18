import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NotificationService } from "@/lib/services/notification-service";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

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
            isTest,
        } = body;

        if (!title || !message) {
            return NextResponse.json(
                { error: "Title and message are required" },
                { status: 400 }
            );
        }

        // Handle test notification - send to admin only
        if (isTest) {
            const notifications = [{
                user_id: auth.admin.id,
                user_role: "admin" as const,
                type: "manual" as const,
                category: "test",
                title: `[TEST] ${title}`,
                message,
                action_url: actionUrl || null,
                priority,
                is_read: false,
                delivery_status: "sent",
            }];

            await NotificationService.createBulkNotifications(notifications);
            
            await logAuditEvent({
                actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
                action: "send_test",
                entityType: "notification",
                details: { title, message },
                ipAddress: getClientIP(request),
            });

            return NextResponse.json({
                success: true,
                count: 1,
                message: "Test notification sent to yourself",
            });
        }

        const supabase = createAdminClient();
        let recipientIds: string[] = [];

        // Get recipient list based on target type
        switch (targetType) {
            case "all": {
                // Get all users from both customers and volunteers
                const [customersRes, volunteersRes] = await Promise.all([
                    supabase.from("customers").select("id"),
                    supabase.from("volunteers").select("id"),
                ]);

                const customerIds = customersRes.data?.map((c) => ({ id: c.id, role: "customer" as const })) || [];
                const volunteerIds = volunteersRes.data?.map((v) => ({ id: v.id, role: "volunteer" as const })) || [];

                // Send to all users
                const notifications = [
                    ...customerIds.map((u) => ({
                        user_id: u.id,
                        user_role: u.role,
                        type: "manual" as const,
                        category: "manual",
                        title,
                        message,
                        action_url: actionUrl || null,
                        priority,
                        is_read: false,
                        delivery_status: "sent",
                    })),
                    ...volunteerIds.map((u) => ({
                        user_id: u.id,
                        user_role: u.role,
                        type: "manual" as const,
                        category: "manual",
                        title,
                        message,
                        action_url: actionUrl || null,
                        priority,
                        is_read: false,
                        delivery_status: "sent",
                    })),
                ];

                await NotificationService.createBulkNotifications(notifications);
                recipientIds = [...customerIds.map((c) => c.id), ...volunteerIds.map((v) => v.id)];
                
                if (notifications.length === 0) {
                    console.warn("No notifications to send - both customers and volunteers tables may be empty");
                }
                break;
            }

            case "role": {
                // If targetRole is not provided, default to sending to all
                if (!targetRole) {
                    const [customersRes, volunteersRes] = await Promise.all([
                        supabase.from("customers").select("id"),
                        supabase.from("volunteers").select("id"),
                    ]);

                    const customerIds = customersRes.data?.map((c) => ({ id: c.id, role: "customer" as const })) || [];
                    const volunteerIds = volunteersRes.data?.map((v) => ({ id: v.id, role: "volunteer" as const })) || [];

                    const notifications = [
                        ...customerIds.map((u) => ({
                            user_id: u.id,
                            user_role: u.role,
                            type: "manual" as const,
                            category: "manual",
                            title,
                            message,
                            action_url: actionUrl || null,
                            priority,
                            is_read: false,
                            delivery_status: "sent",
                        })),
                        ...volunteerIds.map((u) => ({
                            user_id: u.id,
                            user_role: u.role,
                            type: "manual" as const,
                            category: "manual",
                            title,
                            message,
                            action_url: actionUrl || null,
                            priority,
                            is_read: false,
                            delivery_status: "sent",
                        })),
                    ];

                    await NotificationService.createBulkNotifications(notifications);
                    recipientIds = [...customerIds.map((c) => c.id), ...volunteerIds.map((v) => v.id)];
                    break;
                }

                const tableName = targetRole === "customer" ? "customers" : targetRole === "volunteer" ? "volunteers" : "customers";
                const { data: users } = await supabase.from(tableName).select("id");

                const notifications = (users || []).map((user) => ({
                    user_id: user.id,
                    user_role: targetRole as "customer" | "volunteer" | "admin",
                    type: "manual" as const,
                    category: "manual",
                    title,
                    message,
                    action_url: actionUrl || null,
                    priority,
                    is_read: false,
                    delivery_status: "sent",
                }));

                await NotificationService.createBulkNotifications(notifications);
                recipientIds = users?.map((u) => u.id) || [];
                break;
            }

            case "individual": {
                if (!targetUserIds || targetUserIds.length === 0) {
                    return NextResponse.json(
                        { error: "At least one user must be selected" },
                        { status: 400 }
                    );
                }

                // Determine roles for each user by checking both tables
                const notifications = [];
                for (const userId of targetUserIds) {
                    // Check customers first
                    const { data: customer } = await supabase
                        .from("customers")
                        .select("id")
                        .eq("id", userId)
                        .single();
                    
                    if (customer) {
                        notifications.push({
                            user_id: userId,
                            user_role: "customer" as const,
                            type: "manual" as const,
                            category: "manual",
                            title,
                            message,
                            action_url: actionUrl || null,
                            priority,
                            is_read: false,
                            delivery_status: "sent",
                        });
                        continue;
                    }
                    
                    // Check volunteers
                    const { data: volunteer } = await supabase
                        .from("volunteers")
                        .select("id")
                        .eq("id", userId)
                        .single();
                    
                    if (volunteer) {
                        notifications.push({
                            user_id: userId,
                            user_role: "volunteer" as const,
                            type: "manual" as const,
                            category: "manual",
                            title,
                            message,
                            action_url: actionUrl || null,
                            priority,
                            is_read: false,
                            delivery_status: "sent",
                        });
                        continue;
                    }

                    // Check admins (auth.users)
                    if (targetRole === "admin") {
                        notifications.push({
                            user_id: userId,
                            user_role: "admin" as const,
                            type: "manual" as const,
                            category: "manual",
                            title,
                            message,
                            action_url: actionUrl || null,
                            priority,
                            is_read: false,
                            delivery_status: "sent",
                        });
                    }
                }

                await NotificationService.createBulkNotifications(notifications);
                recipientIds = targetUserIds;
                break;
            }

            case "filtered": {
                // Apply filters to get volunteers/customers
                let query = supabase.from("volunteers").select("id");

                if (filters?.zone) {
                    query = query.eq("zone_id", filters.zone);
                }

                if (filters?.orderStatus) {
                    // Get volunteers who have orders with the specified status
                    const { data: orders } = await supabase
                        .from("orders")
                        .select("volunteer_id")
                        .eq("order_status", filters.orderStatus)
                        .not("volunteer_id", "is", null);

                    const volunteerIds = [...new Set(orders?.map((o) => o.volunteer_id) || [])];
                    if (volunteerIds.length > 0) {
                        query = query.in("id", volunteerIds);
                    } else {
                        // No matches, no notifications to send
                        return NextResponse.json({ success: true, count: 0 });
                    }
                }

                const { data: users } = await query;

                const notifications = (users || []).map((user) => ({
                    user_id: user.id,
                    user_role: "volunteer" as const,
                    type: "manual" as const,
                    category: "manual",
                    title,
                    message,
                    action_url: actionUrl || null,
                    priority,
                    is_read: false,
                    delivery_status: "sent",
                }));

                await NotificationService.createBulkNotifications(notifications);
                recipientIds = users?.map((u) => u.id) || [];
                break;
            }

            default:
                return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "send_manual",
            entityType: "notification",
            details: {
                title,
                target_type: targetType,
                recipient_count: recipientIds.length,
                target_role: targetRole,
            },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({
            success: true,
            count: recipientIds.length,
            message: `Notification sent to ${recipientIds.length} recipient(s)`,
        });
    } catch (error: any) {
        console.error("Send notification error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to send notification" },
            { status: 500 }
        );
    }
}
