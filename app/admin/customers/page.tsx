"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Users, Search, Trash2, Loader2, Phone, Mail, Package,
    MoreVertical, Copy, Download, ArrowUpDown, ArrowUp, ArrowDown,
    CalendarDays, Filter, X, RotateCcw, MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionBar, BulkAction } from "@/components/admin/bulk-action-bar";
import { ExportPrintDialog, type ExportConfig, type PrintConfig, type ColumnOption } from "@/components/admin/export-print-dialog";
import { MultiSelectFilter, type MultiSelectOption } from "@/components/admin/multi-select-filter";

interface Customer {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    whatsapp_number: string | null;
    address: string | null;
    total_orders: number;
    total_bottles: number;
    last_order_at: string | null;
    created_at: string;
    order_statuses?: string[];
    delivery_methods?: string[];
    payment_methods?: string[];
    referred_volunteers?: string[];
    delivery_volunteers?: string[];
}

interface Volunteer {
    id: string;
    name: string;
    volunteer_id: string;
}

type SortField = "name" | "phone" | "total_orders" | "total_bottles" | "created_at";
type SortOrder = "asc" | "desc";

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

function getToday(): { start: string; end: string } {
    const today = new Date();
    const str = today.toISOString().slice(0, 10);
    return { start: str, end: str };
}

function getThisWeek(): { start: string; end: string } {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    return { start: start.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) };
}

function getThisMonth(): { start: string; end: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: start.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) };
}

const CUSTOMER_COLUMNS: ColumnOption[] = [
    { key: "name", label: "Name", default: true },
    { key: "phone", label: "Phone", default: true },
    { key: "whatsapp_number", label: "WhatsApp", default: true },
    { key: "email", label: "Email", default: true },
    { key: "total_orders", label: "Orders", default: true },
    { key: "total_bottles", label: "Bottles", default: true },
];

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        withOrders: 0,
        newThisMonth: 0,
    });

    const [sortBy, setSortBy] = useState<SortField>("created_at");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [datePreset, setDatePreset] = useState<string>("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
    const [bulkProcessing, setBulkProcessing] = useState(false);

    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [deliveryMethodFilter, setDeliveryMethodFilter] = useState<string[]>([]);
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string[]>([]);
    const [referredVolunteerFilter, setReferredVolunteerFilter] = useState<string[]>([]);
    const [deliveryVolunteerFilter, setDeliveryVolunteerFilter] = useState<string[]>([]);

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
        fetchVolunteers();
    }, [fetchVolunteers]);

    const volunteerOptions: MultiSelectOption[] = useMemo(() =>
        volunteers.map(v => ({ value: v.id, label: v.name })),
        [volunteers]
    );

    const hasActiveFilters = searchQuery !== "" || startDate !== "" || endDate !== "" ||
        statusFilter.length > 0 || deliveryMethodFilter.length > 0 || paymentMethodFilter.length > 0 ||
        referredVolunteerFilter.length > 0 || deliveryVolunteerFilter.length > 0;

    const clearAllFilters = () => {
        setSearchInput("");
        setSearchQuery("");
        setStartDate("");
        setEndDate("");
        setDatePreset("all");
        setStatusFilter([]);
        setDeliveryMethodFilter([]);
        setPaymentMethodFilter([]);
        setReferredVolunteerFilter([]);
        setDeliveryVolunteerFilter([]);
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
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleSort = (field: SortField) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder(field === "name" ? "asc" : "desc");
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortBy !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
        return sortOrder === "asc"
            ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
            : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
    };

    const fetchCustomers = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);

            const response = await fetch(`/api/admin/customers?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to fetch customers");

            const data = await response.json();
            setAllCustomers(data.customers || []);
        } catch (error) {
            console.error("Error fetching customers:", error);
            toast.error("Failed to load customers");
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchCustomers();
        setSelectedCustomers(new Set());
    }, [fetchCustomers]);

    const filteredCustomers = useMemo(() => {
        let result = [...allCustomers];

        if (startDate || endDate) {
            result = result.filter(c => {
                const custDate = new Date(c.created_at);
                if (startDate && custDate < new Date(startDate)) return false;
                if (endDate && custDate > new Date(endDate + "T23:59:59")) return false;
                return true;
            });
        }

        if (statusFilter.length > 0) {
            result = result.filter(c => {
                const statuses = c.order_statuses || [];
                return statusFilter.some(s => statuses.includes(s));
            });
        }

        if (deliveryMethodFilter.length > 0) {
            result = result.filter(c => {
                const methods = c.delivery_methods || [];
                return deliveryMethodFilter.some(m => methods.includes(m));
            });
        }

        if (paymentMethodFilter.length > 0) {
            result = result.filter(c => {
                const methods = c.payment_methods || [];
                return paymentMethodFilter.some(m => methods.includes(m));
            });
        }

        if (referredVolunteerFilter.length > 0) {
            result = result.filter(c => {
                const vols = c.referred_volunteers || [];
                return referredVolunteerFilter.some(v => vols.includes(v));
            });
        }

        if (deliveryVolunteerFilter.length > 0) {
            result = result.filter(c => {
                const vols = c.delivery_volunteers || [];
                return deliveryVolunteerFilter.some(v => vols.includes(v));
            });
        }

        result.sort((a, b) => {
            let aVal: any = a[sortBy];
            let bVal: any = b[sortBy];
            if (aVal === null || aVal === undefined) aVal = "";
            if (bVal === null || bVal === undefined) bVal = "";
            if (typeof aVal === "string") aVal = aVal.toLowerCase();
            if (typeof bVal === "string") bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
            if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        setCustomers(result);
        
        const total = result.length;
        const withOrders = result.filter((c: Customer) => c.total_orders > 0).length;
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newThisMonth = result.filter((c: Customer) =>
            new Date(c.created_at) >= thisMonth
        ).length;

        setStats({ total, withOrders, newThisMonth });
    }, [allCustomers, sortBy, sortOrder, startDate, endDate, statusFilter, deliveryMethodFilter, paymentMethodFilter, referredVolunteerFilter, deliveryVolunteerFilter]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            setIsDeleting(true);
            const response = await fetch(`/api/admin/customers/${deleteId}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete customer");
            toast.success("Customer deleted successfully");
            setDeleteId(null);
            fetchCustomers();
        } catch (error) {
            console.error("Error deleting customer:", error);
            toast.error("Failed to delete customer");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleExport = async (config: ExportConfig) => {
        try {
            const params = new URLSearchParams({ type: "customers", format: config.format });
            
            if (config.columns.length > 0) {
                params.set("columns", config.columns.join(","));
            }
            
            if (config.scope === "selected" && selectedCustomers.size > 0) {
                params.set("ids", Array.from(selectedCustomers).join(","));
            }
            
            if (config.includeFilters && hasActiveFilters) {
                if (searchQuery) params.append("search", searchQuery);
                if (startDate) params.append("startDate", startDate);
                if (endDate) params.append("endDate", endDate);
            }
            
            if (config.includeSort) {
                params.set("sortBy", sortBy);
                params.set("sortOrder", sortOrder);
            }

            const response = await fetch(`/api/admin/export?${params}`);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                toast.error(err.error || "Failed to export");
                return;
            }
            
            const contentType = config.format === "excel" 
                ? "application/vnd.ms-excel" 
                : config.format === "pdf"
                ? "application/pdf"
                : "text/csv";
                
            const blob = await response.blob();
            const ext = config.format === "excel" ? "xls" : config.format;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `customers_export_${new Date().toISOString().slice(0, 10)}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(`Customers exported as ${config.format.toUpperCase()}`);
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to export customers");
        }
    };

    const handlePrint = (config: PrintConfig) => {
        let printData = customers;
        
        if (config.scope === "selected" && selectedCustomers.size > 0) {
            printData = customers.filter(c => selectedCustomers.has(c.id));
        }
        
        const printWindow = window.open("", "_blank", "width=800,height=600");
        if (!printWindow) {
            toast.error("Unable to open print window");
            return;
        }

        const columns = config.columns || CUSTOMER_COLUMNS.map(c => c.key);
        const headers = columns.map(col => CUSTOMER_COLUMNS.find(c => c.key === col)?.label || col);

        let tableRows = printData.map(customer => {
            return columns.map(col => {
                let val: any;
                switch (col) {
                    case "name": val = customer.name || "Guest Customer"; break;
                    case "phone": val = customer.phone; break;
                    case "whatsapp_number": val = customer.whatsapp_number || "-"; break;
                    case "email": val = customer.email || "-"; break;
                    case "total_orders": val = customer.total_orders; break;
                    case "total_bottles": val = customer.total_bottles; break;
                    default: val = "-";
                }
                return val;
            }).join("</td><td>");
        }).map(row => `<tr><td>${row}</td></tr>`).join("");

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Customers Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                    tr:nth-child(even) { background-color: #fafafa; }
                    .meta { margin-bottom: 20px; color: #666; font-size: 12px; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        th { background-color: #e0e0e0 !important; }
                    }
                </style>
            </head>
            <body>
                <h1>Customers Report</h1>
                <div class="meta">
                    <p>Total Records: ${printData.length}</p>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                    ${hasActiveFilters ? "<p>Filtered view</p>" : ""}
                </div>
                <table>
                    <thead>
                        <tr><th>${headers.join("</th><th>")}</th></tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    const toggleCustomerSelection = (customerId: string) => {
        const newSelection = new Set(selectedCustomers);
        if (newSelection.has(customerId)) {
            newSelection.delete(customerId);
        } else {
            newSelection.add(customerId);
        }
        setSelectedCustomers(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedCustomers.size === customers.length && customers.length > 0) {
            setSelectedCustomers(new Set());
        } else {
            setSelectedCustomers(new Set(customers.map(c => c.id)));
        }
    };

    const bulkActions: BulkAction[] = [
        {
            label: "Export CSV",
            icon: <Download className="h-4 w-4" />,
            variant: "outline",
            onExecute: async () => {
                await handleExport({ format: "csv", columns: CUSTOMER_COLUMNS.filter(c => c.default).map(c => c.key), scope: "selected", includeFilters: true, includeSort: true });
            },
        },
        {
            label: "Delete",
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive",
            requireConfirm: true,
            confirmTitle: "Bulk Delete Customers",
            confirmDescription: `Are you sure you want to permanently delete ${selectedCustomers.size} customer(s)? Their past orders will remain in the system. This cannot be undone.`,
            onExecute: async () => {
                setBulkProcessing(true);
                try {
                    const response = await fetch("/api/admin/customers/bulk-delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ customerIds: Array.from(selectedCustomers) }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                        toast.success(data.message || `Deleted ${selectedCustomers.size} customer(s)`);
                        setSelectedCustomers(new Set());
                        fetchCustomers();
                    } else {
                        toast.error(data.error || "Failed to delete");
                    }
                } catch {
                    toast.error("An error occurred");
                } finally {
                    setBulkProcessing(false);
                }
            },
        },
    ];

    const activeFilterCount = [
        statusFilter.length > 0,
        deliveryMethodFilter.length > 0,
        paymentMethodFilter.length > 0,
        referredVolunteerFilter.length > 0,
        deliveryVolunteerFilter.length > 0,
        startDate !== "" || endDate !== "",
    ].filter(Boolean).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Customers Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage customer accounts and view order history • {stats.total} total
                    </p>
                </div>
                <ExportPrintDialog
                    options={{
                        type: "customers",
                        columns: CUSTOMER_COLUMNS,
                        data: customers as unknown as Record<string, unknown>[],
                        selectedIds: Array.from(selectedCustomers),
                        filters: { search: searchQuery },
                        sortBy,
                        sortOrder,
                        totalCount: stats.total,
                    }}
                    onExport={handleExport}
                    onPrint={handlePrint}
                >
                    <Button variant="outline" size="sm" className="rounded-xl gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </ExportPrintDialog>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="glass-strong">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">All registered customers</p>
                    </CardContent>
                </Card>
                <Card className="glass-strong">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">With Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.withOrders}</div>
                        <p className="text-xs text-muted-foreground mt-1">Customers who placed orders</p>
                    </CardContent>
                </Card>
                <Card className="glass-strong">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">New This Month</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{stats.newThisMonth}</div>
                        <p className="text-xs text-muted-foreground mt-1">Joined this month</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="p-4 rounded-3xl">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, phone, or email..."
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

                    {showFilters && (
                        <div className="flex flex-col gap-4 pt-3 border-t border-border">
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
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                                    <MultiSelectFilter
                                        options={ORDER_STATUSES.map(s => ({ value: s.value, label: s.label }))}
                                        selected={statusFilter}
                                        onChange={setStatusFilter}
                                        placeholder="All Status"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Delivery Method</label>
                                    <MultiSelectFilter
                                        options={DELIVERY_METHODS.map(d => ({ value: d.value, label: d.label }))}
                                        selected={deliveryMethodFilter}
                                        onChange={setDeliveryMethodFilter}
                                        placeholder="All Methods"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                                    <MultiSelectFilter
                                        options={PAYMENT_METHODS.map(p => ({ value: p.value, label: p.label }))}
                                        selected={paymentMethodFilter}
                                        onChange={setPaymentMethodFilter}
                                        placeholder="All Methods"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Referred By</label>
                                    <MultiSelectFilter
                                        options={volunteerOptions}
                                        selected={referredVolunteerFilter}
                                        onChange={setReferredVolunteerFilter}
                                        placeholder="All Volunteers"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Delivery Volunteer</label>
                                    <MultiSelectFilter
                                        options={volunteerOptions}
                                        selected={deliveryVolunteerFilter}
                                        onChange={setDeliveryVolunteerFilter}
                                        placeholder="All Volunteers"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <Card className="glass-strong">
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : !customers || customers.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                            <p className="mt-4 text-lg font-medium">No customers found</p>
                            <p className="text-sm text-muted-foreground">
                                {searchQuery ? "Try a different search term" : "Customers will appear here after their first order"}
                            </p>
                            {hasActiveFilters && (
                                <Button variant="link" onClick={clearAllFilters} className="mt-2">
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
                                                checked={customers.length > 0 && selectedCustomers.size === customers.length}
                                                onCheckedChange={toggleSelectAll}
                                                aria-label="Select all customers"
                                            />
                                        </th>
                                        <th
                                            className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort("name")}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                Name
                                                {getSortIcon("name")}
                                            </span>
                                        </th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold">Phone</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold">WhatsApp</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold">Email</th>
                                        <th
                                            className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort("total_orders")}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                Orders
                                                {getSortIcon("total_orders")}
                                            </span>
                                        </th>
                                        <th
                                            className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSort("total_bottles")}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                Bottles
                                                {getSortIcon("total_bottles")}
                                            </span>
                                        </th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {customers.map((customer) => (
                                        <TableRow
                                            key={customer.id}
                                            customer={customer}
                                            isSelected={selectedCustomers.has(customer.id)}
                                            onToggleSelect={() => toggleCustomerSelection(customer.id)}
                                            onCopy={handleCopy}
                                            onDelete={() => setDeleteId(customer.id)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the customer
                            profile. Their past orders will remain in the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</>) : ("Delete Customer")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <BulkActionBar
                selectedCount={selectedCustomers.size}
                onClearSelection={() => setSelectedCustomers(new Set())}
                actions={bulkActions}
                isProcessing={bulkProcessing}
            />
        </div>
    );
}

function TableRow({ customer, isSelected, onToggleSelect, onCopy, onDelete }: {
    customer: Customer;
    isSelected: boolean;
    onToggleSelect: () => void;
    onCopy: (text: string, label: string) => void;
    onDelete: () => void;
}) {
    const router = useRouter();
    const handleRowClick = () => {
        router.push(`/admin/customers/${customer.phone}`);
    };

    return (
        <tr 
            className={`hover:bg-muted/30 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
            onClick={handleRowClick}
        >
            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={onToggleSelect}
                    aria-label={`Select ${customer.name || customer.phone}`}
                />
            </td>
            <td className="px-4 py-4">
                <span className="font-medium">{customer.name || <span className="text-muted-foreground italic">No name</span>}</span>
            </td>
            <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-sm">{customer.phone}</span>
                </div>
            </td>
            <td className="px-4 py-4">
                {customer.whatsapp_number ? (
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-3 w-3 text-green-500" />
                        <span className="font-mono text-sm">{customer.whatsapp_number}</span>
                    </div>
                ) : (
                    <span className="text-muted-foreground italic text-sm">-</span>
                )}
            </td>
            <td className="px-4 py-4">
                {customer.email ? (
                    <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{customer.email}</span>
                    </div>
                ) : (
                    <span className="text-muted-foreground italic text-sm">No email</span>
                )}
            </td>
            <td className="px-4 py-4">
                <span className="font-semibold">{customer.total_orders}</span>
            </td>
            <td className="px-4 py-4">
                <span className="font-semibold text-primary">{customer.total_bottles}</span>
            </td>
            <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onCopy(customer.phone, "Phone number")}>
                            <Phone className="mr-2 h-4 w-4" />Copy Phone
                        </DropdownMenuItem>
                        {customer.whatsapp_number && (
                            <DropdownMenuItem onClick={() => onCopy(customer.whatsapp_number!, "WhatsApp number")}>
                                <MessageCircle className="mr-2 h-4 w-4" />Copy WhatsApp
                            </DropdownMenuItem>
                        )}
                        {customer.email && (
                            <DropdownMenuItem onClick={() => onCopy(customer.email!, "Email")}>
                                <Mail className="mr-2 h-4 w-4" />Copy Email
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={onDelete}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    );
}
