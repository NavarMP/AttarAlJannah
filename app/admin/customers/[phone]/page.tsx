"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
    ArrowLeft, Phone, Mail, MapPin, MessageCircle, Copy, Download,
    MoreVertical, Search, Eye, FileDown, Printer, Pencil, Trash2,
    Package, DollarSign, Users, Loader2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ExportPrintDialog, type ExportConfig, type PrintConfig, type ColumnOption } from "@/components/admin/export-print-dialog";

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    whatsapp_number: string;
    quantity: number;
    total_price: number;
    payment_method: string;
    payment_status: string;
    order_status: string;
    delivery_method: string;
    referred_volunteer_id: string | null;
    referred_volunteer_name: string | null;
    delivery_volunteer_id: string | null;
    delivery_volunteer_name: string | null;
    cash_received: number;
    created_at: string;
}

interface Customer {
    id: string;
    phone: string;
    name: string;
    email: string | null;
    whatsapp_number: string | null;
    address: string | null;
    created_at: string;
    is_registered: boolean;
    total_orders: number;
    total_bottles: number;
    total_spent: number;
    orders: Order[];
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

const ORDER_COLUMNS: ColumnOption[] = [
    { key: "id", label: "Order ID", default: true },
    { key: "created_at", label: "Date", default: true },
    { key: "quantity", label: "Qty", default: true },
    { key: "total_price", label: "Total", default: true },
    { key: "order_status", label: "Status", default: true },
    { key: "cash_received", label: "Cash", default: true },
    { key: "payment_method", label: "Payment", default: true },
    { key: "delivery_method", label: "Delivery", default: true },
    { key: "referred_volunteer_name", label: "Referred By", default: true },
    { key: "delivery_volunteer_name", label: "Delivery Vol", default: true },
];

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
});

export default function CustomerDetailPage({ params }: { params: Promise<{ phone: string }> }) {
    const { phone: phoneParam } = use(params);
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(false);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editAddress, setEditAddress] = useState("");
    const [savingCustomer, setSavingCustomer] = useState(false);

    const { data, error, isLoading, mutate } = useSWR(
        `/api/admin/customers/${phoneParam}`,
        fetcher
    );

    const customer: Customer | null = data?.customer || null;

    useEffect(() => {
        if (customer) {
            setEditName(customer.name || "");
            setEditEmail(customer.email || "");
            setEditAddress(customer.address || "");
        }
    }, [customer]);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleWhatsApp = (order: Order) => {
        if (!order.whatsapp_number) return;
        const message = `Assalamu Alaykum,

Thank you for your order with Attar al-Jannah!

Order Status: ${ORDER_STATUSES.find(s => s.value === order.order_status)?.label || order.order_status}
Quantity: ${order.quantity} bottle(s)
Total Price: ₹${order.total_price}

Track your delivery here:
${window.location.origin}/track/${order.id}

جزاك الله خيراً`;

        const encodedMessage = encodeURIComponent(message);
        const cleanNumber = order.whatsapp_number.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanNumber}?text=${encodedMessage}`, "_blank");
    };

    const handleInvoiceDownload = (orderId: string) => {
        window.open(`/admin/orders/${orderId}?action=download`, "_blank");
    };

    const handleInvoicePrint = (orderId: string) => {
        window.open(`/admin/orders/${orderId}?action=print`, "_blank");
    };

    const handleExport = async (config: ExportConfig) => {
        if (!customer) return;

        try {
            const params = new URLSearchParams({ type: "orders", format: config.format });
            
            if (config.columns.length > 0) {
                params.set("columns", config.columns.join(","));
            }

            const orderIds = customer.orders.map(o => o.id).join(",");
            params.set("ids", orderIds);

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
            a.download = `customer_orders_${customer.phone}_${new Date().toISOString().slice(0, 10)}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(`Orders exported as ${config.format.toUpperCase()}`);
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to export orders");
        }
    };

    const handlePrint = (config: PrintConfig) => {
        if (!customer) return;

        let printData = customer.orders;
        
        if (searchQuery) {
            printData = printData.filter(o => 
                o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            printData = printData.filter(o => o.order_status === statusFilter);
        }

        const printWindow = window.open("", "_blank", "width=800,height=600");
        if (!printWindow) {
            toast.error("Unable to open print window");
            return;
        }

        const columns = config.columns || ORDER_COLUMNS.map(c => c.key);
        const headers = columns.map(col => ORDER_COLUMNS.find(c => c.key === col)?.label || col);

        const formatStatus = (status: string) => ORDER_STATUSES.find(s => s.value === status)?.label || status;
        const formatDelivery = (method?: string) => method ? (DELIVERY_METHODS.find(d => d.value === method)?.label || method) : "-";

        let tableRows = printData.map(order => {
            return columns.map(col => {
                let val: any;
                switch (col) {
                    case "id": val = order.id.slice(0, 8); break;
                    case "created_at": val = new Date(order.created_at).toLocaleDateString(); break;
                    case "quantity": val = order.quantity; break;
                    case "total_price": val = `₹${order.total_price}`; break;
                    case "order_status": val = formatStatus(order.order_status); break;
                    case "cash_received": val = order.cash_received ? `₹${order.cash_received}` : "Pending"; break;
                    case "payment_method": val = order.payment_method === 'cod' ? 'COD' : order.payment_method === 'volunteer_cash' ? 'Cash (Vol)' : order.payment_method === 'qr' ? 'UPI' : order.payment_method === 'razorpay' ? 'Razorpay' : "-"; break;
                    case "delivery_method": val = formatDelivery(order.delivery_method); break;
                    case "referred_volunteer_name": val = order.referred_volunteer_name || "-"; break;
                    case "delivery_volunteer_name": val = order.delivery_volunteer_name || "-"; break;
                    default: val = "-";
                }
                return val;
            }).join("</td><td>");
        }).map(row => `<tr><td>${row}</td></tr>`).join("");

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Customer Orders - ${customer.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { margin-bottom: 10px; }
                    .subtitle { color: #666; font-size: 14px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
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
                <h1>${customer.name}</h1>
                <div class="subtitle">Phone: ${customer.phone} • Total Orders: ${customer.total_orders} • Total Spent: ₹${customer.total_spent}</div>
                <div class="meta">
                    <p>Total Records: ${printData.length}</p>
                    <p>Generated: ${new Date().toLocaleString()}</p>
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

    const handleSaveCustomer = async () => {
        setSavingCustomer(true);
        try {
            const response = await fetch(`/api/admin/customers/${phoneParam}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName,
                    email: editEmail || null,
                    address: editAddress || null,
                }),
            });

            if (!response.ok) throw new Error("Failed to update");

            toast.success("Customer updated successfully");
            setEditingCustomer(false);
            mutate();
        } catch (error) {
            console.error("Error updating customer:", error);
            toast.error("Failed to update customer");
        } finally {
            setSavingCustomer(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const response = await fetch(`/api/admin/customers/${phoneParam}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete");

            toast.success("Customer deleted successfully");
            router.push("/admin/customers");
        } catch (error) {
            console.error("Error deleting customer:", error);
            toast.error("Failed to delete customer");
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
            case "confirmed": return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400";
            case "delivered": return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400";
            case "cant_reach": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400";
            case "cancelled": return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";
            default: return "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400";
        }
    };

    const filteredOrders = customer?.orders.filter(order => {
        const matchesSearch = !searchQuery || 
            order.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || order.order_status === statusFilter;
        return matchesSearch && matchesStatus;
    }) || [];

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500">Failed to load customer</p>
                <Button onClick={() => router.push("/admin/customers")} className="mt-4">
                    Back to Customers
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="p-8 text-center">
                <p>Customer not found</p>
                <Button onClick={() => router.push("/admin/customers")} className="mt-4">
                    Back to Customers
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{customer.name}</h1>
                        <p className="text-muted-foreground">
                            {customer.is_registered ? "Registered Customer" : "Guest Customer"} • Joined {new Date(customer.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <ExportPrintDialog
                        options={{
                            type: "orders",
                            columns: ORDER_COLUMNS,
                            data: customer.orders as unknown as Record<string, unknown>[],
                            totalCount: customer.total_orders,
                        }}
                        onExport={handleExport}
                        onPrint={handlePrint}
                    >
                        <Button variant="outline" size="sm" className="rounded-xl gap-2">
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    </ExportPrintDialog>
                    <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => setEditingCustomer(true)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl gap-2 text-destructive hover:text-destructive" onClick={() => setDeleteDialogOpen(true)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-3xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{customer.total_orders}</div>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Bottles</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{customer.total_bottles}</div>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">₹{customer.total_spent.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-3xl">
                <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{customer.phone}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(customer.phone, "Phone")}>
                            <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                    {customer.whatsapp_number && (
                        <div className="flex items-center gap-3">
                            <MessageCircle className="h-4 w-4 text-green-500" />
                            <span className="font-mono">{customer.whatsapp_number}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(customer.whatsapp_number!, "WhatsApp")}>
                                <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={() => {
                                const cleanNumber = customer.whatsapp_number!.replace(/\D/g, '');
                                window.open(`https://wa.me/${cleanNumber}`, "_blank");
                            }}>
                                <MessageCircle className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                    {customer.email && (
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{customer.email}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(customer.email!, "Email")}>
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                    {customer.address && (
                        <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>{customer.address}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-3xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Orders History ({customer.total_orders})</CardTitle>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search orders..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-48"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    {ORDER_STATUSES.map(s => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No orders found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Order ID</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Qty</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Cash</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Payment</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Delivery</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Referred By</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Delivery Vol</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm hover:text-primary">
                                                    {order.id.slice(0, 8)}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div>{new Date(order.created_at).toLocaleDateString()}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-semibold">{order.quantity}</td>
                                            <td className="px-4 py-3 font-semibold text-primary">₹{order.total_price}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                                                    {ORDER_STATUSES.find(s => s.value === order.order_status)?.label || order.order_status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {order.cash_received ? (
                                                    <span className="text-green-600">₹{order.cash_received}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {order.payment_method === 'cod' ? 'COD' : 
                                                 order.payment_method === 'volunteer_cash' ? 'Cash (Vol)' : 
                                                 order.payment_method === 'qr' ? 'UPI' : 
                                                 order.payment_method === 'razorpay' ? 'Razorpay' : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {DELIVERY_METHODS.find(d => d.value === order.delivery_method)?.label || order.delivery_method || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {order.referred_volunteer_name || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {order.delivery_volunteer_name || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleInvoiceDownload(order.id)}>
                                                            <FileDown className="mr-2 h-4 w-4" />Download Invoice
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleInvoicePrint(order.id)}>
                                                            <Printer className="mr-2 h-4 w-4" />Print Invoice
                                                        </DropdownMenuItem>
                                                        {order.whatsapp_number && (
                                                            <DropdownMenuItem onClick={() => handleWhatsApp(order)}>
                                                                <MessageCircle className="mr-2 h-4 w-4 text-green-500" />WhatsApp
                                                            </DropdownMenuItem>
                                                        )}
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

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this customer? Their orders will remain in the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={editingCustomer} onOpenChange={setEditingCustomer}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Edit Customer</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Customer name" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email address" />
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Full address" />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button onClick={handleSaveCustomer} disabled={savingCustomer}>
                            {savingCustomer ? "Saving..." : "Save Changes"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
