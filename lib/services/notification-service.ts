import { createClient } from "@/lib/supabase/server";

export interface CreateNotificationParams {
    user_id?: string;
    user_role: "admin" | "volunteer" | "customer" | "public";
    type: "order_update" | "payment_verified" | "challenge_milestone" | "admin_action" | "system_announcement";
    title: string;
    message: string;
    action_url?: string;
    metadata?: Record<string, any>;
}

export interface NotifyOrderStatusChangeParams {
    orderId: string;
    newStatus: string;
    customerId?: string;
    volunteerId?: string;
}

export interface NotifyChallengeMilestoneParams {
    volunteerId: string;
    milestone: number;
    volunteerName: string;
}

/**
 * Centralized notification service for creating and managing notifications
 */
export class NotificationService {
    /**
     * Create a single notification
     */
    static async createNotification(params: CreateNotificationParams) {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("notifications")
            .insert({
                user_id: params.user_id,
                user_role: params.user_role,
                type: params.type,
                title: params.title,
                message: params.message,
                action_url: params.action_url,
                metadata: params.metadata || {},
                is_read: false,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating notification:", error);
            return { data: null, error };
        }

        return { data, error: null };
    }

    /**
     * Create notifications for multiple users
     */
    static async createBulkNotifications(notifications: CreateNotificationParams[]) {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("notifications")
            .insert(
                notifications.map((n) => ({
                    user_id: n.user_id,
                    user_role: n.user_role,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    action_url: n.action_url,
                    metadata: n.metadata || {},
                    is_read: false,
                }))
            )
            .select();

        if (error) {
            console.error("Error creating bulk notifications:", error);
            return { data: null, error };
        }

        return { data, error: null };
    }

    /**
     * Notify when order status changes
     */
    static async notifyOrderStatusChange(params: NotifyOrderStatusChangeParams) {
        const supabase = await createClient();

        // Fetch order details
        const { data: order } = await supabase
            .from("orders")
            .select("id, customer_name, customer_id, referred_by, order_status, total_price")
            .eq("id", params.orderId)
            .single();

        if (!order) {
            return { data: null, error: new Error("Order not found") };
        }

        const notifications: CreateNotificationParams[] = [];

        // Determine notification message based on status
        let statusMessage = "";
        let actionUrl = "";

        switch (params.newStatus) {
            case "confirmed":
                statusMessage = `Your order #${order.id.slice(0, 8)} has been confirmed! 🎉`;
                actionUrl = `/order/${order.id}`;
                break;
            case "delivered":
                statusMessage = `Your order #${order.id.slice(0, 8)} has been delivered! ✅`;
                actionUrl = `/order/${order.id}`;
                break;
            default:
                statusMessage = `Your order #${order.id.slice(0, 8)} status updated to: ${params.newStatus}`;
                actionUrl = `/order/${order.id}`;
        }

        // Notify customer
        if (params.customerId || order.customer_id) {
            notifications.push({
                user_id: params.customerId || order.customer_id,
                user_role: "customer",
                type: "order_update",
                title: "Order Status Update",
                message: statusMessage,
                action_url: actionUrl,
                metadata: { order_id: order.id, new_status: params.newStatus },
            });
        }

        // Notify referring volunteer if order is confirmed
        if (params.newStatus === "confirmed" && (params.volunteerId || order.referred_by)) {
            const volunteerId = params.volunteerId || order.referred_by;

            notifications.push({
                user_id: volunteerId,
                user_role: "volunteer",
                type: "order_update",
                title: "Order Confirmed! 🎉",
                message: `An order you referred (#${order.id.slice(0, 8)}) has been confirmed!`,
                action_url: `/volunteer/dashboard`,
                metadata: { order_id: order.id, customer_name: order.customer_name },
            });
        }

        if (notifications.length > 0) {
            return await this.createBulkNotifications(notifications);
        }

        return { data: [], error: null };
    }

    /**
     * Notify when payment is verified
     */
    static async notifyPaymentVerified(orderId: string) {
        const supabase = await createClient();

        const { data: order } = await supabase
            .from("orders")
            .select("id, customer_id, customer_name, referred_by")
            .eq("id", orderId)
            .single();

        if (!order) {
            return { data: null, error: new Error("Order not found") };
        }

        const notifications: CreateNotificationParams[] = [];

        // Notify customer
        if (order.customer_id) {
            notifications.push({
                user_id: order.customer_id,
                user_role: "customer",
                type: "payment_verified",
                title: "Payment Verified ✅",
                message: `Your payment for order #${order.id.slice(0, 8)} has been verified!`,
                action_url: `/order/${order.id}`,
                metadata: { order_id: order.id },
            });
        }

        // Notify volunteer
        if (order.referred_by) {
            notifications.push({
                user_id: order.referred_by,
                user_role: "volunteer",
                type: "payment_verified",
                title: "Payment Verified",
                message: `Payment verified for order #${order.id.slice(0, 8)} (${order.customer_name})`,
                action_url: `/volunteer/dashboard`,
                metadata: { order_id: order.id },
            });
        }

        return await this.createBulkNotifications(notifications);
    }

    /**
     * Notify volunteer when they reach a milestone
     */
    static async notifyChallengeMilestone(params: NotifyChallengeMilestoneParams) {
        const { volunteerId, milestone, volunteerName } = params;

        let title = "";
        let message = "";

        switch (milestone) {
            case 5:
                title = "First Milestone Reached! 🎯";
                message = `Great progress, ${volunteerName}! You've reached 5 bottles!`;
                break;
            case 10:
                title = "Halfway There! 🚀";
                message = `Amazing work, ${volunteerName}! You're at 10 bottles - halfway to your goal!`;
                break;
            case 15:
                title = "Almost There! ⭐";
                message = `Excellent progress, ${volunteerName}! Just 5 more bottles to reach your goal of 20!`;
                break;
            case 20:
                title = "🎉 Congratulations! Goal Achieved! 🎉";
                message = `Fantastic work, ${volunteerName}! You've successfully reached your goal of 20 bottles!`;
                break;
            default:
                title = `Milestone: ${milestone} Bottles`;
                message = `You've reached ${milestone} bottles!`;
        }

        return await this.createNotification({
            user_id: volunteerId,
            user_role: "volunteer",
            type: "challenge_milestone",
            title,
            message,
            action_url: "/volunteer/dashboard",
            metadata: { milestone, total_bottles: milestone },
        });
    }

    /**
     * Create system announcement for multiple users
     */
    static async createSystemAnnouncement(
        title: string,
        message: string,
        targetType: "all" | "role" | "individual",
        options?: {
            targetRole?: string;
            targetUserIds?: string[];
            actionUrl?: string;
            priority?: string;
        }
    ) {
        const supabase = await createClient();
        const notifications: CreateNotificationParams[] = [];

        if (targetType === "all") {
            // Fetch all users
            const { data: users } = await supabase.from("users").select("id, role");

            if (users) {
                users.forEach((user) => {
                    notifications.push({
                        user_id: user.id,
                        user_role: user.role as any,
                        type: "system_announcement",
                        title,
                        message,
                        action_url: options?.actionUrl,
                        metadata: { priority: options?.priority || "medium" },
                    });
                });
            }

            // Also create a public notification for non-logged-in users
            notifications.push({
                user_role: "public",
                type: "system_announcement",
                title,
                message,
                action_url: options?.actionUrl,
                metadata: { priority: options?.priority || "medium" },
            });
        } else if (targetType === "role" && options?.targetRole) {
            // Fetch users by role
            const { data: users } = await supabase
                .from("users")
                .select("id, role")
                .eq("role", options.targetRole);

            if (users) {
                users.forEach((user) => {
                    notifications.push({
                        user_id: user.id,
                        user_role: user.role as any,
                        type: "system_announcement",
                        title,
                        message,
                        action_url: options?.actionUrl,
                        metadata: { priority: options?.priority || "medium" },
                    });
                });
            }
        } else if (targetType === "individual" && options?.targetUserIds) {
            // Fetch specific users
            const { data: users } = await supabase
                .from("users")
                .select("id, role")
                .in("id", options.targetUserIds);

            if (users) {
                users.forEach((user) => {
                    notifications.push({
                        user_id: user.id,
                        user_role: user.role as any,
                        type: "system_announcement",
                        title,
                        message,
                        action_url: options?.actionUrl,
                        metadata: { priority: options?.priority || "medium" },
                    });
                });
            }
        }

        if (notifications.length > 0) {
            const result = await this.createBulkNotifications(notifications);
            return {
                ...result,
                count: notifications.length,
            };
        }

        return { data: [], error: null, count: 0 };
    }

    /**
     * Notify admin of an action
     */
    static async notifyAdmins(title: string, message: string, actionUrl?: string, metadata?: Record<string, any>) {
        const supabase = await createClient();

        const { data: admins } = await supabase.from("users").select("id").eq("role", "admin");

        if (!admins || admins.length === 0) {
            return { data: [], error: null };
        }

        const notifications: CreateNotificationParams[] = admins.map((admin) => ({
            user_id: admin.id,
            user_role: "admin",
            type: "admin_action",
            title,
            message,
            action_url: actionUrl,
            metadata: metadata || {},
        }));

        return await this.createBulkNotifications(notifications);
    }
}
