"use client";

import { useNotifications } from "@/lib/contexts/notification-context";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "./notification-item";
import { BellOff, Check } from "lucide-react";
import Link from "next/link";

interface NotificationDropdownProps {
    onClose?: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
    const { notifications, unreadCount, loading, markAllAsRead } = useNotifications();

    // Show only the 5 most recent notifications
    const recentNotifications = notifications.slice(0, 5);

    const handleMarkAllRead = async () => {
        await markAllAsRead();
    };

    return (
        <div className="flex flex-col max-h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-lg">Notifications</h3>
                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllRead}
                        className="text-xs rounded-xl"
                    >
                        <Check className="h-3 w-3 mr-1" />
                        Mark all read
                    </Button>
                )}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : notifications.length === 0 ? ( // Check total notifications, not just recent
                    <div className="text-center py-8 px-4">
                        <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
                    </div>
                ) : recentNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <BellOff className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                        <p className="text-sm text-muted-foreground">No recent notifications</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Check &quot;View all notifications&quot; for older ones.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {recentNotifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onClick={onClose}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {
                notifications.length > 5 && (
                    <div className="p-3 border-t border-border">
                        <Link href="/admin/notifications" onClick={onClose}>
                            <Button variant="outline" className="w-full rounded-xl" size="sm">
                                View all notifications
                            </Button>
                        </Link>
                    </div>
                )
            }
        </div >
    );
}
