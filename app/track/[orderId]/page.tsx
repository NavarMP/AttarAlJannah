"use client";

import { use, useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Package,
    Truck,
    Phone,
    MapPin,
    ExternalLink,
    Search,
    CheckCircle2,
    Circle,
    Clock,
    User,
    Mail as MailIcon,
} from "lucide-react";
import Link from "next/link";

interface TrackingEvent {
    status: string;
    label: string;
    description?: string | null;
    location?: string | null;
    updated_by?: string | null;
    timestamp: string;
    completed: boolean;
}

interface TrackingData {
    order_id: string;
    customer_name: string;
    product: string;
    quantity: number;
    status: string;
    order_status: string;
    delivery_method: string | null;
    timeline: TrackingEvent[];
    volunteer_info: {
        name: string;
        phone: string;
        volunteer_id: string;
    } | null;
    courier_info: {
        tracking_number: string;
        courier_name: string;
        courier_display_name: string | null;
        tracking_url: string | null;
    } | null;
}

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
    order_placed: Package,
    payment_verified: CheckCircle2,
    volunteer_assigned: User,
    method_assigned: Truck,
    picked_up: Package,
    on_the_way: Truck,
    arrived_at_area: MapPin,
    shipped: MailIcon,
    in_transit: Truck,
    out_for_delivery: Truck,
    delivered: CheckCircle2,
    tracking_added: Search,
};

const METHOD_CONFIG: Record<string, { label: string; color: string }> = {
    volunteer: { label: "Volunteer Delivery", color: "bg-blue-100 text-blue-700" },
    post: { label: "India Post", color: "bg-orange-100 text-orange-700" },
    courier: { label: "Courier", color: "bg-purple-100 text-purple-700" },
    pickup: { label: "Self Pickup", color: "bg-green-100 text-green-700" },
};

function TrackingSearchPage() {
    const [orderId, setOrderId] = useState("");
    const [tracking, setTracking] = useState<TrackingData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTracking = useCallback(async (id: string) => {
        if (!id.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/public/track/${id}`);
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Order not found");
                setTracking(null);
                return;
            }
            const data = await res.json();
            setTracking(data.tracking);
        } catch {
            setError("Failed to fetch tracking information");
        } finally {
            setLoading(false);
        }
    }, []);

    return { orderId, setOrderId, tracking, loading, error, fetchTracking };
}

export default function TrackOrderPage({
    params,
}: {
    params: Promise<{ orderId: string }>;
}) {
    const { orderId: routeOrderId } = use(params);
    const { orderId, setOrderId, tracking, loading, error, fetchTracking } =
        TrackingSearchPage();

    useEffect(() => {
        if (routeOrderId) {
            setOrderId(routeOrderId);
            fetchTracking(routeOrderId);
        }
    }, [routeOrderId, setOrderId, fetchTracking]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTracking(orderId);
    };

    const getStatusColor = (status: string) => {
        if (status === "delivered") return "text-green-600";
        if (status === "cant_reach" || status === "returned") return "text-red-500";
        if (status === "cancelled") return "text-gray-500";
        return "text-primary";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4 lg:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2 pt-8">
                    <h1 className="text-3xl font-bold">Track Your Order</h1>
                    <p className="text-muted-foreground">
                        Enter your Order ID to see real-time delivery updates
                    </p>
                </div>

                {/* Search */}
                <Card className="rounded-2xl">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                placeholder="Enter Order ID..."
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                className="rounded-xl"
                            />
                            <Button
                                type="submit"
                                disabled={loading || !orderId.trim()}
                                className="rounded-xl px-6"
                            >
                                {loading ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {error && (
                    <Card className="rounded-2xl border-destructive/50">
                        <CardContent className="pt-6 text-center text-destructive">
                            {error}
                        </CardContent>
                    </Card>
                )}

                {tracking && (
                    <>
                        {/* Order Summary */}
                        <Card className="rounded-2xl">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Order Summary
                                    </CardTitle>
                                    <Badge
                                        className={`${getStatusColor(
                                            tracking.order_status
                                        )} rounded-xl font-medium capitalize`}
                                        variant="outline"
                                    >
                                        {tracking.order_status.replace(/_/g, " ")}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Customer</span>
                                    <span className="font-medium">{tracking.customer_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Product</span>
                                    <span className="font-medium">{tracking.product}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Quantity</span>
                                    <span className="font-medium">
                                        {tracking.quantity} bottle(s)
                                    </span>
                                </div>
                                {tracking.delivery_method && (
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-muted-foreground">
                                            Delivery Method
                                        </span>
                                        <Badge
                                            className={`${METHOD_CONFIG[tracking.delivery_method]?.color ||
                                                "bg-gray-100 text-gray-700"
                                                } rounded-lg text-xs`}
                                        >
                                            {METHOD_CONFIG[tracking.delivery_method]?.label ||
                                                tracking.delivery_method}
                                        </Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Volunteer Info */}
                        {tracking.volunteer_info && (
                            <Card className="rounded-2xl border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-5 w-5 text-blue-600" />
                                        Delivery Volunteer
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">
                                                {tracking.volunteer_info.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {tracking.volunteer_info.phone}
                                            </p>
                                        </div>
                                        <a
                                            href={`tel:${tracking.volunteer_info.phone}`}
                                        >
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-xl"
                                            >
                                                <Phone className="h-4 w-4 mr-1" />
                                                Call
                                            </Button>
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Courier Info */}
                        {tracking.courier_info && (
                            <Card className="rounded-2xl border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-800">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <MailIcon className="h-5 w-5 text-purple-600" />
                                        Courier Tracking
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Courier</span>
                                        <span className="font-medium">
                                            {tracking.courier_info.courier_display_name ||
                                                tracking.courier_info.courier_name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-muted-foreground">
                                            Tracking Number
                                        </span>
                                        <span className="font-mono font-medium text-xs bg-muted px-2 py-1 rounded">
                                            {tracking.courier_info.tracking_number}
                                        </span>
                                    </div>
                                    {tracking.courier_info.tracking_url && (
                                        <a
                                            href={tracking.courier_info.tracking_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button
                                                variant="outline"
                                                className="w-full rounded-xl"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Track on {tracking.courier_info.courier_display_name || "Courier Website"}
                                            </Button>
                                        </a>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Tracking Timeline */}
                        <Card className="rounded-2xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Tracking Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-0">
                                    {tracking.timeline
                                        .slice()
                                        .reverse()
                                        .map((event, index) => {
                                            const isLatest = index === 0;
                                            const IconComponent =
                                                STATUS_ICONS[event.status] || Circle;
                                            return (
                                                <div
                                                    key={index}
                                                    className="flex gap-4 pb-6 last:pb-0"
                                                >
                                                    {/* Icon + Line */}
                                                    <div className="flex flex-col items-center">
                                                        <div
                                                            className={`flex items-center justify-center w-8 h-8 rounded-full ${isLatest
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "bg-muted text-muted-foreground"
                                                                }`}
                                                        >
                                                            <IconComponent className="h-4 w-4" />
                                                        </div>
                                                        {index <
                                                            tracking.timeline.length - 1 && (
                                                                <div className="w-0.5 flex-1 bg-border mt-1" />
                                                            )}
                                                    </div>
                                                    {/* Content */}
                                                    <div className="flex-1 pb-2">
                                                        <p
                                                            className={`font-medium text-sm ${isLatest
                                                                    ? "text-foreground"
                                                                    : "text-muted-foreground"
                                                                }`}
                                                        >
                                                            {event.label}
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
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {new Date(
                                                                event.timestamp
                                                            ).toLocaleString("en-IN", {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Back link */}
                        <div className="text-center pb-8">
                            <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                                ← Back to Attar Al Jannah
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
