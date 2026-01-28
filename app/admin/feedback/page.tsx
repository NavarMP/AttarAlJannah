"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, Search, Filter, Plus } from "lucide-react";
import Link from "next/link";

interface FeedbackStats {
    total_feedback: number;
    avg_rating_packing: number;
    avg_rating_delivery: number;
    avg_rating_ordering: number;
    avg_rating_overall: number;
    by_status: Record<string, number>;
    by_category: Record<string, number>;
    by_priority: Record<string, number>;
}

export default function AdminFeedbackPage() {
    const [stats, setStats] = useState<FeedbackStats | null>(null);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/feedback/stats");
            if (!response.ok) throw new Error("Failed to fetch stats");
            const data = await response.json();
            setStats(data.stats);
        } catch (error) {
            console.error("Error fetching stats:", error);
            toast.error("Failed to load feedback statistics");
        }
    };

    const fetchFeedback = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
            if (priorityFilter && priorityFilter !== "all") params.append("priority", priorityFilter);
            if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
            if (searchQuery) params.append("search", searchQuery);
            params.append("limit", "50"); // Keep the limit parameter

            const response = await fetch(`/api/feedback?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to fetch feedback");
            const data = await response.json();
            setFeedback(data.feedback || []); // Changed setFeedbackList to setFeedback
        } catch (error: any) {
            console.error("Error fetching feedback:", error);
            toast.error(error.message || "Failed to load feedback");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, categoryFilter, priorityFilter, searchQuery]);

    useEffect(() => {
        fetchStats();
        fetchFeedback();
    }, [fetchFeedback]); // Dependency array updated to include fetchFeedback

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            new: "bg-blue-500/10 text-blue-500",
            in_progress: "bg-yellow-500/10 text-yellow-500",
            resolved: "bg-green-500/10 text-green-500",
            closed: "bg-gray-500/10 text-gray-500",
        };
        return colors[status] || "bg-gray-500/10 text-gray-500";
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: "bg-gray-500/10 text-gray-500",
            medium: "bg-blue-500/10 text-blue-500",
            high: "bg-orange-500/10 text-orange-500",
            urgent: "bg-red-500/10 text-red-500",
        };
        return colors[priority] || "bg-gray-500/10 text-gray-500";
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-muted-foreground"
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Feedback Management</h1>
                    <p className="text-muted-foreground">Manage and respond to customer feedback</p>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="glass-strong rounded-2xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.total_feedback}</div>
                        </CardContent>
                    </Card>

                    <Card className="glass-strong rounded-2xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Rating</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div className="text-3xl font-bold">{stats.avg_rating_overall?.toFixed(1) || "0.0"}</div>
                                {renderStars(Math.round(stats.avg_rating_overall || 0))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-strong rounded-2xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Packing</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div className="text-2xl font-bold">{stats.avg_rating_packing?.toFixed(1) || "N/A"}</div>
                                {stats.avg_rating_packing && renderStars(Math.round(stats.avg_rating_packing))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-strong rounded-2xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Delivery</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div className="text-2xl font-bold">{stats.avg_rating_delivery?.toFixed(1) || "N/A"}</div>
                                {stats.avg_rating_delivery && renderStars(Math.round(stats.avg_rating_delivery))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-strong rounded-2xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Ordering</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div className="text-2xl font-bold">{stats.avg_rating_ordering?.toFixed(1) || "N/A"}</div>
                                {stats.avg_rating_ordering && renderStars(Math.round(stats.avg_rating_ordering))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card className="glass-strong rounded-2xl">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search feedback..."
                                className="pl-9 rounded-xl"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">All Statuses</option>
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">All Categories</option>
                            <option value="product_review">Product Review</option>
                            <option value="bug">Bug Report</option>
                            <option value="feature_request">Feature Request</option>
                            <option value="compliment">Compliment</option>
                            <option value="complaint">Complaint</option>
                            <option value="other">Other</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Feedback Table */}
            <Card className="glass-strong rounded-2xl">
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : feedback.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No feedback found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground w-[100px]">Date</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Customer</th>
                                        <th className="text-center p-3 text-sm font-medium text-muted-foreground">Overall</th>
                                        <th className="text-center p-3 text-sm font-medium text-muted-foreground">Order</th>
                                        <th className="text-center p-3 text-sm font-medium text-muted-foreground">Delivery</th>
                                        <th className="text-center p-3 text-sm font-medium text-muted-foreground">Packing</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feedback.map((item) => (
                                        <tr
                                            key={item.id}
                                            className={`border-b border-border transition-colors cursor-pointer group 
                                                ${item.status === 'new' ? 'bg-blue-500/5 hover:bg-blue-500/10' : 'hover:bg-accent/50'}
                                            `}
                                            onClick={() => window.location.href = `/admin/feedback/${item.id}`}
                                        >
                                            <td className="p-3 text-sm whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {item.status === 'new' && (
                                                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                                                    )}
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium group-hover:text-primary transition-colors">{item.name}</div>
                                                <div className="text-xs text-muted-foreground">{item.email || "No email"}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center">{renderStars(item.rating_overall)}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center">{item.rating_ordering ? renderStars(item.rating_ordering) : <span className="text-muted-foreground text-xs">-</span>}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center">{item.rating_delivery ? renderStars(item.rating_delivery) : <span className="text-muted-foreground text-xs">-</span>}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center">{item.rating_packing ? renderStars(item.rating_packing) : <span className="text-muted-foreground text-xs">-</span>}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
