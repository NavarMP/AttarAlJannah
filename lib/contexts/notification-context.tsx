"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./auth-context";

interface Notification {
    id: string;
    user_id?: string;
    user_role: string;
    type: string;
    title: string;
    message: string;
    action_url?: string;
    metadata?: any;
    is_read: boolean;
    created_at: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        // Determine User ID: Supabase User OR Local Storage Simple Auth UUID
        let targetUserId = user?.id;

        if (!targetUserId) {
            // Check for Voluneer/Customer simple auth UUIDs
            // Contexts might not be fully loaded here, so we check localStorage directly as fallback
            if (typeof window !== "undefined") {
                targetUserId = localStorage.getItem("volunteerUuid") || localStorage.getItem("customerUuid") || undefined;
                // Note: We need to ensure we set 'customerUuid' somewhere. 
                // Currently CustomerAuthContext sets 'customerPhone' and 'customerProfile' (which might haven id).
                // We'll update CustomerAuthContext to save UUID too.
            }
        }

        // If still no ID, clear and return
        if (!targetUserId) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        try {
            // Pass user_id explicitly for Simple Auth cases
            const response = await fetch(`/api/notifications?limit=20&offset=0&user_id=${targetUserId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch notifications");
            }

            const data = await response.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.notifications?.filter((n: Notification) => !n.is_read).length || 0);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Mark notification as read
    const markAsRead = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_read: true }),
            });

            if (!response.ok) {
                throw new Error("Failed to mark as read");
            }

            // Update local state first (Optimistic)
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));

            // Re-fetch to confirm state (in case of race conditions)
            setTimeout(() => {
                fetchNotifications();
            }, 500);
        } catch (error) {
            console.error("Error marking notification as read:", error);
            toast.error("Failed to update notification");
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const response = await fetch("/api/notifications/mark-all-read", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Failed to mark all as read");
            }

            // Update local state
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error("Error marking all as read:", error);
            toast.error("Failed to update notifications");
        }
    };

    // Delete notification
    const deleteNotification = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete notification");
            }

            // Update local state
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            setUnreadCount((prev) => {
                const notification = notifications.find((n) => n.id === id);
                return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
            });
        } catch (error) {
            console.error("Error deleting notification:", error);
            toast.error("Failed to delete notification");
        }
    };

    // Fetch notifications on mount and when user changes
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Setup Supabase Realtime subscription for new notifications
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotification = payload.new as Notification;

                    // Add to notifications list
                    setNotifications((prev) => [newNotification, ...prev]);
                    setUnreadCount((prev) => prev + 1);

                    // Show toast notification
                    toast.info(newNotification.title, {
                        description: newNotification.message,
                        duration: 5000,
                    });

                    // Optional: Play sound (uncomment if desired)
                    // if (typeof Audio !== 'undefined') {
                    //   const audio = new Audio('/notification-sound.mp3');
                    //   audio.play().catch(err => console.error('Sound play error:', err));
                    // }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
                deleteNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
