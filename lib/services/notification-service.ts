import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail, isEmailServiceConfigured } from "./email-service";

export interface CreateNotificationParams {
    user_id?: string;
    user_role: "admin" | "volunteer" | "customer" | "public";
    type: "order_update" | "payment_verified" | "challenge_milestone" | "admin_action" | "system_announcement" | "delivery_update" | "payment_failed" | "manual";
    title: string;
    message: string;
    action_url?: string;
    metadata?: Record<string, any>;
    category?: string;
    priority?: "critical" | "high" | "medium" | "low";
}

export interface NotificationPreferences {
    order_created?: boolean;
    payment_updates?: boolean;
    order_confirmed?: boolean;
    delivery_updates?: boolean;
    order_delivered?: boolean;
    promotions?: boolean;
    new_products?: boolean;
    tips_and_guides?: boolean;
    system_announcements?: boolean;
    push_notifications?: boolean;
    email_notifications?: boolean;
    sms_notifications?: boolean;

    // Volunteer specific
    order_updates?: boolean;
    delivery_assignments?: boolean;
    zone_updates?: boolean;
    challenge_milestones?: boolean;
    commission_updates?: boolean;
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
     * Create a single notification with priority and category
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
                category: params.category || 'system',
                priority: params.priority || 'medium',
                is_read: false,
                delivery_status: 'pending',
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
     * Create notification with priority and multi-channel support
     */
    static async createNotificationWithPriority(
        params: CreateNotificationParams,
        priority: 'critical' | 'high' | 'medium' | 'low',
        channels: ('push' | 'email' | 'sms')[] = ['push']
    ) {
        const supabase = await createClient();

        // Check user preferences first
        if (params.user_id && params.user_role !== 'admin') {
            const shouldSend = await this.shouldSendNotification(
                params.user_id,
                params.user_role,
                params.type
            );

            if (!shouldSend) {
                return { data: null, error: new Error('User opted out of this notification type'), skipped: true };
            }
        }

        // Create the notification
        const { data: notification, error } = await supabase
            .from("notifications")
            .insert({
                user_id: params.user_id,
                user_role: params.user_role,
                type: params.type,
                title: params.title,
                message: params.message,
                action_url: params.action_url,
                metadata: params.metadata || {},
                category: params.category || 'system',
                priority,
                sent_via: channels,
                is_read: false,
                delivery_status: 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating notification:", error);
            return { data: null, error };
        }

        // Send via additional channels if configured
        await this.sendMultiChannel(notification, channels, params);

        return { data: notification, error: null };
    }

    /**
     * Check if user should receive this notification based on preferences
     */
    static async shouldSendNotification(
        userId: string,
        userRole: string,
        notificationType: string
    ): Promise<boolean> {
        const supabase = await createClient();

        try {
            // Critical notifications always send
            const criticalTypes = ['payment_failed', 'order_cancelled'];
            if (criticalTypes.includes(notificationType)) {
                return true;
            }

            let preferences: NotificationPreferences | null = null;

            if (userRole === 'customer') {
                const { data } = await supabase
                    .from('customers')
                    .select('notification_preferences')
                    .eq('id', userId)
                    .single();
                preferences = data?.notification_preferences as NotificationPreferences;
            } else if (userRole === 'volunteer') {
                const { data } = await supabase
                    .from('volunteers')
                    .select('notification_preferences')
                    .eq('id', userId)
                    .single();
                preferences = data?.notification_preferences as NotificationPreferences;
            }

            if (!preferences) return true; // Default to sending

            // Check push notification preference first
            if (preferences.push_notifications === false) return false;

            // Map notification type to preference key
            const typeMap: Record<string, keyof NotificationPreferences> = {
                'order_update': 'order_updates',
                'payment_verified': 'payment_updates',
                'challenge_milestone': 'challenge_milestones',
                'delivery_update': 'delivery_updates',
            };

            const prefKey = typeMap[notificationType];
            if (prefKey && preferences[prefKey] === false) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking notification preferences:', error);
            return true; // Default to sending on error
        }
    }

    /**
     * Send notification via multiple channels
     */
    static async sendMultiChannel(
        notification: any,
        channels: string[],
        params: CreateNotificationParams
    ) {
        const supabase = await createClient();

        // Send email if in channels and configured
        if (channels.includes('email') && isEmailServiceConfigured()) {
            try {
                // Get user email
                let email: string | null = null;

                if (params.user_role === 'customer') {
                    const { data } = await supabase
                        .from('customers')
                        .select('email')
                        .eq('id', params.user_id)
                        .single();
                    email = data?.email;
                } else if (params.user_role === 'volunteer') {
                    const { data } = await supabase
                        .from('volunteers')
                        .select('email')
                        .eq('id', params.user_id)
                        .single();
                    email = data?.email;
                }

                if (email) {
                    await sendNotificationEmail({
                        to: email,
                        subject: params.title,
                        title: params.title,
                        message: params.message,
                        actionUrl: params.action_url ? `https://attaraljannah.com${params.action_url}` : undefined,
                        priority: params.priority || 'medium',
                    });
                }
            } catch (error) {
                console.error('Multi-channel email error:', error);
            }
        }

        // SMS would go here if implemented
        // We'll leave infrastructure but not implement for now
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
                    category: n.category || 'system',
                    priority: n.priority || 'medium',
                    is_read: false,
                    delivery_status: 'pending',
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
     * Notify when order is created
     */
    static async notifyOrderCreated(orderId: string) {
        const supabase = await createClient();

        const { data: order } = await supabase
            .from("orders")
            .select("id, customer_name, customer_id, referred_by, quantity, total_price")
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
                type: "order_update",
                category: "order",
                priority: "medium",
                title: "Order Received! 🎉",
                message: `Your order #${order.id.slice(0, 8)} has been received and is being processed.`,
                action_url: `/track/${order.id}`,
                metadata: { order_id: order.id, event: 'order_created' },
            });
        }

        // Notify referring volunteer if exists
        if (order.referred_by) {
            notifications.push({
                user_id: order.referred_by,
                user_role: "volunteer",
                type: "order_update",
                category: "order",
                priority: "medium",
                title: "New Referral! 🎯",
                message: `Customer ${order.customer_name} placed order #${order.id.slice(0, 8)} via your referral!`,
                action_url: `/volunteer/orders`,
                metadata: { order_id: order.id, customer_name: order.customer_name },
            });
        }

        // Notify admins
        await this.notifyAdminOrderCreated(orderId);

        if (notifications.length > 0) {
            return await this.createBulkNotifications(notifications);
        }

        return { data: [], error: null };
    }

    /**
     * Notify when payment fails
     */
    static async notifyPaymentFailed(orderId: string) {
        const supabase = await createClient();

        const { data: order } = await supabase
            .from("orders")
            .select("id, customer_id, customer_name, total_price")
            .eq("id", orderId)
            .single();

        if (!order || !order.customer_id) {
            return { data: null, error: new Error("Order or customer not found") };
        }

        // Critical priority - send via multiple channels
        await this.createNotificationWithPriority({
            user_id: order.customer_id,
            user_role: "customer",
            type: "payment_failed",
            category: "order",
            title: "Payment Action Required ⚠️",
            message: `Payment for order #${order.id.slice(0, 8)} was not completed. Please retry payment to process your order.`,
            action_url: `/track/${order.id}`,
            metadata: { order_id: order.id, amount: order.total_price },
        }, 'critical', ['push', 'email']);

        // Notify admin of failed payment
        await this.notifyAdminPaymentFailed(orderId);

        return { data: 'sent', error: null };
    }

    /**
     * Notify when order status changes (enhanced with all statuses)
     */
    static async notifyOrderStatusChange(params: NotifyOrderStatusChangeParams) {
        const supabase = await createClient();

        const { data: order } = await supabase
            .from("orders")
            .select("id, customer_name, customer_id, referred_by, order_status, total_price, quantity")
            .eq("id", params.orderId)
            .single();

        if (!order) {
            return { data: null, error: new Error("Order not found") };
        }

        const notifications: CreateNotificationParams[] = [];

        let statusMessage = "";
        let actionUrl = `/track/${order.id}`;
        let priority: "critical" | "high" | "medium" | "low" = "medium";
        let channels: ('push' | 'email')[] = ['push'];

        switch (params.newStatus) {
            case "confirmed":
                statusMessage = `Your order #${order.id.slice(0, 8)} has been confirmed! 🎉`;
                priority = "high";
                channels = ['push', 'email'];
                break;
            case "delivered":
                statusMessage = `Your order #${order.id.slice(0, 8)} has been delivered! ✅`;
                priority = "high";
                channels = ['push', 'email'];
                break;
            case "out_for_delivery":
                statusMessage = `Your order #${order.id.slice(0, 8)} is out for delivery! 📦`;
                priority = "high";
                channels = ['push', 'email'];
                break;
            case "cancelled":
                statusMessage = `Your order #${order.id.slice(0, 8)} has been cancelled.`;
                priority = "high";
                channels = ['push', 'email'];
                break;
            default:
                statusMessage = `Your order #${order.id.slice(0, 8)} status updated to: ${params.newStatus}`;
                priority = "medium";
        }

        // Notify customer
        if (params.customerId || order.customer_id) {
            await this.createNotificationWithPriority({
                user_id: params.customerId || order.customer_id,
                user_role: "customer",
                type: "order_update",
                category: "order",
                title: "Order Status Update",
                message: statusMessage,
                action_url: actionUrl,
                metadata: { order_id: order.id, new_status: params.newStatus },
            }, priority, channels);
        }

        // Notify referring volunteer if order is confirmed
        if (params.newStatus === "confirmed" && (params.volunteerId || order.referred_by)) {
            const volunteerId = params.volunteerId || order.referred_by;

            await this.createNotificationWithPriority({
                user_id: volunteerId,
                user_role: "volunteer",
                type: "order_update",
                category: "order",
                title: "Order Confirmed! 🎉",
                message: `An order you referred (#${order.id.slice(0, 8)}) has been confirmed!`,
                action_url: `/volunteer/dashboard`,
                metadata: { order_id: order.id, customer_name: order.customer_name },
            }, 'medium', ['push']);
        }

        return { data: 'sent', error: null };
    }

    /**
     * Notify when delivery is assigned
     */
    static async notifyDeliveryAssigned(orderId: string, volunteerId: string) {
        const supabase = await createClient();

        const { data: order } = await supabase
            .from("orders")
            .select("id, customer_id, customer_name")
            .eq("id", orderId)
            .single();

        const { data: volunteer } = await supabase
            .from("volunteers")
            .select("id, name, phone")
            .eq("id", volunteerId)
            .single();

        if (!order || !volunteer) {
            return { data: null, error: new Error("Order or volunteer not found") };
        }

        // Notify volunteer
        await this.createNotificationWithPriority({
            user_id: volunteerId,
            user_role: "volunteer",
            type: "delivery_update",
            category: "delivery",
            title: "Delivery Assigned 🚚",
            message: `You've been assigned delivery for order #${order.id.slice(0, 8)} (${order.customer_name})`,
            action_url: `/volunteer/delivery`,
            metadata: { order_id: order.id },
        }, 'high', ['push', 'email']);

        // Notify customer
        if (order.customer_id) {
            await this.createNotificationWithPriority({
                user_id: order.customer_id,
                user_role: "customer",
                type: "delivery_update",
                category: "delivery",
                title: "Volunteer Assigned 🚚",
                message: `${volunteer.name} will deliver your order #${order.id.slice(0, 8)}.\nContact: ${volunteer.phone}`,
                action_url: `/track/${order.id}`,
                metadata: { order_id: order.id, volunteer_name: volunteer.name },
            }, 'high', ['push', 'email']);
        }

        return { data: 'sent', error: null };
    }

    /**
     * Notify when delivery is completed
     */
    static async notifyDeliveryCompleted(orderId: string, volunteerId: string) {
        const supabase = await createClient();

        const { data: order } = await supabase
            .from("orders")
            .select("id, customer_id, referred_by, delivery_commission")
            .eq("id", orderId)
            .single();

        if (!order) {
            return { data: null, error: new Error("Order not found") };
        }

        // Notify volunteer
        await this.createNotificationWithPriority({
            user_id: volunteerId,
            user_role: "volunteer",
            type: "delivery_update",
            category: "delivery",
            title: "Delivery Confirmed! ✅",
            message: `Order #${order.id.slice(0, 8)} delivery confirmed. Commission earned: ₹${order.delivery_commission || 0}`,
            action_url: `/volunteer/delivery`,
            metadata: { order_id: order.id, commission: order.delivery_commission },
        }, 'medium', ['push']);

        // Notify customer
        if (order.customer_id) {
            await this.notifyOrderStatusChange({
                orderId: order.id,
                newStatus: 'delivered',
                customerId: order.customer_id,
            });
        }

        return { data: 'sent', error: null };
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
                category: "order",
                priority: "high",
                title: "Payment Verified ✅",
                message: `Your payment for order #${order.id.slice(0, 8)} has been verified!`,
                action_url: `/track/${order.id}`,
                metadata: { order_id: order.id },
            });
        }

        // Notify volunteer
        if (order.referred_by) {
            notifications.push({
                user_id: order.referred_by,
                user_role: "volunteer",
                type: "payment_verified",
                category: "order",
                priority: "medium",
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

        return await this.createNotificationWithPriority({
            user_id: volunteerId,
            user_role: "volunteer",
            type: "challenge_milestone",
            category: "achievement",
            title,
            message,
            action_url: "/volunteer/dashboard",
            metadata: { milestone, total_bottles: milestone },
        }, 'medium', ['push', 'email']);
    }

    /**
     * Notify zone assignment
     */
    static async notifyZoneAssigned(volunteerId: string, zoneId: string) {
        const supabase = await createClient();

        const { data: zone } = await supabase
            .from("delivery_zones")
            .select("name, pincodes")
            .eq("id", zoneId)
            .single();

        if (!zone) return { data: null, error: new Error("Zone not found") };

        return await this.createNotificationWithPriority({
            user_id: volunteerId,
            user_role: "volunteer",
            type: "admin_action",
            category: "zone",
            title: "Zone Assignment 📍",
            message: `You've been assigned to zone: ${zone.name}`,
            action_url: "/volunteer/zones",
            metadata: { zone_id: zoneId, zone_name: zone.name },
        }, 'medium', ['push']);
    }

    /**
     * Notify delivery request update
     */
    static async notifyDeliveryRequestUpdate(requestId: string, status: string, volunteerId: string) {
        const title = status === 'approved' ? 'Delivery Request Approved ✅' : 'Delivery Request Update ⚠️';
        const message = status === 'approved'
            ? 'Your delivery request has been approved! You can now proceed with the delivery.'
            : `Your delivery request has been ${status}.`;

        return await this.createNotificationWithPriority({
            user_id: volunteerId,
            user_role: "volunteer",
            type: "admin_action",
            category: "delivery",
            title,
            message,
            action_url: "/volunteer/delivery",
            metadata: { request_id: requestId, status },
        }, 'high', ['push']);
    }

    /**
     * Notify admins of new order
     */
    static async notifyAdminOrderCreated(orderId: string) {
        const supabase = await createClient();

        const { data: order } = await supabase
            .from("orders")
            .select("id, customer_name, quantity, total_price")
            .eq("id", orderId)
            .single();

        if (!order) return { data: null, error: new Error("Order not found") };

        return await this.notifyAdmins(
            "🆕 New Order Received",
            `Order #${order.id.slice(0, 8)} - ${order.customer_name} (${order.quantity} bottles, ₹${order.total_price})`,
            `/admin/orders/${order.id}`,
            { order_id: order.id, priority: 'high' }
        );
    }

    /**
     * Notify admins of new delivery request
     */
    static async notifyAdminDeliveryRequest(requestId: string) {
        const supabase = await createClient();

        const { data: request } = await supabase
            .from("delivery_requests")
            .select(`
                id,
                order:orders(id, customer_name),
                volunteer:volunteers(name)
            `)
            .eq("id", requestId)
            .single();

        if (!request) return { data: null, error: new Error("Request not found") };

        // Supabase returns arrays for joined relations by default unless using !inner or single() on the relation
        const volunteerName = Array.isArray(request.volunteer) ? request.volunteer[0]?.name : (request.volunteer as any)?.name;
        const orderId = Array.isArray(request.order) ? request.order[0]?.id : (request.order as any)?.id;

        return await this.notifyAdmins(
            "🚚 New Delivery Request",
            `Volunteer ${volunteerName} requested delivery for order #${orderId?.slice(0, 8)}`,
            `/admin/delivery-requests`,
            { request_id: requestId, priority: 'high' }
        );
    }

    /**
     * Notify admins of new volunteer
     */
    static async notifyAdminNewVolunteer(volunteerId: string) {
        const supabase = await createClient();

        const { data: volunteer } = await supabase
            .from("volunteers")
            .select("name, phone, volunteer_id")
            .eq("id", volunteerId)
            .single();

        if (!volunteer) return { data: null, error: new Error("Volunteer not found") };

        return await this.notifyAdmins(
            "👤 New Volunteer Registered",
            `${volunteer.name} (${volunteer.volunteer_id}) has joined as a volunteer`,
            `/admin/volunteers/${volunteerId}`,
            { volunteer_id: volunteerId, priority: 'medium' }
        );
    }

    /**
     * Notify admins of payment failure
     */
    static async notifyAdminPaymentFailed(orderId: string) {
        const supabase = await createClient();

        const { data: order } = await supabase
            .from("orders")
            .select("id, customer_name, total_price")
            .eq("id", orderId)
            .single();

        if (!order) return { data: null, error: new Error("Order not found") };

        return await this.notifyAdmins(
            "⚠️ Payment Failed",
            `Order #${order.id.slice(0, 8)} - ${order.customer_name} payment issue (₹${order.total_price})`,
            `/admin/orders/${order.id}`,
            { order_id: order.id, priority: 'critical' }
        );
    }

    /**
     * Update customer preferences
     */
    static async updateCustomerPreferences(customerId: string, preferences: Partial<NotificationPreferences>) {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('customers')
            .update({ notification_preferences: preferences })
            .eq('id', customerId)
            .select()
            .single();

        return { data, error };
    }

    /**
     * Get customer preferences
     */
    static async getCustomerPreferences(customerId: string) {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('customers')
            .select('notification_preferences')
            .eq('id', customerId)
            .single();

        return { data: data?.notification_preferences as NotificationPreferences, error };
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
            // Fetch volunteers
            const { data: volunteers } = await supabase.from("volunteers").select("auth_id, role");

            if (volunteers) {
                volunteers.forEach((v) => {
                    if (v.auth_id) {
                        notifications.push({
                            user_id: v.auth_id,
                            user_role: (v.role || "volunteer") as any,
                            type: "system_announcement",
                            category: "system",
                            priority: (options?.priority as any) || 'medium',
                            title,
                            message,
                            action_url: options?.actionUrl,
                            metadata: { priority: options?.priority || "medium" },
                        });
                    }
                });
            }

            // Fetch Customers
            const { data: customers } = await supabase.from("customers").select("id");
            if (customers) {
                customers.forEach((c) => {
                    notifications.push({
                        user_id: c.id,
                        user_role: "customer",
                        type: "system_announcement",
                        category: "system",
                        priority: (options?.priority as any) || 'medium',
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
                category: "system",
                priority: (options?.priority as any) || 'medium',
                title,
                message,
                action_url: options?.actionUrl,
                metadata: { priority: options?.priority || "medium" },
            });
        } else if (targetType === "role" && options?.targetRole) {
            if (options.targetRole === "volunteer") {
                const { data: users } = await supabase
                    .from("volunteers")
                    .select("auth_id, role")
                    .eq("role", "volunteer");

                if (users) {
                    users.forEach((user) => {
                        if (user.auth_id) {
                            notifications.push({
                                user_id: user.auth_id,
                                user_role: "volunteer",
                                type: "system_announcement",
                                category: "system",
                                priority: (options?.priority as any) || 'medium',
                                title,
                                message,
                                action_url: options?.actionUrl,
                                metadata: { priority: options?.priority || "medium" },
                            });
                        }
                    });
                }
            } else if (options.targetRole === "customer") {
                const { data: users } = await supabase
                    .from("customers")
                    .select("id");

                if (users) {
                    users.forEach((user) => {
                        notifications.push({
                            user_id: user.id,
                            user_role: "customer",
                            type: "system_announcement",
                            category: "system",
                            priority: (options?.priority as any) || 'medium',
                            title,
                            message,
                            action_url: options?.actionUrl,
                            metadata: { priority: options?.priority || "medium" },
                        });
                    });
                }
            } else if (options.targetRole === "admin") {
                // Use service role to find admins from Auth
                const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
                const adminSupabase = createSupabaseClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                );

                const { data: { users: authUsers } } = await adminSupabase.auth.admin.listUsers();
                const { ALLOWED_ADMINS } = await import("@/lib/config/admin");

                const adminIds = authUsers
                    .filter(u => u.email && ALLOWED_ADMINS.includes(u.email))
                    .map(u => u.id);

                if (adminIds.length > 0) {
                    adminIds.forEach((id) => {
                        notifications.push({
                            user_id: id,
                            user_role: "admin",
                            type: "system_announcement",
                            category: "system",
                            priority: (options?.priority as any) || 'medium',
                            title,
                            message,
                            action_url: options?.actionUrl,
                            metadata: { priority: options?.priority || "medium" },
                        });
                    });
                }
            }
        } else if (targetType === "individual" && options?.targetUserIds) {
            const ids = options.targetUserIds;

            // Check Volunteers (Auth ID)
            const { data: vols } = await supabase.from("volunteers").select("auth_id, role").in("auth_id", ids);
            if (vols) {
                vols.forEach(v => {
                    notifications.push({
                        user_id: v.auth_id!,
                        user_role: (v.role || "volunteer") as any,
                        type: "system_announcement",
                        category: "system",
                        priority: (options?.priority as any) || 'medium',
                        title,
                        message,
                        action_url: options?.actionUrl,
                        metadata: { priority: options?.priority || "medium" },
                    });
                });
            }

            // Check Customers (ID)
            const { data: custs } = await supabase.from("customers").select("id").in("id", ids);
            if (custs) {
                custs.forEach(c => {
                    notifications.push({
                        user_id: c.id,
                        user_role: "customer",
                        type: "system_announcement",
                        category: "system",
                        priority: (options?.priority as any) || 'medium',
                        title,
                        message,
                        action_url: options?.actionUrl,
                        metadata: { priority: options?.priority || "medium" },
                    });
                });
            }

            // Check Admins
            const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
            const adminSupabase = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            const { data: { users: authUsers } } = await adminSupabase.auth.admin.listUsers();
            const { ALLOWED_ADMINS } = await import("@/lib/config/admin");

            const adminIds = authUsers
                .filter(u => u.email && ALLOWED_ADMINS.includes(u.email) && ids.includes(u.id))
                .map(u => u.id);

            if (adminIds) {
                adminIds.forEach(id => {
                    notifications.push({
                        user_id: id,
                        user_role: "admin",
                        type: "system_announcement",
                        category: "system",
                        priority: (options?.priority as any) || 'medium',
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
        // Use service role to find admins
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { ALLOWED_ADMINS } = await import("@/lib/config/admin");
        const { data: { users: authUsers } } = await adminSupabase.auth.admin.listUsers();

        const adminIds = authUsers
            .filter(u => u.email && ALLOWED_ADMINS.includes(u.email))
            .map(u => u.id);

        if (adminIds.length === 0) {
            return { data: [], error: null };
        }

        const priority = (metadata?.priority as any) || 'high';

        const notifications: CreateNotificationParams[] = adminIds.map((id) => ({
            user_id: id,
            user_role: "admin",
            type: "admin_action",
            category: "admin",
            priority,
            title,
            message,
            action_url: actionUrl,
            metadata: metadata || {},
        }));

        return await this.createBulkNotifications(notifications);
    }
}
