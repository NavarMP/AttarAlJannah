"use client";

import { useNotifications } from "@/lib/contexts/notification-context";
import { Package, CheckCircle, Trophy, Bell, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    action_url?: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationItemProps {
    notification: Notification;
    onClick?: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
    const { markAsRead } = useNotifications();
    const router = useRouter();

    const getIcon = () => {
        switch (notification.type) {
            case "order_update":
                return <Package className="h-5 w-5 text-blue-500" />;
            case "payment_verified":
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "challenge_milestone":
                return <Trophy className="h-5 w-5 text-yellow-500" />;
            case "admin_action":
                return <Bell className="h-5 w-5 text-purple-500" />;
            case "system_announcement":
                return <Info className="h-5 w-5 text-primary" />;
            default:
                return <Bell className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const handleClick = async () => {
        // Mark as read if unread
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        // Navigate if action URL exists
        if (notification.action_url) {
            router.push(notification.action_url);
        }

        // Close dropdown
        onClick?.();
    };

    const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

    return (
        <div
            onClick={handleClick}
            className={`flex items-start gap-3 p-4 cursor-pointer transition-all hover:bg-accent/50 ${!notification.is_read ? "bg-primary/5" : ""
                }`}
        >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-sm font-medium ${!notification.is_read ? "font-semibold" : ""}`}>
                        {notification.title}
                    </h4>
                    {!notification.is_read && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
                    )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{timeAgo}</p>
            </div>
        </div>
    );
}

// Helper function (you may need to install date-fns or use a simpler approach)
// npm install date-fns
// Or use this simple alternative if you don't want the dependency:

/*
function formatDistanceToNow(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}
*/
