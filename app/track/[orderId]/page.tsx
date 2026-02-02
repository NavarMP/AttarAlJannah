"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle2, User, Phone, MapPin, Search } from "lucide-react";
import { use } from "react";

interface TrackingTimeline {
    status: string;
    label: string;
    timestamp: string | null;
    completed: boolean;
}

interface DeliveryInfo {
    volunteer_name: string;
    volunteer_phone: string;
    volunteer_id: string;
}

interface ScheduleInfo {
    scheduled_date: string;
    time_slot: string;
    status: string;
}

interface TrackingInfo {
    order_id: string;
    customer_name: string;
    product: string;
    quantity: number;
    status: string;
    timeline: TrackingTimeline[];
    delivery_info: DeliveryInfo | null;
    schedule_info: ScheduleInfo | null;
}

export default function TrackOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
    const resolvedParams = use(params);
    const [tracking, setTracking] = useState<TrackingInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchId, setSearchId] = useState(resolvedParams.orderId || "");

    useEffect(() => {
        if (resolvedParams.orderId) {
            fetchTracking(resolvedParams.orderId);
        }
    }, [resolvedParams.orderId]);

    const fetchTracking = async (orderId: string) => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/public/track/${orderId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    setError("Order not found. Please check the Order ID.");
                } else {
                    setError("Failed to load tracking information.");
                }
                setTracking(null);
                return;
            }
            const data = await response.json();
            setTracking(data.tracking);
        } catch (err) {
            setError("Failed to load tracking information.");
            setTracking(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchId.trim()) {
            window.location.href = `/track/${searchId.trim()}`;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "delivered":
                return "bg-green-100 text-green-700";
            case "ordered":
                return "bg-blue-100 text-blue-700";
            case "cant_reach":
                return "bg-yellow-100 text-yellow-700";
            case "cancelled":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getTimeSlotLabel = (slot: string) => {
        switch (slot) {
            case "morning":
                return "Morning (9 AM - 12 PM)";
            case "afternoon":
                return "Afternoon (12 PM - 4 PM)";
            case "evening":
                return "Evening (4 PM - 7 PM)";
            default:
                return "Flexible";
        }
    };

    return (
        <main className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-background to-accent/20">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold">Track Your Order</h1>
                    <p className="text-muted-foreground">Enter your Order ID to view delivery status</p>
                </div>

                {/* Search */}
                <Card className="rounded-3xl">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                placeholder="Enter Order ID"
                                className="rounded-2xl"
                            />
                            <Button type="submit" className="rounded-2xl">
                                <Search className="w-4 h-4 mr-2" />
                                Track
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Loading State */}
                {loading && (
                    <Card className="rounded-3xl">
                        <CardContent className="p-12 text-center">
                            <p className="text-muted-foreground">Loading tracking information...</p>
                        </CardContent>
                    </Card>
                )}

                {/* Error State */}
                {error && !loading && (
                    <Card className="rounded-3xl border-red-200">
                        <CardContent className="p-8 text-center">
                            <Package className="w-16 h-16 mx-auto mb-4 text-red-300" />
                            <p className="text-lg text-red-600 font-medium">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Tracking Information */}
                {tracking && !loading && (
                    <div className="space-y-6">
                        {/* Order Details */}
                        <Card className="rounded-3xl">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Order Details</span>
                                    <Badge className={getStatusColor(tracking.status)}>
                                        {tracking.status.replace("_", " ").toUpperCase()}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Order ID</span>
                                    <span className="font-mono text-sm">{tracking.order_id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Customer</span>
                                    <span className="font-medium">{tracking.customer_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Product</span>
                                    <span className="font-medium">{tracking.product}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Quantity</span>
                                    <span className="font-medium">{tracking.quantity}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timeline */}
                        <Card className="rounded-3xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Order Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {tracking.timeline.map((item, index) => (
                                        <div key={index} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${item.completed
                                                            ? "bg-green-500 text-white"
                                                            : "bg-gray-200 text-gray-400"
                                                        }`}
                                                >
                                                    {item.completed ? (
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    ) : (
                                                        <div className="w-2 h-2 rounded-full bg-current" />
                                                    )}
                                                </div>
                                                {index < tracking.timeline.length - 1 && (
                                                    <div className={`w-0.5 h-12 ${item.completed ? "bg-green-500" : "bg-gray-200"}`} />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-8">
                                                <p className={`font-medium ${item.completed ? "text-foreground" : "text-muted-foreground"}`}>
                                                    {item.label}
                                                </p>
                                                {item.timestamp && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(item.timestamp).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Delivery Information */}
                        {tracking.delivery_info && (
                            <Card className="rounded-3xl border-primary/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5 text-primary" />
                                        Delivery Volunteer
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">{tracking.delivery_info.volunteer_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <a
                                            href={`tel:${tracking.delivery_info.volunteer_phone}`}
                                            className="text-primary hover:underline"
                                        >
                                            {tracking.delivery_info.volunteer_phone}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{tracking.delivery_info.volunteer_id}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Schedule Information */}
                        {tracking.schedule_info && (
                            <Card className="rounded-3xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        Delivery Schedule
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Scheduled Date</span>
                                        <span className="font-medium">
                                            {new Date(tracking.schedule_info.scheduled_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Time Slot</span>
                                        <span className="font-medium">
                                            {getTimeSlotLabel(tracking.schedule_info.time_slot)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status</span>
                                        <Badge className={getStatusColor(tracking.schedule_info.status)}>
                                            {tracking.schedule_info.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
