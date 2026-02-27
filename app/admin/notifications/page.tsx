"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    Loader2,
    Send,
    Search,
    Filter,
    Clock,
    Star,
    Users,
    MessageSquare,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Info,
    Sparkles,
    Calendar,
    Repeat,
    X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface Template {
    id: string;
    category: string;
    name: string;
    title_template: string;
    message_template: string;
    action_url_template?: string;
    priority: string;
    variables: string[];
    is_system: boolean;
}

interface NotificationHistoryItem {
    id: string;
    title: string;
    message: string;
    user_role: string;
    category: string;
    priority: string;
    created_at: string;
    is_read: boolean;
    delivery_status: string;
}

interface ScheduledNotification {
    id: string;
    title: string;
    message: string;
    priority: string;
    scheduled_for: string;
    recurrence: string;
    status: string;
    target_filters: any;
}

export default function EnhancedNotificationComposerPage() {
    const [activeTab, setActiveTab] = useState("compose");

    // Compose Tab State
    const [targetType, setTargetType] = useState<"all" | "role" | "individual" | "filtered">("all");
    const [targetRole, setTargetRole] = useState<string>("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    // Template State
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

    // Message Content
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [actionUrl, setActionUrl] = useState("");
    const [priority, setPriority] = useState("medium");
    const [sending, setSending] = useState(false);

    // Filter State
    const [filterZone, setFilterZone] = useState("");
    const [filterOrderStatus, setFilterOrderStatus] = useState("all");
    const [recipientCount, setRecipientCount] = useState(0);
    const [loadingCount, setLoadingCount] = useState(false);

    // History Tab State
    const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
    const [historyStats, setHistoryStats] = useState<any>(null);
    const [historyFilter, setHistoryFilter] = useState({
        category: "all",
        priority: "all",
        days: 30,
    });
    const [loadingHistory, setLoadingHistory] = useState(false);

    // User Selection State
    const [searchQuery, setSearchQuery] = useState("");
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Load templates on mount
    useEffect(() => {
        loadTemplates();
    }, []);

    // Load history when tab changes
    useEffect(() => {
        if (activeTab === "history") {
            loadHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, historyFilter]);

    // Update recipient count when filters change
    useEffect(() => {
        if (targetType === "filtered") {
            updateRecipientCount();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterZone, filterOrderStatus, targetType]);

    async function loadTemplates() {
        try {
            const res = await fetch("/api/admin/notification-templates");
            if (!res.ok) throw new Error("Failed to load templates");
            const data = await res.json();
            setTemplates(data.templates || []);
        } catch (error) {
            console.error("Error loading templates:", error);
            toast.error("Failed to load templates");
        }
    }

    async function updateRecipientCount() {
        setLoadingCount(true);
        try {
            const params = new URLSearchParams();
            if (filterZone) params.append("zone", filterZone);
            if (filterOrderStatus && filterOrderStatus !== "all") params.append("orderStatus", filterOrderStatus);

            const res = await fetch(`/api/admin/notification-recipients?${params}`);
            if (!res.ok) throw new Error("Failed to get count");
            const data = await res.json();
            setRecipientCount(data.count || 0);
        } catch (error) {
            console.error("Error getting recipient count:", error);
        } finally {
            setLoadingCount(false);
        }
    }

    async function searchUsers() {
        if (!searchQuery || searchQuery.length < 2) {
            setAvailableUsers([]);
            return;
        }

        setLoadingUsers(true);
        try {
            const endpoint = targetRole === "customer"
                ? `/api/admin/customers?search=${searchQuery}`
                : `/api/admin/volunteers?search=${searchQuery}`;

            const res = await fetch(endpoint);
            if (!res.ok) throw new Error("Failed to search users");
            const data = await res.json();

            const users = targetRole === "customer" ? data.customers : data.volunteers;
            setAvailableUsers(users || []);
        } catch (error) {
            console.error("Error searching users:", error);
            toast.error("Failed to search users");
        } finally {
            setLoadingUsers(false);
        }
    }

    function applyTemplate(template: Template) {
        setSelectedTemplate(template);
        setTitle(template.title_template);
        setMessage(template.message_template);
        setActionUrl(template.action_url_template || "");
        setPriority(template.priority);

        // Initialize variables
        const vars: Record<string, string> = {};
        template.variables.forEach((v: string) => {
            vars[v] = "";
        });
        setTemplateVariables(vars);
    }

    function replaceVariables(text: string): string {
        let result = text;
        Object.entries(templateVariables).forEach(([key, value]) => {
            result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });
        return result;
    }

    async function handleSend() {
        if (!title || !message) {
            toast.error("Title and message are required");
            return;
        }

        if (targetType === "role" && !targetRole) {
            toast.error("Please select a role");
            return;
        }

        if (targetType === "individual" && selectedUsers.length === 0) {
            toast.error("Please select at least one user");
            return;
        }

        setSending(true);

        try {
            const finalTitle = selectedTemplate ? replaceVariables(title) : title;
            const finalMessage = selectedTemplate ? replaceVariables(message) : message;

            const res = await fetch("/api/admin/send-notification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: finalTitle,
                    message: finalMessage,
                    actionUrl: actionUrl || undefined,
                    priority,
                    targetType,
                    targetRole: targetType === "role" ? targetRole : undefined,
                    targetUserIds: targetType === "individual" ? selectedUsers : undefined,
                    filters: targetType === "filtered" ? {
                        zone: filterZone || undefined,
                        orderStatus: filterOrderStatus || undefined,
                    } : undefined,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to send notification");
            }

            const data = await res.json();
            toast.success(`Notification sent to ${data.count || 0} recipients!`);

            // Reset form
            setTitle("");
            setMessage("");
            setActionUrl("");
            setPriority("medium");
            setSelectedTemplate(null);
            setTemplateVariables({});
            setSelectedUsers([]);
            setFilterZone("");
            setFilterOrderStatus("");
        } catch (error: any) {
            console.error("Error sending notification:", error);
            toast.error(error.message || "Failed to send notification");
        } finally {
            setSending(false);
        }
    }

    async function loadHistory() {
        setLoadingHistory(true);
        try {
            const params = new URLSearchParams();
            if (historyFilter.category && historyFilter.category !== "all") params.append("category", historyFilter.category);
            if (historyFilter.priority && historyFilter.priority !== "all") params.append("priority", historyFilter.priority);
            params.append("days", historyFilter.days.toString());

            const res = await fetch(`/api/admin/notifications/history?${params}`);
            if (!res.ok) throw new Error("Failed to load history");
            const data = await res.json();

            setHistory(data.notifications || []);
            setHistoryStats(data.stats || null);
        } catch (error) {
            console.error("Error loading history:", error);
            toast.error("Failed to load notification history");
        } finally {
            setLoadingHistory(false);
        }
    }

    async function handleResend(notificationId: string) {
        try {
            const res = await fetch("/api/admin/notifications/history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId }),
            });

            if (!res.ok) throw new Error("Failed to resend");
            toast.success("Notification resent successfully!");
        } catch (error) {
            console.error("Error resending:", error);
            toast.error("Failed to resend notification");
        }
    }

    function getPriorityIcon(priority: string) {
        switch (priority) {
            case "critical": return <AlertTriangle className="h-4 w-4 text-red-600" />;
            case "high": return <Star className="h-4 w-4 text-orange-600" />;
            case "medium": return <Info className="h-4 w-4 text-blue-600" />;
            default: return <MessageSquare className="h-4 w-4 text-gray-600" />;
        }
    }

    function getPriorityColor(priority: string): string {
        switch (priority) {
            case "critical": return "destructive";
            case "high": return "default";
            case "medium": return "secondary";
            default: return "outline";
        }
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-600 to-pink-600 bg-clip-text text-transparent">
                    Enhanced Notifications
                </h1>
                <p className="text-muted-foreground mt-2">
                    Send targeted notifications with templates, filters, and priority routing
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="compose" className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Compose
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        History
                    </TabsTrigger>
                </TabsList>

                {/* COMPOSE TAB */}
                <TabsContent value="compose" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Templates */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-purple-600" />
                                    Quick Templates
                                </CardTitle>
                                <CardDescription>Click to apply a template</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        onClick={() => applyTemplate(template)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-purple-500 hover:shadow-md ${selectedTemplate?.id === template.id ? "border-purple-500 bg-purple-50" : ""
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <p className="font-medium text-sm">{template.name}</p>
                                            <Badge variant={getPriorityColor(template.priority) as any} className="text-xs">
                                                {template.priority}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {template.title_template}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline" className="text-xs">
                                                {template.category}
                                            </Badge>
                                            {template.is_system && (
                                                <Badge variant="secondary" className="text-xs">
                                                    System
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Middle Column - Compose Form */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Compose Notification</CardTitle>
                                <CardDescription>Create and send notifications to your users</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Target Selection */}
                                <div className="space-y-4">
                                    <Label>Target Audience</Label>
                                    <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    All Users
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="role">
                                                <div className="flex items-center gap-2">
                                                    <Filter className="h-4 w-4" />
                                                    By Role
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="individual">
                                                <div className="flex items-center gap-2">
                                                    <Search className="h-4 w-4" />
                                                    Individual Users
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="filtered">
                                                <div className="flex items-center gap-2">
                                                    <Filter className="h-4 w-4" />
                                                    Advanced Filters
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Role Selection */}
                                    {targetType === "role" && (
                                        <Select value={targetRole} onValueChange={setTargetRole}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="customer">Customers</SelectItem>
                                                <SelectItem value="volunteer">Volunteers</SelectItem>
                                                <SelectItem value="admin">Admins</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {/* Individual Selection */}
                                    {targetType === "individual" && (
                                        <>
                                            <Select value={targetRole} onValueChange={setTargetRole}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select user type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="customer">Customers</SelectItem>
                                                    <SelectItem value="volunteer">Volunteers</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {targetRole && (
                                                <>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder={`Search ${targetRole}s...`}
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                        />
                                                        <Button onClick={searchUsers} disabled={loadingUsers}>
                                                            <Search className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    {availableUsers.length > 0 && (
                                                        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                                                            {availableUsers.map((user) => (
                                                                <div key={user.id} className="flex items-center gap-2">
                                                                    <Checkbox
                                                                        checked={selectedUsers.includes(user.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            if (checked) {
                                                                                setSelectedUsers([...selectedUsers, user.id]);
                                                                            } else {
                                                                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                                                            }
                                                                        }}
                                                                    />
                                                                    <span className="text-sm">
                                                                        {user.name} ({user.phone || user.volunteer_id})
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {selectedUsers.length > 0 && (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                            {selectedUsers.length} user(s) selected
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    )}

                                    {/* Advanced Filters */}
                                    {targetType === "filtered" && (
                                        <div className="space-y-3 p-4 border rounded-lg">
                                            <div>
                                                <Label>Order Status</Label>
                                                <Select value={filterOrderStatus} onValueChange={setFilterOrderStatus}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Any status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Any</SelectItem>
                                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                                        <SelectItem value="delivered">Delivered</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm">
                                                {loadingCount ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Users className="h-4 w-4" />
                                                )}
                                                <span className="font-medium">{recipientCount} recipients</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Template Variables */}
                                {selectedTemplate && Object.keys(templateVariables).length > 0 && (
                                    <div className="space-y-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                        <Label className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-purple-600" />
                                            Template Variables
                                        </Label>
                                        {Object.keys(templateVariables).map((varName) => (
                                            <div key={varName}>
                                                <Label className="text-sm">{varName}</Label>
                                                <Input
                                                    placeholder={`Enter ${varName}...`}
                                                    value={templateVariables[varName]}
                                                    onChange={(e) =>
                                                        setTemplateVariables({
                                                            ...templateVariables,
                                                            [varName]: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Message Content */}
                                <div className="space-y-4">
                                    <div>
                                        <Label>Priority Level</Label>
                                        <Select value={priority} onValueChange={setPriority}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="critical">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                                        Critical
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="high">
                                                    <div className="flex items-center gap-2">
                                                        <Star className="h-4 w-4 text-orange-600" />
                                                        High
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="medium">
                                                    <div className="flex items-center gap-2">
                                                        <Info className="h-4 w-4 text-blue-600" />
                                                        Medium
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="low">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="h-4 w-4 text-gray-600" />
                                                        Low
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Title</Label>
                                        <Input
                                            placeholder="Notification title..."
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Message</Label>
                                        <Textarea
                                            placeholder="Notification message..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={5}
                                        />
                                    </div>

                                    <div>
                                        <Label>Action URL (optional)</Label>
                                        <Input
                                            placeholder="/dashboard"
                                            value={actionUrl}
                                            onChange={(e) => setActionUrl(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSend}
                                    disabled={sending || !title || !message}
                                    className="w-full"
                                    size="lg"
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Notification
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* HISTORY TAB */}
                <TabsContent value="history" className="space-y-6">
                    {/* Stats Cards */}
                    {historyStats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">{historyStats.total}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-green-600">{historyStats.sent}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium">Read</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-blue-600">{historyStats.read}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">
                                        {historyStats.total > 0
                                            ? Math.round((historyStats.read / historyStats.total) * 100)
                                            : 0}%
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Category</Label>
                                    <Select
                                        value={historyFilter.category}
                                        onValueChange={(v) => setHistoryFilter({ ...historyFilter, category: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="order">Order</SelectItem>
                                            <SelectItem value="delivery">Delivery</SelectItem>
                                            <SelectItem value="system">System</SelectItem>
                                            <SelectItem value="manual">Manual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Priority</Label>
                                    <Select
                                        value={historyFilter.priority}
                                        onValueChange={(v) => setHistoryFilter({ ...historyFilter, priority: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All priorities" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Time Period</Label>
                                    <Select
                                        value={historyFilter.days.toString()}
                                        onValueChange={(v) => setHistoryFilter({ ...historyFilter, days: parseInt(v) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="7">Last 7 days</SelectItem>
                                            <SelectItem value="30">Last 30 days</SelectItem>
                                            <SelectItem value="90">Last 90 days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* History List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification History</CardTitle>
                            <CardDescription>View and manage all sent notifications</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingHistory ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No notifications found
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {getPriorityIcon(notif.priority)}
                                                    <h3 className="font-semibold">{notif.title}</h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={getPriorityColor(notif.priority) as any}>
                                                        {notif.priority}
                                                    </Badge>
                                                    <Badge variant="outline">{notif.category}</Badge>
                                                </div>
                                            </div>

                                            <p className="text-sm text-muted-foreground mb-3">{notif.message}</p>

                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <div className="flex items-center gap-4">
                                                    <span>{notif.user_role}</span>
                                                    <span>{new Date(notif.created_at).toLocaleString()}</span>
                                                    {notif.is_read && (
                                                        <div className="flex items-center gap-1 text-green-600">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Read
                                                        </div>
                                                    )}
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleResend(notif.id)}
                                                >
                                                    Resend
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
