"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
    CheckCircle, XCircle, Clock, Package, TrendingUp, Users, Award,
    CheckCircle2, Plus, MapPin, Trash2, Truck, Search,
    BarChart3, ClipboardList, Map, Settings2, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { DeliveryRequest } from "@/types";
import Link from "next/link";
import { COURIER_MAP } from "@/lib/services/courier-tracking";

// ─── Types ───────────────────────────────────────────────────────────

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
    volunteer: { name: string; volunteer_id: string };
    count: number;
}

interface DeliveryZone {
    id: string;
    name: string;
    description?: string;
    district: string;
    state: string;
    pincodes: string[];
    pincode_start?: string;
    pincode_end?: string;
    is_active: boolean;
    volunteer_delivery_zones: { count: number }[];
}

interface OrderForAssign {
    id: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    quantity: number;
    total_price: number;
    order_status: string;
    delivery_method?: string;
    volunteer_id?: string;
    is_delivery_duty?: boolean;
    volunteer_name?: string;
    created_at: string;
}

interface Volunteer {
    id: string;
    name: string;
    volunteer_id: string;
}

const DELIVERY_METHODS = [
    { label: "Self Pickup", value: "pickup" },
    { label: "Volunteer Delivery", value: "volunteer" },
    { label: "Courier", value: "courier" },
    { label: "By Post", value: "post" },
];

// ─── Main Page ───────────────────────────────────────────────────────

export default function DeliveryPage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [pendingCount, setPendingCount] = useState(0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Delivery Management</h1>
                <p className="text-muted-foreground">
                    Manage deliveries, zones, requests, and assignments
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 rounded-2xl h-12 p-1">
                    <TabsTrigger value="overview" className="rounded-xl gap-2 data-[state=active]:shadow-md">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="rounded-xl gap-2 data-[state=active]:shadow-md relative">
                        <ClipboardList className="h-4 w-4" />
                        <span className="hidden sm:inline">Requests</span>
                        {pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 sm:static sm:ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {pendingCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="zones" className="rounded-xl gap-2 data-[state=active]:shadow-md">
                        <Map className="h-4 w-4" />
                        <span className="hidden sm:inline">Zones</span>
                    </TabsTrigger>
                    <TabsTrigger value="assign" className="rounded-xl gap-2 data-[state=active]:shadow-md">
                        <Settings2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Assign</span>
                    </TabsTrigger>
                    <TabsTrigger value="tracking" className="rounded-xl gap-2 data-[state=active]:shadow-md">
                        <Truck className="h-4 w-4" />
                        <span className="hidden sm:inline">Tracking</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <OverviewTab />
                </TabsContent>

                <TabsContent value="requests">
                    <RequestsTab onPendingCountChange={setPendingCount} />
                </TabsContent>

                <TabsContent value="zones">
                    <ZonesTab />
                </TabsContent>

                <TabsContent value="assign">
                    <AssignTab />
                </TabsContent>

                <TabsContent value="tracking">
                    <TrackingTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════
// TAB 1: OVERVIEW (Analytics)
// ═════════════════════════════════════════════════════════════════════

function OverviewTab() {
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
            toast.error("Failed to load delivery analytics");
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="rounded-3xl animate-pulse">
                        <CardContent className="p-6 h-28" />
                    </Card>
                ))}
            </div>
        );
    }

    const successRate = analytics && analytics.total_scheduled > 0
        ? Math.round((analytics.completed_deliveries / analytics.total_scheduled) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex justify-end">
                <div className="flex gap-1 bg-muted rounded-xl p-1">
                    {[
                        { label: "7D", value: "7" },
                        { label: "30D", value: "30" },
                        { label: "90D", value: "90" },
                    ].map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p.value
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
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

            {/* Breakdown & Top Volunteers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rounded-3xl">
                    <CardHeader>
                        <CardTitle>Delivery Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[
                            { label: "Completed", count: analytics?.completed_deliveries || 0, color: "bg-green-100 text-green-700" },
                            { label: "In Transit", count: analytics?.in_transit || 0, color: "bg-blue-100 text-blue-700" },
                            { label: "Rescheduled", count: analytics?.rescheduled || 0, color: "bg-yellow-100 text-yellow-700" },
                            { label: "Cancelled", count: analytics?.cancelled || 0, color: "bg-red-100 text-red-700" },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between">
                                <span className="text-sm">{item.label}</span>
                                <Badge className={item.color}>{item.count}</Badge>
                            </div>
                        ))}
                        <div className="pt-3 border-t">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Success Rate</span>
                                <span className="text-xl font-bold text-green-600">{successRate}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
    );
}

// ═════════════════════════════════════════════════════════════════════
// TAB 2: REQUESTS
// ═════════════════════════════════════════════════════════════════════

function RequestsTab({ onPendingCountChange }: { onPendingCountChange: (count: number) => void }) {
    const [requests, setRequests] = useState<DeliveryRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("pending");
    const [processing, setProcessing] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/delivery-requests?status=${statusFilter}`);
            if (!response.ok) throw new Error("Failed to fetch requests");
            const data = await response.json();
            const fetchedRequests = data.requests || [];
            setRequests(fetchedRequests);

            // Update pending count for tab badge
            if (statusFilter === "pending") {
                onPendingCountChange(fetchedRequests.length);
            }
        } catch (error) {
            console.error("Error fetching delivery requests:", error);
            toast.error("Failed to load delivery requests");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, onPendingCountChange]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // Also fetch pending count independently when not on pending filter
    useEffect(() => {
        if (statusFilter !== "pending") {
            fetch("/api/admin/delivery-requests?status=pending")
                .then(r => r.json())
                .then(data => onPendingCountChange((data.requests || []).length))
                .catch(() => { });
        }
    }, [statusFilter, onPendingCountChange]);

    const handleApprove = async (requestId: string) => {
        try {
            setProcessing(requestId);
            const response = await fetch("/api/admin/delivery-requests", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, action: "approve" }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to approve request");
            }
            toast.success("Delivery request approved!");
            fetchRequests();
        } catch (error: any) {
            toast.error(error.message || "Failed to approve request");
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            setProcessing(requestId);
            const response = await fetch("/api/admin/delivery-requests", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, action: "reject" }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to reject request");
            }
            toast.success("Delivery request rejected");
            fetchRequests();
        } catch (error: any) {
            toast.error(error.message || "Failed to reject request");
        } finally {
            setProcessing(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
            case "approved":
                return <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
            case "rejected":
                return <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Filter requests by search
    const filteredRequests = requests.filter(r => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            r.volunteers?.name?.toLowerCase().includes(q) ||
            r.volunteers?.volunteer_id?.toLowerCase().includes(q) ||
            r.orders?.customer_name?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-4">
            {/* Search & Filters */}
            <Card className="glass-strong rounded-2xl">
                <CardContent className="pt-6 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by volunteer or customer name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 rounded-xl"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {["pending", "approved", "rejected", "all"].map(status => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? "default" : "outline"}
                                onClick={() => setStatusFilter(status)}
                                size="sm"
                                className="rounded-xl capitalize"
                            >
                                {status}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Requests List */}
            <Card className="glass-strong rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Delivery Requests
                        {!loading && <span className="text-sm font-normal text-muted-foreground">({filteredRequests.length})</span>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-muted-foreground">Loading requests...</div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No {statusFilter !== "all" ? statusFilter : ""} delivery requests found
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRequests.map((request) => (
                                <div key={request.id} className="p-4 border rounded-xl bg-card/50 space-y-3 hover:border-primary/30 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">
                                                    {request.volunteers?.name || "Unknown Volunteer"}
                                                </p>
                                                <span className="text-sm text-muted-foreground">
                                                    ({request.volunteers?.volunteer_id})
                                                </span>
                                            </div>
                                            <p className="text-sm">
                                                Order: <span className="font-medium">{request.orders?.customer_name}</span> - {request.orders?.quantity} bottles
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Requested: {new Date(request.requested_at).toLocaleString()}
                                            </p>
                                            {request.notes && (
                                                <p className="text-xs text-muted-foreground italic">{request.notes}</p>
                                            )}
                                        </div>
                                        {getStatusBadge(request.status)}
                                    </div>

                                    {request.status === "pending" && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(request.id)}
                                                disabled={processing === request.id}
                                                className="bg-green-600 hover:bg-green-700 rounded-xl"
                                            >
                                                {processing === request.id ? "Processing..." : "Approve"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleReject(request.id)}
                                                disabled={processing === request.id}
                                                className="rounded-xl"
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    )}

                                    {request.status !== "pending" && request.responded_at && (
                                        <p className="text-xs text-muted-foreground">
                                            Responded: {new Date(request.responded_at).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════
// TAB 3: ZONES
// ═════════════════════════════════════════════════════════════════════

function ZonesTab() {
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [expandedZone, setExpandedZone] = useState<string | null>(null);
    const [zoneVolunteers, setZoneVolunteers] = useState<Record<string, any[]>>({});
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        district: "",
        state: "Kerala",
        pincodes: "" as string,
        useRange: false,
        pincodeStart: "",
        pincodeEnd: "",
    });

    useEffect(() => {
        fetchZones();
    }, []);

    const fetchZones = async () => {
        try {
            const response = await fetch("/api/admin/delivery-zones");
            const data = await response.json();
            setZones(data.zones || []);
        } catch (error) {
            toast.error("Failed to load zones");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                name: formData.name,
                description: formData.description,
                district: formData.district,
                state: formData.state,
            };

            if (formData.useRange) {
                payload.pincodeStart = formData.pincodeStart;
                payload.pincodeEnd = formData.pincodeEnd;
            } else {
                payload.pincodes = formData.pincodes
                    .split(",")
                    .map(p => p.trim())
                    .filter(p => p.length > 0);
            }

            const response = await fetch("/api/admin/delivery-zones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to create zone");

            toast.success("Zone created successfully");
            setShowForm(false);
            setFormData({
                name: "", description: "", district: "", state: "Kerala",
                pincodes: "", useRange: false, pincodeStart: "", pincodeEnd: "",
            });
            fetchZones();
        } catch (error) {
            toast.error("Failed to create zone");
        }
    };

    const deleteZone = async (id: string) => {
        if (!confirm("Are you sure you want to delete this zone?")) return;
        try {
            const response = await fetch(`/api/admin/delivery-zones/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete zone");
            toast.success("Zone deleted successfully");
            fetchZones();
        } catch (error) {
            toast.error("Failed to delete zone");
        }
    };

    const toggleZoneActive = async (zone: DeliveryZone) => {
        try {
            const response = await fetch(`/api/admin/delivery-zones/${zone.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !zone.is_active }),
            });
            if (!response.ok) throw new Error("Failed to update zone");
            toast.success(`Zone ${!zone.is_active ? "activated" : "deactivated"}`);
            fetchZones();
        } catch (error) {
            toast.error("Failed to update zone");
        }
    };

    const toggleExpand = async (zoneId: string) => {
        if (expandedZone === zoneId) {
            setExpandedZone(null);
            return;
        }
        setExpandedZone(zoneId);

        // Fetch zone volunteers if not cached
        if (!zoneVolunteers[zoneId]) {
            try {
                const response = await fetch(`/api/admin/delivery-zones/${zoneId}`);
                const data = await response.json();
                const volunteers = data.zone?.volunteer_delivery_zones?.map((vdz: any) => vdz.volunteers) || [];
                setZoneVolunteers(prev => ({ ...prev, [zoneId]: volunteers }));
            } catch (error) {
                console.error("Failed to fetch zone volunteers:", error);
            }
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground">{zones.length} zone{zones.length !== 1 ? "s" : ""} configured</p>
                <Button onClick={() => setShowForm(true)} className="rounded-2xl gap-2">
                    <Plus className="w-4 h-4" />
                    New Zone
                </Button>
            </div>

            {/* Create Zone Form */}
            {showForm && (
                <Card className="rounded-3xl border-primary/50">
                    <CardHeader>
                        <CardTitle>Create New Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Zone Name</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Kozhikode Central"
                                        required
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">District</label>
                                    <Input
                                        value={formData.district}
                                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        placeholder="e.g., Kozhikode"
                                        required
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Description (Optional)</label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the zone"
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="useRange"
                                    checked={formData.useRange}
                                    onChange={(e) => setFormData({ ...formData, useRange: e.target.checked })}
                                />
                                <label htmlFor="useRange" className="text-sm">Use pincode range instead of list</label>
                            </div>

                            {formData.useRange ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Start Pincode</label>
                                        <Input
                                            value={formData.pincodeStart}
                                            onChange={(e) => setFormData({ ...formData, pincodeStart: e.target.value })}
                                            placeholder="673001"
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">End Pincode</label>
                                        <Input
                                            value={formData.pincodeEnd}
                                            onChange={(e) => setFormData({ ...formData, pincodeEnd: e.target.value })}
                                            placeholder="673010"
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-sm font-medium">Pincodes (comma-separated)</label>
                                    <Input
                                        value={formData.pincodes}
                                        onChange={(e) => setFormData({ ...formData, pincodes: e.target.value })}
                                        placeholder="673001, 673002, 673003"
                                        className="rounded-xl"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Enter pincodes separated by commas</p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button type="submit" className="rounded-2xl">Create Zone</Button>
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-2xl">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Zones List */}
            <div className="grid gap-4">
                {loading ? (
                    <p className="text-center text-muted-foreground py-8">Loading zones...</p>
                ) : zones.length === 0 ? (
                    <Card className="rounded-3xl">
                        <CardContent className="p-12 text-center">
                            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-lg text-muted-foreground">No delivery zones yet</p>
                            <p className="text-sm text-muted-foreground">Create your first zone to get started</p>
                        </CardContent>
                    </Card>
                ) : (
                    zones.map((zone) => (
                        <Card key={zone.id} className="rounded-3xl">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold">{zone.name}</h3>
                                            {zone.is_active ? (
                                                <Badge className="bg-green-100 text-green-700">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </div>

                                        {zone.description && (
                                            <p className="text-sm text-muted-foreground mb-3">{zone.description}</p>
                                        )}

                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">District:</span>{" "}
                                                <span className="font-medium">{zone.district}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">State:</span>{" "}
                                                <span className="font-medium">{zone.state}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium">
                                                    {zone.volunteer_delivery_zones?.[0]?.count || 0}
                                                </span>
                                                <span className="text-muted-foreground">volunteers</span>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <p className="text-xs text-muted-foreground mb-1">Pincodes:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {zone.pincode_start && zone.pincode_end ? (
                                                    <Badge variant="outline" className="rounded-lg">
                                                        {zone.pincode_start} - {zone.pincode_end}
                                                    </Badge>
                                                ) : (
                                                    zone.pincodes?.map((pincode) => (
                                                        <Badge key={pincode} variant="outline" className="rounded-lg">
                                                            {pincode}
                                                        </Badge>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={zone.is_active}
                                            onCheckedChange={() => toggleZoneActive(zone)}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleExpand(zone.id)}
                                            className="rounded-xl"
                                        >
                                            {expandedZone === zone.id ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteZone(zone.id)}
                                            className="rounded-xl"
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Expanded: Show assigned volunteers */}
                                {expandedZone === zone.id && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm font-medium mb-2">Assigned Volunteers</p>
                                        {!zoneVolunteers[zone.id] ? (
                                            <p className="text-sm text-muted-foreground">Loading...</p>
                                        ) : zoneVolunteers[zone.id].length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No volunteers assigned to this zone</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {zoneVolunteers[zone.id].map((vol: any) => (
                                                    <Badge key={vol.id} variant="outline" className="rounded-lg py-1 px-2">
                                                        {vol.name} ({vol.volunteer_id})
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════
// TAB 4: ASSIGN & MANAGE
// ═════════════════════════════════════════════════════════════════════

function AssignTab() {
    const [orders, setOrders] = useState<OrderForAssign[]>([]);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("needs_method"); // needs_method | needs_volunteer | all
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [bulkMethod, setBulkMethod] = useState("");
    const [bulkVolunteer, setBulkVolunteer] = useState("");
    const [processing, setProcessing] = useState(false);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch orders that need delivery attention
            const params = new URLSearchParams({ status: "confirmed", sortBy: "created_at", sortOrder: "desc" });
            const response = await fetch(`/api/admin/orders?${params}`);
            const data = await response.json();
            setOrders(data.orders || []);
        } catch (error) {
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchVolunteers = useCallback(async () => {
        try {
            const response = await fetch("/api/admin/volunteers?limit=1000");
            const data = await response.json();
            setVolunteers(data.volunteers || []);
        } catch (error) {
            console.error("Failed to fetch volunteers:", error);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        fetchVolunteers();
    }, [fetchOrders, fetchVolunteers]);

    // Filter orders based on selection
    const filteredOrders = orders.filter(order => {
        if (filter === "needs_method") return !order.delivery_method;
        if (filter === "needs_volunteer") return order.delivery_method === "volunteer" && !order.is_delivery_duty;
        return true;
    });

    const handleMethodChange = async (orderId: string, method: string) => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ delivery_method: method }),
            });
            if (response.ok) {
                toast.success(`Delivery method updated`);
                fetchOrders();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to update");
            }
        } catch (error) {
            toast.error("Failed to update delivery method");
        }
    };

    const handleVolunteerAssign = async (orderId: string, volunteerId: string) => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    volunteer_id: volunteerId,
                    is_delivery_duty: true,
                    delivery_method: "volunteer",
                }),
            });
            if (response.ok) {
                toast.success("Delivery volunteer assigned");
                fetchOrders();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to assign volunteer");
            }
        } catch (error) {
            toast.error("Failed to assign volunteer");
        }
    };

    const handleBulkMethodAssign = async () => {
        if (!bulkMethod || selectedOrders.size === 0) return;
        setProcessing(true);
        try {
            const promises = Array.from(selectedOrders).map(orderId =>
                fetch(`/api/admin/orders/${orderId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ delivery_method: bulkMethod }),
                })
            );
            await Promise.all(promises);
            toast.success(`Delivery method updated for ${selectedOrders.size} order(s)`);
            setSelectedOrders(new Set());
            setBulkMethod("");
            fetchOrders();
        } catch (error) {
            toast.error("Failed to bulk update");
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkVolunteerAssign = async () => {
        if (!bulkVolunteer || selectedOrders.size === 0) return;
        setProcessing(true);
        try {
            const promises = Array.from(selectedOrders).map(orderId =>
                fetch(`/api/admin/orders/${orderId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        volunteer_id: bulkVolunteer,
                        is_delivery_duty: true,
                        delivery_method: "volunteer",
                    }),
                })
            );
            await Promise.all(promises);
            toast.success(`Volunteer assigned to ${selectedOrders.size} order(s)`);
            setSelectedOrders(new Set());
            setBulkVolunteer("");
            fetchOrders();
        } catch (error) {
            toast.error("Failed to bulk assign");
        } finally {
            setProcessing(false);
        }
    };

    const toggleSelection = (orderId: string) => {
        const next = new Set(selectedOrders);
        if (next.has(orderId)) next.delete(orderId);
        else next.add(orderId);
        setSelectedOrders(next);
    };

    const toggleSelectAll = () => {
        if (selectedOrders.size === filteredOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
        }
    };

    return (
        <div className="space-y-4">
            {/* Filter Pills */}
            <Card className="rounded-2xl">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: "Needs Method", value: "needs_method" },
                            { label: "Needs Volunteer", value: "needs_volunteer" },
                            { label: "All Confirmed", value: "all" },
                        ].map(f => (
                            <Button
                                key={f.value}
                                variant={filter === f.value ? "default" : "outline"}
                                onClick={() => { setFilter(f.value); setSelectedOrders(new Set()); }}
                                size="sm"
                                className="rounded-xl"
                            >
                                {f.label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedOrders.size > 0 && (
                <Card className="rounded-2xl border-primary/50 bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <p className="text-sm font-medium">{selectedOrders.size} selected</p>
                            <div className="flex flex-wrap gap-2 flex-1">
                                <div className="flex gap-2 items-center">
                                    <Select value={bulkMethod} onValueChange={setBulkMethod}>
                                        <SelectTrigger className="w-[160px] h-9 rounded-xl">
                                            <SelectValue placeholder="Set method..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DELIVERY_METHODS.map(d => (
                                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        size="sm"
                                        disabled={!bulkMethod || processing}
                                        onClick={handleBulkMethodAssign}
                                        className="rounded-xl"
                                    >
                                        Apply
                                    </Button>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Select value={bulkVolunteer} onValueChange={setBulkVolunteer}>
                                        <SelectTrigger className="w-[160px] h-9 rounded-xl">
                                            <SelectValue placeholder="Assign volunteer..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {volunteers.map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        size="sm"
                                        disabled={!bulkVolunteer || processing}
                                        onClick={handleBulkVolunteerAssign}
                                        className="rounded-xl"
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Orders Table */}
            <Card className="rounded-3xl overflow-hidden">
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Truck className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p>No orders matching this filter</p>
                        <p className="text-sm mt-1">All orders have been assigned!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <Checkbox
                                            checked={filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Address</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Qty</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Delivery Method</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Volunteer</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredOrders.map(order => (
                                    <tr key={order.id} className={`hover:bg-muted/30 transition-colors ${selectedOrders.has(order.id) ? "bg-primary/5" : ""}`}>
                                        <td className="px-4 py-3">
                                            <Checkbox
                                                checked={selectedOrders.has(order.id)}
                                                onCheckedChange={() => toggleSelection(order.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-sm">{order.customer_name}</p>
                                            <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-muted-foreground max-w-[200px] truncate">{order.customer_address || "-"}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{order.quantity}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-primary">₹{order.total_price}</td>
                                        <td className="px-4 py-3">
                                            <Select
                                                value={order.delivery_method || ""}
                                                onValueChange={(v) => handleMethodChange(order.id, v)}
                                            >
                                                <SelectTrigger className="w-[140px] h-8 rounded-lg text-xs">
                                                    <SelectValue placeholder="Set method" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DELIVERY_METHODS.map(d => (
                                                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.volunteer_name && order.is_delivery_duty ? (
                                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                                                    {order.volunteer_name}
                                                </Badge>
                                            ) : (
                                                <Select onValueChange={(v) => handleVolunteerAssign(order.id, v)}>
                                                    <SelectTrigger className="w-[140px] h-8 rounded-lg text-xs">
                                                        <SelectValue placeholder="Assign..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {volunteers.map(v => (
                                                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════
// TAB 5: TRACKING
// ═════════════════════════════════════════════════════════════════════

interface TrackingOrder {
    id: string;
    customer_name: string;
    order_status: string;
    delivery_method: string | null;
    tracking_number: string | null;
    courier_name: string | null;
    last_tracking_sync: string | null;
    created_at: string;
}

function TrackingTab() {
    const [orders, setOrders] = useState<TrackingOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [methodFilter, setMethodFilter] = useState("all");
    const [syncing, setSyncing] = useState(false);
    const [editingOrder, setEditingOrder] = useState<string | null>(null);
    const [editTrackingNumber, setEditTrackingNumber] = useState("");
    const [editCourierName, setEditCourierName] = useState("");
    const [addingEvent, setAddingEvent] = useState<string | null>(null);
    const [eventTitle, setEventTitle] = useState("");
    const [eventStatus, setEventStatus] = useState("in_transit");
    const [eventLocation, setEventLocation] = useState("");

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/orders");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            const allOrders = (data.orders || data || []).map((o: any) => ({
                id: o.id,
                customer_name: o.customer_name,
                order_status: o.order_status,
                delivery_method: o.delivery_method,
                tracking_number: o.tracking_number,
                courier_name: o.courier_name,
                last_tracking_sync: o.last_tracking_sync,
                created_at: o.created_at,
            }));
            setOrders(allOrders);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const filteredOrders = orders.filter((o) => {
        if (methodFilter === "all") return true;
        if (methodFilter === "with_tracking") return !!o.tracking_number;
        return o.delivery_method === methodFilter;
    });

    const handleSaveTracking = async (orderId: string) => {
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/tracking`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tracking_number: editTrackingNumber || null,
                    courier_name: editCourierName || null,
                }),
            });
            if (!res.ok) throw new Error("Failed to save");
            toast.success("Tracking info saved");
            setEditingOrder(null);
            fetchOrders();
        } catch {
            toast.error("Failed to save tracking info");
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch("/api/admin/tracking/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (!res.ok) throw new Error("Sync failed");
            const data = await res.json();
            toast.success(`Synced ${data.synced}/${data.total} orders`);
            fetchOrders();
        } catch {
            toast.error("Failed to sync tracking");
        } finally {
            setSyncing(false);
        }
    };

    const handleAddEvent = async (orderId: string) => {
        if (!eventTitle.trim()) {
            toast.error("Title is required");
            return;
        }
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/tracking`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: eventStatus,
                    title: eventTitle,
                    location: eventLocation || null,
                }),
            });
            if (!res.ok) throw new Error("Failed to add event");
            toast.success("Tracking event added");
            setAddingEvent(null);
            setEventTitle("");
            setEventStatus("in_transit");
            setEventLocation("");
        } catch {
            toast.error("Failed to add event");
        }
    };

    const courierOptions = Object.entries(COURIER_MAP).map(([key, val]) => ({
        value: key,
        label: val.name,
    }));

    return (
        <div className="space-y-4">
            {/* Filters & Actions */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: "All", value: "all" },
                        { label: "Post", value: "post" },
                        { label: "Courier", value: "courier" },
                        { label: "Volunteer", value: "volunteer" },
                        { label: "With Tracking #", value: "with_tracking" },
                    ].map((f) => (
                        <Button
                            key={f.value}
                            variant={methodFilter === f.value ? "default" : "outline"}
                            size="sm"
                            className="rounded-xl"
                            onClick={() => setMethodFilter(f.value)}
                        >
                            {f.label}
                        </Button>
                    ))}
                </div>
                <Button
                    onClick={handleSync}
                    disabled={syncing}
                    className="rounded-xl gap-2"
                    variant="outline"
                >
                    {syncing ? (
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    ) : (
                        <Truck className="h-4 w-4" />
                    )}
                    {syncing ? "Syncing..." : "Sync All Courier Tracking"}
                </Button>
            </div>

            {/* Orders Table */}
            <Card className="rounded-3xl">
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No orders found for this filter
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-3 font-medium">Customer</th>
                                        <th className="pb-3 font-medium">Method</th>
                                        <th className="pb-3 font-medium">Tracking #</th>
                                        <th className="pb-3 font-medium">Courier</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Last Sync</th>
                                        <th className="pb-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-accent/30">
                                            <td className="py-3">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="text-primary hover:underline font-medium"
                                                >
                                                    {order.customer_name}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">
                                                    {order.id.slice(0, 8)}
                                                </p>
                                            </td>
                                            <td className="py-3">
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-lg text-xs capitalize"
                                                >
                                                    {order.delivery_method || "—"}
                                                </Badge>
                                            </td>
                                            <td className="py-3">
                                                {editingOrder === order.id ? (
                                                    <Input
                                                        value={editTrackingNumber}
                                                        onChange={(e) => setEditTrackingNumber(e.target.value)}
                                                        placeholder="Enter tracking #"
                                                        className="rounded-lg h-8 text-xs w-36"
                                                    />
                                                ) : (
                                                    <span className="font-mono text-xs">
                                                        {order.tracking_number || "—"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3">
                                                {editingOrder === order.id ? (
                                                    <Select value={editCourierName} onValueChange={setEditCourierName}>
                                                        <SelectTrigger className="h-8 w-32 rounded-lg text-xs">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {courierOptions.map((c) => (
                                                                <SelectItem key={c.value} value={c.value}>
                                                                    {c.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <span className="text-xs">
                                                        {COURIER_MAP[order.courier_name || ""]?.name || order.courier_name || "—"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3">
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-lg text-xs capitalize"
                                                >
                                                    {order.order_status.replace(/_/g, " ")}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-xs text-muted-foreground">
                                                {order.last_tracking_sync
                                                    ? new Date(order.last_tracking_sync).toLocaleString("en-IN", {
                                                        day: "numeric",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : "—"}
                                            </td>
                                            <td className="py-3">
                                                <div className="flex gap-1">
                                                    {editingOrder === order.id ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="rounded-lg h-7 text-xs"
                                                                onClick={() => handleSaveTracking(order.id)}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="rounded-lg h-7 text-xs"
                                                                onClick={() => setEditingOrder(null)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="rounded-lg h-7 text-xs"
                                                                onClick={() => {
                                                                    setEditingOrder(order.id);
                                                                    setEditTrackingNumber(order.tracking_number || "");
                                                                    setEditCourierName(order.courier_name || "");
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="rounded-lg h-7 text-xs"
                                                                onClick={() => {
                                                                    if (addingEvent === order.id) {
                                                                        setAddingEvent(null);
                                                                    } else {
                                                                        setAddingEvent(order.id);
                                                                    }
                                                                }}
                                                            >
                                                                + Event
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Inline Event Form */}
                                                {addingEvent === order.id && (
                                                    <div className="mt-2 p-3 bg-accent/30 rounded-xl space-y-2">
                                                        <Input
                                                            value={eventTitle}
                                                            onChange={(e) => setEventTitle(e.target.value)}
                                                            placeholder="Event title"
                                                            className="rounded-lg h-8 text-xs"
                                                        />
                                                        <div className="flex gap-2">
                                                            <Select value={eventStatus} onValueChange={setEventStatus}>
                                                                <SelectTrigger className="h-8 rounded-lg text-xs flex-1">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {["packed", "shipped", "in_transit", "out_for_delivery", "delivered", "cant_reach", "returned"].map((s) => (
                                                                        <SelectItem key={s} value={s}>
                                                                            {s.replace(/_/g, " ")}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <Input
                                                                value={eventLocation}
                                                                onChange={(e) => setEventLocation(e.target.value)}
                                                                placeholder="Location (optional)"
                                                                className="rounded-lg h-8 text-xs flex-1"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="rounded-lg h-7 text-xs"
                                                                onClick={() => handleAddEvent(order.id)}
                                                            >
                                                                Add Event
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="rounded-lg h-7 text-xs"
                                                                onClick={() => setAddingEvent(null)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
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

