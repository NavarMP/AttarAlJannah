"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricToggle } from "@/components/custom/metric-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Search, Trash2, MoreVertical, Eye, FileDown, Printer,
    Phone, MessageSquare, Truck, Package, Download, Copy, DollarSign,
    ArrowUpDown, ArrowUp, ArrowDown, CalendarDays, Filter, X, RotateCcw, CheckCircle, Pencil, CreditCard
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionBar, BulkAction } from "@/components/admin/bulk-action-bar";
import { EditOrderDialog } from "@/components/admin/edit-order-dialog";

interface Stats {
    totalBottles: number;
    totalOrders: number;
    confirmedBottles: number;
    confirmedOrders: number;
    deliveredBottles: number;
    deliveredOrders: number;
    totalRevenue: number;
}

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    whatsapp_number: string;
    total_price: number;
    quantity: number;
    payment_method: string;
    order_status: string;
    delivery_method?: string;
    created_at: string;
    referred_by?: string;
    volunteer_name?: string;
}

interface Volunteer {
    id: string;
    name: string;
    volunteer_id: string;
}

const ORDER_STATUSES = [
    { label: "Pending", value: "pending" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Delivered", value: "delivered" },
    { label: "Can't Reach", value: "cant_reach" },
    { label: "Cancelled", value: "cancelled" },
];

const DELIVERY_METHODS = [
    { label: "Self Pickup", value: "pickup" },
    { label: "Volunteer Delivery", value: "volunteer" },
    { label: "Courier", value: "courier" },
    { label: "By Post", value: "post" },
];

const PAYMENT_METHODS = [
    { label: "Online (Razorpay)", value: "razorpay" },
    { label: "UPI", value: "qr" },
    { label: "Cash on Delivery", value: "cod" },
    { label: "Held by volunteer", value: "volunteer_cash" },
];

type SortField = "created_at" | "quantity" | "customer_name" | "total_price";
type SortOrder = "asc" | "desc";

// Date preset helpers
function getToday(): { start: string; end: string } {
    const today = new Date();
    const str = today.toISOString().slice(0, 10);
    return { start: str, end: str };
}

function getThisWeek(): { start: string; end: string } {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Monday
    return { start: start.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) };
}

function getThisMonth(): { start: string; end: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: start.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) };
}

// Stat Card with individual toggle
function StatCard({ title, icon, bottles, orders }: { title: string; icon: React.ReactNode; bottles: number; orders: number }) {
    const [showBottles, setShowBottles] = useState(true);

    return (
        <Card className="rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="text-3xl font-bold">
                    {showBottles ? bottles : orders}
                </div>
                <MetricToggle
                    onToggle={setShowBottles}
                    defaultShowBottles={showBottles}
                    className="scale-75 origin-left"
                />
            </CardContent>
        </Card>
    );
}

export default function OrdersPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/admin/stats");
            const data = await response.json();
            setStats(data.stats);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [referredByFilter, setReferredByFilter] = useState("all");
    const [deliveryMethodFilter, setDeliveryMethodFilter] = useState("all");
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
    const [cashReceivedFilter, setCashReceivedFilter] = useState("all");
    const [deliveryVolunteerFilter, setDeliveryVolunteerFilter] = useState("all");
    const [datePreset, setDatePreset] = useState<string>("all");

    // Sorting
    const [sortBy, setSortBy] = useState<SortField>("created_at");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    // Volunteer list for filter dropdown
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);

    // Show/hide advanced filters
    const [showFilters, setShowFilters] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Bulk state
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [bulkProcessing, setBulkProcessing] = useState(false);

    // Fetch volunteer list for filter dropdown
    useEffect(() => {
        const fetchVolunteers = async () => {
            try {
                const response = await fetch("/api/admin/volunteers?limit=1000");
                const data = await response.json();
                setVolunteers(data.volunteers || []);
            } catch (error) {
                console.error("Failed to fetch volunteers:", error);
            }
        };
        fetchVolunteers();
    }, []);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Check if any filter is active
    const hasActiveFilters = statusFilter !== "all" || startDate !== "" || endDate !== "" ||
        referredByFilter !== "all" || deliveryMethodFilter !== "all" || paymentMethodFilter !== "all" || cashReceivedFilter !== "all" || deliveryVolunteerFilter !== "all" || searchInput !== "";

    const clearAllFilters = () => {
        setStatusFilter("all");
        setStartDate("");
        setEndDate("");
        setSearchInput("");
        setSearch("");
        setReferredByFilter("all");
        setDeliveryMethodFilter("all");
        setPaymentMethodFilter("all");
        setCashReceivedFilter("all");
        setDeliveryVolunteerFilter("all");
        setDatePreset("all");
        setPage(1);
    };

    const handleDatePreset = (preset: string) => {
        setDatePreset(preset);
        if (preset === "all") {
            setStartDate("");
            setEndDate("");
        } else if (preset === "today") {
            const { start, end } = getToday();
            setStartDate(start);
            setEndDate(end);
        } else if (preset === "week") {
            const { start, end } = getThisWeek();
            setStartDate(start);
            setEndDate(end);
        } else if (preset === "month") {
            const { start, end } = getThisMonth();
            setStartDate(start);
            setEndDate(end);
        } else if (preset === "custom") {
            // Keep current dates, let user pick
        }
        setPage(1);
    };

    // Toggle sort on a column
    const handleSort = (field: SortField) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder(field === "customer_name" ? "asc" : "desc");
        }
        setPage(1);
    };

    const getSortIcon = (field: SortField) => {
        if (sortBy !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
        return sortOrder === "asc"
            ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
            : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
    };

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                status: statusFilter,
                search: search,
                page: page.toString(),
                sortBy,
                sortOrder,
            });

            if (startDate) queryParams.append("startDate", startDate);
            if (endDate) queryParams.append("endDate", endDate);
            if (referredByFilter !== "all") queryParams.append("referredBy", referredByFilter);
            if (deliveryVolunteerFilter !== "all") queryParams.append("deliveryVolunteer", deliveryVolunteerFilter);
            if (deliveryMethodFilter !== "all") queryParams.append("deliveryMethod", deliveryMethodFilter);
            if (paymentMethodFilter !== "all") queryParams.append("paymentMethod", paymentMethodFilter);
            if (cashReceivedFilter !== "all") queryParams.append("cashReceived", cashReceivedFilter);

            const response = await fetch(`/api/admin/orders?${queryParams}`);

            if (response.status === 401 || response.status === 403) {
                const errData = await response.json().catch(() => ({}));
                toast.error(errData.error || "You are not authorized to view orders");
                return;
            }

            const data = await response.json();
            setOrders(data.orders || []);
            setTotalCount(data.totalCount || 0);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, search, startDate, endDate, sortBy, sortOrder, referredByFilter, deliveryVolunteerFilter, deliveryMethodFilter, paymentMethodFilter, cashReceivedFilter]);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchOrders();
        setSelectedOrders(new Set());
    }, [fetchOrders]);

    // ==== Individual actions ====

    const handleDelete = async () => {
        if (!orderToDelete) return;
        setDeleting(true);
        try {
            const response = await fetch("/api/admin/orders/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: orderToDelete.id }),
            });
            if (response.ok) {
                toast.success("Order deleted successfully");
                fetchOrders();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to delete order");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("An error occurred while deleting the order");
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
            setOrderToDelete(null);
        }
    };

    const handleStatusChange = async (orderId: string, status: string) => {
        try {
            const response = await fetch("/api/admin/orders/bulk-update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderIds: [orderId], status }),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(`Status updated to ${status}`);
                fetchOrders();
            } else {
                toast.error(data.error || "Failed to update status");
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDeliveryMethodChange = async (orderId: string, deliveryMethod: string) => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ delivery_method: deliveryMethod }),
            });
            if (response.ok) {
                toast.success(`Delivery method set to ${deliveryMethod.replace(/_/g, " ")}`);
                fetchOrders();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to update delivery method");
            }
        } catch (error) {
            toast.error("Failed to update delivery method");
        }
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleWhatsAppMessage = async (order: Order) => {
        if (!order.whatsapp_number) return;

        toast.info("Preparing WhatsApp message and poster...", { id: "wa-prep" });

        try {
            // Generate Thanks Poster programmatically
            const canvas = document.createElement("canvas");
            const width = 1080;
            const height = 1350;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            if (ctx) {
                const img = new Image();
                img.crossOrigin = "anonymous";

                await new Promise((resolve) => {
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, width, height);
                        ctx.textAlign = "left";
                        ctx.textBaseline = "middle";
                        ctx.font = "bold 40px sans-serif";
                        ctx.fillStyle = "#ffffff";
                        ctx.fillText(order.customer_name, 110, 480);

                        canvas.toBlob(async (blob) => {
                            if (blob) {
                                try {
                                    await navigator.clipboard.write([
                                        new ClipboardItem({ "image/png": blob })
                                    ]);
                                    resolve(true);
                                } catch (err) {
                                    console.error("Clipboard write failed:", err);
                                    resolve(false);
                                }
                            } else {
                                resolve(false);
                            }
                        }, "image/png");
                    };
                    img.onerror = () => resolve(false);
                    img.src = "/assets/thankYou_Ml.png";
                });
            }

            const statusLabel = getStatusLabel(order.order_status);
            const baseUrl = window.location.origin;
            const trackUrl = `${baseUrl}/track/${order.id}`;
            const dashboardUrl = `${baseUrl}/customer/dashboard`;

            const message = `Assalamu Alaykum, ${order.customer_name},

Thank you for your order with Attar al-Jannah!

*Order Status*: ${statusLabel}
*Quantity*: ${order.quantity} bottle(s)
*Total Price*: ₹${order.total_price}

*Track your delivery here:*
${trackUrl}

*View your orders & invoice here:*
${dashboardUrl}

جزاك الله خيراً`;

            const encodedMessage = encodeURIComponent(message);
            const cleanNumber = order.whatsapp_number.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanNumber}?text=${encodedMessage}`, "_blank");

            toast.dismiss("wa-prep");
            toast.success("Ready! Hit Paste (Cmd+V / Ctrl+V) in WhatsApp to attach the poster.", { duration: 6000 });
        } catch (error) {
            console.error("WhatsApp prep failed:", error);
            toast.dismiss("wa-prep");
            toast.error("Failed to prepare message.");
        }
    };

    const handleInvoiceDownload = (orderId: string) => {
        window.open(`/admin/orders/${orderId}?action=download`, "_blank");
    };

    const handleInvoicePrint = (orderId: string) => {
        window.open(`/admin/orders/${orderId}?action=print`, "_blank");
    };

    const handleExportCSV = async (selectedIds?: string[]) => {
        try {
            const params = new URLSearchParams({ type: "orders" });
            if (selectedIds && selectedIds.length > 0) {
                params.set("ids", selectedIds.join(","));
            }
            const response = await fetch(`/api/admin/export?${params}`);
            if (!response.ok) {
                toast.error("Failed to export");
                return;
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Orders exported successfully");
        } catch (error) {
            toast.error("Failed to export orders");
        }
    };

    // ==== Selection helpers ====

    const toggleOrderSelection = (orderId: string) => {
        const newSelection = new Set(selectedOrders);
        if (newSelection.has(orderId)) {
            newSelection.delete(orderId);
        } else {
            newSelection.add(orderId);
        }
        setSelectedOrders(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedOrders.size === orders.length) {
            setSelectedOrders(new Set());
            setSelectedOrders(new Set(orders.map(o => o.id)));
        }
    };

    // ==== Bulk actions config ====

    const bulkActions: BulkAction[] = [
        {
            label: "Cash Received",
            icon: <DollarSign className="h-4 w-4" />,
            onExecute: async (_ids, value) => {
                const isReceived = value === "true";
                setBulkProcessing(true);
                try {
                    const response = await fetch("/api/admin/orders/bulk-update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            orderIds: Array.from(selectedOrders),
                            cash_received: isReceived,
                        }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                        toast.success(`Cash status updated for ${selectedOrders.size} order(s)`);
                        setSelectedOrders(new Set());
                        fetchOrders();
                    } else {
                        toast.error(data.error || "Failed to update cash status");
                    }
                } catch (error) {
                    toast.error("An error occurred");
                } finally {
                    setBulkProcessing(false);
                }
            },
        },
        {
            label: "Change Status",
            icon: <Package className="h-4 w-4" />,
            options: ORDER_STATUSES.map(s => ({ label: s.label, value: s.value })),
            onExecute: async (_ids, value) => {
                setBulkProcessing(true);
                try {
                    const response = await fetch("/api/admin/orders/bulk-update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            orderIds: Array.from(selectedOrders),
                            status: value,
                        }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                        toast.success(data.message || `Updated ${selectedOrders.size} order(s)`);
                        setSelectedOrders(new Set());
                        fetchOrders();
                    } else {
                        toast.error(data.error || "Failed to update orders");
                    }
                } catch (error) {
                    toast.error("An error occurred");
                } finally {
                    setBulkProcessing(false);
                }
            },
        },
        {
            label: "Delivery Method",
            icon: <Truck className="h-4 w-4" />,
            options: DELIVERY_METHODS.map(d => ({ label: d.label, value: d.value })),
            onExecute: async (_ids, value) => {
                setBulkProcessing(true);
                try {
                    const promises = Array.from(selectedOrders).map(orderId =>
                        fetch(`/api/admin/orders/${orderId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ delivery_method: value }),
                        })
                    );
                    await Promise.all(promises);
                    toast.success(`Delivery method updated for ${selectedOrders.size} order(s)`);
                    setSelectedOrders(new Set());
                    fetchOrders();
                } catch (error) {
                    toast.error("Failed to update delivery method");
                } finally {
                    setBulkProcessing(false);
                }
            },
        },
        {
            label: "Payment Method",
            icon: <CreditCard className="h-4 w-4" />,
            options: PAYMENT_METHODS.map(p => ({ label: p.label, value: p.value })),
            onExecute: async (_ids, value) => {
                setBulkProcessing(true);
                try {
                    const response = await fetch("/api/admin/orders/bulk-update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            orderIds: Array.from(selectedOrders),
                            payment_method: value,
                        }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                        toast.success(`Payment method updated for ${selectedOrders.size} order(s)`);
                        setSelectedOrders(new Set());
                        fetchOrders();
                    } else {
                        toast.error(data.error || "Failed to update payment method");
                    }
                } catch (error) {
                    toast.error("An error occurred");
                } finally {
                    setBulkProcessing(false);
                }
            },
        },
        {
            label: "Export CSV",
            icon: <Download className="h-4 w-4" />,
            variant: "outline",
            onExecute: async () => {
                await handleExportCSV(Array.from(selectedOrders));
            },
        },
        {
            label: "Delete",
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive",
            requireConfirm: true,
            confirmTitle: "Bulk Delete Orders",
            confirmDescription: `Are you sure you want to permanently delete ${selectedOrders.size} order(s)? This action cannot be undone.`,
            onExecute: async () => {
                setBulkProcessing(true);
                try {
                    const response = await fetch("/api/admin/orders/bulk-delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderIds: Array.from(selectedOrders) }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                        toast.success(data.message || `Deleted ${selectedOrders.size} order(s)`);
                        setSelectedOrders(new Set());
                        fetchOrders();
                    } else {
                        toast.error(data.error || "Failed to delete orders");
                    }
                } catch (error) {
                    toast.error("An error occurred");
                } finally {
                    setBulkProcessing(false);
                }
            },
        },
    ];

    // ==== UI helpers ====

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
            case "confirmed":
                return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400";
            case "delivered":
                return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400";
            case "cant_reach":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400";
            case "cancelled":
                return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400";
        }
    };

    const getStatusLabel = (status: string) => {
        return ORDER_STATUSES.find(s => s.value === status)?.label || status;
    };

    const getDeliveryLabel = (method?: string) => {
        if (!method) return "-";
        return DELIVERY_METHODS.find(d => d.value === method)?.label || method;
    };

    // Count active filters for badge
    const activeFilterCount = [
        statusFilter !== "all",
        startDate !== "" || endDate !== "",
        referredByFilter !== "all",
        deliveryMethodFilter !== "all",
        paymentMethodFilter !== "all",
    ].filter(Boolean).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Orders</h1>
                    <p className="text-muted-foreground">Manage all customer orders • {totalCount} total</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2"
                    onClick={() => handleExportCSV()}
                >
                    <Download className="h-4 w-4" />
                    Export All
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total"
                    icon={<Package className="h-5 w-5 text-primary" />}
                    bottles={stats?.totalBottles || 0}
                    orders={stats?.totalOrders || 0}
                />

                <Card className="rounded-3xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Delivered
                        </CardTitle>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="text-3xl font-bold">
                                {stats?.deliveredBottles || 0}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {stats?.deliveredOrders || 0} orders
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Revenue
                        </CardTitle>
                        <DollarSign className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">₹{stats?.totalRevenue?.toFixed(2) || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search + Filter Toggle */}
            <Card className="p-4 rounded-3xl">
                <div className="flex flex-col gap-4">
                    {/* Row 1: Search + Filter Toggle + Clear */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, phone, or Order ID..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={showFilters ? "default" : "outline"}
                                size="sm"
                                className="rounded-xl gap-2"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="h-4 w-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="bg-primary-foreground text-primary text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-xl gap-1 text-muted-foreground hover:text-foreground"
                                    onClick={clearAllFilters}
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Expandable Filters */}
                    {showFilters && (
                        <div className="flex flex-col gap-4 pt-3 border-t border-border">
                            {/* Date Range */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Date Range
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: "All Time", value: "all" },
                                        { label: "Today", value: "today" },
                                        { label: "This Week", value: "week" },
                                        { label: "This Month", value: "month" },
                                        { label: "Custom", value: "custom" },
                                    ].map((preset) => (
                                        <Button
                                            key={preset.value}
                                            variant={datePreset === preset.value ? "default" : "outline"}
                                            size="sm"
                                            className="rounded-xl text-xs h-8"
                                            onClick={() => handleDatePreset(preset.value)}
                                        >
                                            {preset.label}
                                        </Button>
                                    ))}
                                </div>
                                {datePreset === "custom" && (
                                    <div className="flex gap-2 mt-2">
                                        <div className="space-y-1 flex-1">
                                            <label className="text-xs text-muted-foreground">From</label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <label className="text-xs text-muted-foreground">To</label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Filter Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                                {/* Status Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            {ORDER_STATUSES.map(s => (
                                                <SelectItem key={s.value} value={s.value}>
                                                    <span className="flex items-center gap-2">
                                                        <span className={`h-2 w-2 rounded-full inline-block ${getStatusColor(s.value).split(" ")[0]}`} />
                                                        {s.label}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Delivery Method Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Delivery Method</label>
                                    <Select value={deliveryMethodFilter} onValueChange={(v) => { setDeliveryMethodFilter(v); setPage(1); }}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="All Methods" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Methods</SelectItem>
                                            {DELIVERY_METHODS.map(d => (
                                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Referred By Volunteer Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Referred By</label>
                                    <Select value={referredByFilter} onValueChange={(v) => { setReferredByFilter(v); setPage(1); }}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="All Volunteers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Volunteers</SelectItem>
                                            {volunteers.map(v => (
                                                <SelectItem key={v.id} value={v.id}>
                                                    {v.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Delivery Volunteer Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Delivery Volunteer</label>
                                    <Select value={deliveryVolunteerFilter} onValueChange={(v) => { setDeliveryVolunteerFilter(v); setPage(1); }}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="All Volunteers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Volunteers</SelectItem>
                                            {volunteers.map(v => (
                                                <SelectItem key={`delivery-${v.id}`} value={v.id}>
                                                    {v.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Payment Method Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                                    <Select value={paymentMethodFilter} onValueChange={(v) => { setPaymentMethodFilter(v); setPage(1); }}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="All Methods" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Methods</SelectItem>
                                            {PAYMENT_METHODS.map(p => (
                                                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Cash Received Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Cash Status</label>
                                    <Select value={cashReceivedFilter} onValueChange={(v) => { setCashReceivedFilter(v); setPage(1); }}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="All Cash Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Cash Status</SelectItem>
                                            <SelectItem value="true">Cash Received</SelectItem>
                                            <SelectItem value="false">Cash Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Orders Table */}
            <Card className="rounded-3xl overflow-hidden">
                {loading ? (
                    <div className="text-center py-12">Loading orders...</div>
                ) : !orders || orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No orders found</p>
                        {hasActiveFilters && (
                            <Button
                                variant="link"
                                onClick={clearAllFilters}
                                className="mt-2 text-sm"
                            >
                                Clear all filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-4 text-left">
                                        <Checkbox
                                            checked={orders.length > 0 && selectedOrders.size === orders.length}
                                            onCheckedChange={toggleSelectAll}
                                            aria-label="Select all orders"
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:text-primary transition-colors group"
                                        onClick={() => handleSort("customer_name")}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            Customer
                                            {getSortIcon("customer_name")}
                                        </span>
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold">Phone</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold">Volunteer</th>
                                    <th
                                        className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:text-primary transition-colors group"
                                        onClick={() => handleSort("quantity")}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            Qty
                                            {getSortIcon("quantity")}
                                        </span>
                                    </th>
                                    <th
                                        className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:text-primary transition-colors group"
                                        onClick={() => handleSort("total_price")}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            Total
                                            {getSortIcon("total_price")}
                                        </span>
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold">Payment</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold">Status</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold">Delivery</th>
                                    <th
                                        className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:text-primary transition-colors group"
                                        onClick={() => handleSort("created_at")}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            Date
                                            {getSortIcon("created_at")}
                                        </span>
                                    </th>
                                    <th className="px-4 py-4 text-center text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className={`hover:bg-muted/30 transition-colors ${selectedOrders.has(order.id) ? 'bg-primary/5' : ''}`}
                                    >
                                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedOrders.has(order.id)}
                                                onCheckedChange={() => toggleOrderSelection(order.id)}
                                                aria-label={`Select order for ${order.customer_name}`}
                                            />
                                        </td>
                                        <td
                                            className="px-4 py-4 cursor-pointer"
                                            onClick={() => window.location.href = `/admin/orders/${order.id}`}
                                        >
                                            <p className="font-medium">{order.customer_name}</p>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-muted-foreground">
                                            {order.customer_phone}
                                        </td>
                                        <td className="px-4 py-4">
                                            {order.volunteer_name ? (
                                                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                    {order.volunteer_name}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">{order.quantity}</td>
                                        <td className="px-4 py-4 font-semibold text-primary">
                                            ₹{order.total_price}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm">{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method === 'volunteer_cash' ? 'Cash (Volunteer)' : order.payment_method === 'qr' ? 'UPI' : order.payment_method === 'razorpay' ? 'Razorpay' : order.payment_method}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                                                {getStatusLabel(order.order_status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-muted-foreground">
                                                {getDeliveryLabel(order.delivery_method)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-muted-foreground">
                                            <div>{new Date(order.created_at).toLocaleDateString()}</div>
                                            <div className="text-xs opacity-70">
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-52">
                                                    <DropdownMenuItem onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <EditOrderDialog
                                                        orderId={order.id}
                                                        onSuccess={fetchOrders}
                                                        trigger={
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit Order
                                                            </DropdownMenuItem>
                                                        }
                                                    />
                                                    {order.payment_method === 'volunteer_cash' && order.order_status === 'pending' && (
                                                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'confirmed')}>
                                                            <DollarSign className="mr-2 h-4 w-4 text-emerald-500" />
                                                            Mark Cash Received
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator />

                                                    {/* Change Status submenu */}
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <Package className="mr-2 h-4 w-4" />
                                                            Change Status
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent>
                                                            {ORDER_STATUSES.map(s => (
                                                                <DropdownMenuItem
                                                                    key={s.value}
                                                                    onClick={() => handleStatusChange(order.id, s.value)}
                                                                    disabled={order.order_status === s.value}
                                                                >
                                                                    <span className={`mr-2 h-2 w-2 rounded-full inline-block ${getStatusColor(s.value).split(" ")[0]}`} />
                                                                    {s.label}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>

                                                    {/* Delivery Method submenu */}
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <Truck className="mr-2 h-4 w-4" />
                                                            Delivery Method
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent>
                                                            {DELIVERY_METHODS.map(d => (
                                                                <DropdownMenuItem
                                                                    key={d.value}
                                                                    onClick={() => handleDeliveryMethodChange(order.id, d.value)}
                                                                    disabled={order.delivery_method === d.value}
                                                                >
                                                                    {d.label}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>

                                                    <DropdownMenuSeparator />

                                                    {/* Invoice actions */}
                                                    <DropdownMenuItem onClick={() => handleInvoiceDownload(order.id)}>
                                                        <FileDown className="mr-2 h-4 w-4" />
                                                        Download Invoice
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleInvoicePrint(order.id)}>
                                                        <Printer className="mr-2 h-4 w-4" />
                                                        Print Invoice
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    {/* Copy actions */}
                                                    <DropdownMenuItem onClick={() => handleCopy(order.customer_phone, "Phone number")}>
                                                        <Phone className="mr-2 h-4 w-4" />
                                                        Copy Phone
                                                    </DropdownMenuItem>
                                                    {order.whatsapp_number && (
                                                        <DropdownMenuItem onClick={() => handleWhatsAppMessage(order)}>
                                                            <MessageSquare className="mr-2 h-4 w-4 text-green-500" />
                                                            Message on WhatsApp
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setOrderToDelete(order);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="rounded-xl"
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="rounded-xl"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the order for <strong>{orderToDelete?.customer_name}</strong>?
                            <br />
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Action Bar */}
            <BulkActionBar
                selectedCount={selectedOrders.size}
                onClearSelection={() => setSelectedOrders(new Set())}
                actions={bulkActions}
                isProcessing={bulkProcessing}
            />
        </div>
    );
}