"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, Clock, Users, Award, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Analytics {
    total_scheduled: number;
    completed_deliveries: number;
    in_transit: number;
    rescheduled: number;
    cancelled: number;
    avg_delivery_time_hours: number;
    pending_requests: number;
    active_deliveries: number;
    period_days: number;
}

interface TopVolunteer {
    volunteer: {
        name: string;
        volunteer_id: string;
    };
    count: number;
}

export default function DeliveryAnalyticsPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [topVolunteers, setTopVolunteers] = useState<TopVolunteer[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("30");



    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/delivery-analytics?period=${period}`);
            const data = await response.json();
            setAnalytics(data.analytics);
            setTopVolunteers(data.top_volunteers || []);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading analytics...</p>
            </div>
        );
    }

    const successRate = analytics && analytics.total_scheduled > 0
        ? Math.round((analytics.completed_deliveries / analytics.total_scheduled) * 100)
        : 0;

    return (
        <main className="min-h-screen p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard">
                            <Button variant="outline" className="rounded-2xl">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Delivery Analytics</h1>
                            <p className="text-muted-foreground">Monitor delivery performance and trends</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPeriod("7")}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${period === "7"
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                        >
                            7 Days
                        </button>
                        <button
                            onClick={() => setPeriod("30")}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${period === "30"
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                        >
                            30 Days
                        </button>
                        <button
                            onClick={() => setPeriod("90")}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${period === "90"
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                        >
                            90 Days
                        </button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="rounded-3xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Pending Requests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{analytics?.pending_requests || 0}</p>
                            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Active Deliveries
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-blue-600">{analytics?.active_deliveries || 0}</p>
                            <p className="text-xs text-muted-foreground mt-1">Currently assigned</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Completed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-green-600">{analytics?.completed_deliveries || 0}</p>
                            <p className="text-xs text-muted-foreground mt-1">Last {period} days</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Avg. Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {analytics?.avg_delivery_time_hours
                                    ? `${analytics.avg_delivery_time_hours.toFixed(1)}h`
                                    : "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Delivery duration</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Delivery Status Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="rounded-3xl">
                        <CardHeader>
                            <CardTitle>Delivery Status Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Completed</span>
                                <Badge className="bg-green-100 text-green-700">
                                    {analytics?.completed_deliveries || 0}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">In Transit</span>
                                <Badge className="bg-blue-100 text-blue-700">
                                    {analytics?.in_transit || 0}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Rescheduled</span>
                                <Badge className="bg-yellow-100 text-yellow-700">
                                    {analytics?.rescheduled || 0}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Cancelled</span>
                                <Badge className="bg-red-100 text-red-700">
                                    {analytics?.cancelled || 0}
                                </Badge>
                            </div>
                            <div className="pt-3 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Success Rate</span>
                                    <span className="text-xl font-bold text-green-600">{successRate}%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Delivery Volunteers */}
                    <Card className="rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-yellow-500" />
                                Top Delivery Volunteers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topVolunteers.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No deliveries yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {topVolunteers.map((item, index) => (
                                        <div
                                            key={item.volunteer.volunteer_id}
                                            className="flex items-center justify-between p-3 rounded-xl bg-accent/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-bold text-muted-foreground">
                                                    #{index + 1}
                                                </span>
                                                <div>
                                                    <p className="font-medium">{item.volunteer.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.volunteer.volunteer_id}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-primary/10 text-primary">
                                                {item.count} deliveries
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
