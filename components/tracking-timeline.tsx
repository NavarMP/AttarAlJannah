"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Package,
    Truck,
    MapPin,
    CheckCircle2,
    Circle,
    User,
    Mail,
    Search,
} from "lucide-react";

interface TrackingEvent {
    status: string;
    title: string;
    description?: string | null;
    location?: string | null;
    updated_by?: string | null;
    created_at: string;
}

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
    order_placed: Package,
    payment_verified: CheckCircle2,
    volunteer_assigned: User,
    method_assigned: Truck,
    picked_up: Package,
    on_the_way: Truck,
    arrived_at_area: MapPin,
    shipped: Mail,
    in_transit: Truck,
    out_for_delivery: Truck,
    delivered: CheckCircle2,
    tracking_added: Search,
    cant_reach: Circle,
};

export function TrackingTimeline({ orderId }: { orderId: string }) {
    const [events, setEvents] = useState<TrackingEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch(`/api/public/track/${orderId}`);
            if (res.ok) {
                const data = await res.json();
                setEvents(
                    (data.tracking?.timeline || []).map(
                        (e: { status: string; label: string; description?: string; location?: string; updated_by?: string; timestamp: string }) => ({
                            status: e.status,
                            title: e.label,
                            description: e.description,
                            location: e.location,
                            updated_by: e.updated_by,
                            created_at: e.timestamp,
                        })
                    )
                );
            }
        } catch {
            // non-blocking
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-6">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-4">
                No tracking info available yet.
            </p>
        );
    }

    return (
        <div className="space-y-0">
            {events
                .slice()
                .reverse()
                .map((event, index) => {
                    const isLatest = index === 0;
                    const IconComponent = STATUS_ICONS[event.status] || Circle;
                    return (
                        <div key={index} className="flex gap-3 pb-4 last:pb-0">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 ${isLatest
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                        }`}
                                >
                                    <IconComponent className="h-3.5 w-3.5" />
                                </div>
                                {index < events.length - 1 && (
                                    <div className="w-0.5 flex-1 bg-border mt-1" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pb-1">
                                <p
                                    className={`font-medium text-sm ${isLatest
                                            ? "text-foreground"
                                            : "text-muted-foreground"
                                        }`}
                                >
                                    {event.title}
                                </p>
                                {event.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {event.description}
                                    </p>
                                )}
                                {event.location && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <MapPin className="h-3 w-3" />
                                        {event.location}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    {new Date(event.created_at).toLocaleString(
                                        "en-IN",
                                        {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        }
                                    )}
                                </p>
                            </div>
                        </div>
                    );
                })}
        </div>
    );
}
