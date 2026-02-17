"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
    DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Star, Search, Trash2, Eye, MoreVertical, Download, Flag, CircleDot
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionBar, BulkAction } from "@/components/admin/bulk-action-bar";

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

const FEEDBACK_STATUSES = [
    { label: "New", value: "new" },
    { label: "In Progress", value: "in_progress" },
    { label: "Resolved", value: "resolved" },
    { label: "Closed", value: "closed" },
];

const FEEDBACK_PRIORITIES = [
    { label: "Low", value: "low" },
    { label: "Medium", value: "medium" },
    { label: "High", value: "high" },
    { label: "Urgent", value: "urgent" },
];

export default function AdminFeedbackPage() {
    const [stats, setStats] = useState<FeedbackStats | null>(null);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

    // Delete state
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk state
    const [selectedFeedback, setSelectedFeedback] = useState<Set<string>>(new Set());
    const [bulkProcessing, setBulkProcessing] = useState(false);

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
            params.append("limit", "50");

            const response = await fetch(`/api/feedback?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to fetch feedback");
            const data = await response.json();
            setFeedback(data.feedback || []);
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
        setSelectedFeedback(new Set());
    }, [fetchFeedback]);

    // ==== Individual actions ====

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            setIsDeleting(true);
            const response = await fetch(`/api/feedback/${deleteId}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete");
            toast.success("Feedback deleted");
            setDeleteId(null);
            fetchFeedback();
            fetchStats();
        } catch {
            toast.error("Failed to delete feedback");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdateSingle = async (feedbackId: string, updates: { status?: string; priority?: string }) => {
        try {
            const response = await fetch("/api/feedback/bulk-update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedbackIds: [feedbackId], ...updates }),
            });
            if (response.ok) {
                toast.success("Feedback updated");
                fetchFeedback();
                fetchStats();
            } else {
                toast.error("Failed to update");
            }
        } catch {
            toast.error("Failed to update");
        }
    };

    const handleExportCSV = async (selectedIds?: string[]) => {
        try {
            const params = new URLSearchParams({ type: "feedback" });
            if (selectedIds && selectedIds.length > 0) {
                params.set("ids", selectedIds.join(","));
            }
            const response = await fetch(`/api/admin/export?${params}`);
            if (!response.ok) { toast.error("Failed to export"); return; }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `feedback_export_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Feedback exported successfully");
        } catch {
            toast.error("Failed to export");
        }
    };

    // ==== Selection helpers ====

    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedFeedback);
        if (newSelection.has(id)) newSelection.delete(id); else newSelection.add(id);
        setSelectedFeedback(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedFeedback.size === feedback.length) {
            setSelectedFeedback(new Set());
        } else {
            setSelectedFeedback(new Set(feedback.map(f => f.id)));
        }
    };

    // ==== Bulk actions config ====

    const bulkActions: BulkAction[] = [
        {
            label: "Change Status",
            icon: <CircleDot className="h-4 w-4" />,
            options: FEEDBACK_STATUSES.map(s => ({ label: s.label, value: s.value })),
            onExecute: async (_ids, value) => {
                setBulkProcessing(true);
                try {
                    const response = await fetch("/api/feedback/bulk-update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ feedbackIds: Array.from(selectedFeedback), status: value }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                        toast.success(data.message || `Updated ${selectedFeedback.size} feedback(s)`);
                        setSelectedFeedback(new Set());
                        fetchFeedback();
                        fetchStats();
                    } else {
                        toast.error(data.error || "Failed to update");
                    }
                } catch { toast.error("An error occurred"); }
                finally { setBulkProcessing(false); }
            },
        },
        {
            label: "Change Priority",
            icon: <Flag className="h-4 w-4" />,
            options: FEEDBACK_PRIORITIES.map(p => ({ label: p.label, value: p.value })),
            onExecute: async (_ids, value) => {
                setBulkProcessing(true);
                try {
                    const response = await fetch("/api/feedback/bulk-update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ feedbackIds: Array.from(selectedFeedback), priority: value }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                        toast.success(data.message || `Updated ${selectedFeedback.size} feedback(s)`);
                        setSelectedFeedback(new Set());
                        fetchFeedback();
                        fetchStats();
                    } else {
                        toast.error(data.error || "Failed to update");
                    }
                } catch { toast.error("An error occurred"); }
                finally { setBulkProcessing(false); }
            },
        },
        {
            label: "Export CSV",
            icon: <Download className="h-4 w-4" />,
            variant: "outline",
            onExecute: async () => {
                await handleExportCSV(Array.from(selectedFeedback));
            },
        },
        {
            label: "Delete",
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive",
            requireConfirm: true,
            confirmTitle: "Bulk Delete Feedback",
            confirmDescription: `Are you sure you want to permanently delete ${selectedFeedback.size} feedback item(s)? This cannot be undone.`,
            onExecute: async () => {
                setBulkProcessing(true);
                try {
                    const response = await fetch("/api/feedback/bulk-delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ feedbackIds: Array.from(selectedFeedback) }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                        toast.success(data.message || `Deleted ${selectedFeedback.size} feedback(s)`);
                        setSelectedFeedback(new Set());
                        fetchFeedback();
                        fetchStats();
                    } else {
                        toast.error(data.error || "Failed to delete");
                    }
                } catch { toast.error("An error occurred"); }
                finally { setBulkProcessing(false); }
            },
        },
    ];

    // ==== UI helpers ====

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

    const renderStars = (rating: number) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-muted-foreground"}`}
                />
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Feedback Management</h1>
                    <p className="text-muted-foreground">Manage and respond to customer feedback</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => handleExportCSV()}>
                    <Download className="h-4 w-4" />
                    Export All
                </Button>
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
                            {FEEDBACK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                            {FEEDBACK_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
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
                                        <th className="text-left p-3 w-10">
                                            <Checkbox
                                                checked={feedback.length > 0 && selectedFeedback.size === feedback.length}
                                                onCheckedChange={toggleSelectAll}
                                                aria-label="Select all feedback"
                                            />
                                        </th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground w-[100px]">Date</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Customer</th>
                                        <th className="text-center p-3 text-sm font-medium text-muted-foreground">Overall</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Priority</th>
                                        <th className="text-center p-3 text-sm font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feedback.map((item) => (
                                        <tr
                                            key={item.id}
                                            className={`border-b border-border transition-colors cursor-pointer group
                                                ${selectedFeedback.has(item.id) ? 'bg-primary/5' : ''}
                                                ${item.status === 'new' ? 'bg-blue-500/5 hover:bg-blue-500/10' : 'hover:bg-accent/50'}
                                            `}
                                            onClick={() => window.location.href = `/admin/feedback/${item.id}`}
                                        >
                                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedFeedback.has(item.id)}
                                                    onCheckedChange={() => toggleSelection(item.id)}
                                                    aria-label={`Select feedback from ${item.name}`}
                                                />
                                            </td>
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
                                                <div className="text-xs text-muted-foreground">{item.name === "Anonymous" ? <span className="italic">Hidden</span> : (item.email || "No email")}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center">{renderStars(item.rating_overall)}</div>
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                    {item.status === "in_progress" ? "In Progress" : item.status}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {item.priority && (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(item.priority)}`}>
                                                        {item.priority}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52">
                                                        <DropdownMenuItem onClick={() => window.location.href = `/admin/feedback/${item.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger>
                                                                <CircleDot className="mr-2 h-4 w-4" />Change Status
                                                            </DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent>
                                                                {FEEDBACK_STATUSES.map(s => (
                                                                    <DropdownMenuItem
                                                                        key={s.value}
                                                                        onClick={() => handleUpdateSingle(item.id, { status: s.value })}
                                                                        disabled={item.status === s.value}
                                                                    >
                                                                        {s.label}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger>
                                                                <Flag className="mr-2 h-4 w-4" />Change Priority
                                                            </DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent>
                                                                {FEEDBACK_PRIORITIES.map(p => (
                                                                    <DropdownMenuItem
                                                                        key={p.value}
                                                                        onClick={() => handleUpdateSingle(item.id, { priority: p.value })}
                                                                        disabled={item.priority === p.value}
                                                                    >
                                                                        {p.label}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteId(item.id)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete this feedback? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Action Bar */}
            <BulkActionBar
                selectedCount={selectedFeedback.size}
                onClearSelection={() => setSelectedFeedback(new Set())}
                actions={bulkActions}
                isProcessing={bulkProcessing}
            />
        </div>
    );
}
