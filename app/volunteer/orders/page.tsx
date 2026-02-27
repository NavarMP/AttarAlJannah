"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
    DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Package, ArrowLeft, Search, Trash2, MoreVertical, Eye, Edit2,
    Phone, Copy, Download
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionBar, BulkAction } from "@/components/admin/bulk-action-bar";

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    product_name: string;
    quantity: number;
    total_price: number;
    payment_method: string;
    payment_status: string;
    order_status: string;
    created_at: string;
}

const ORDER_STATUSES = [
    { label: "Confirmed", value: "confirmed" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancel", value: "cancelled" },
];

export default function VolunteerOrdersPage() {
    const router = useRouter();
    const [volunteerId, setVolunteerId] = useState("");
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sort, setSort] = useState("newest");

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Bulk state
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [bulkProcessing, setBulkProcessing] = useState(false);

    useEffect(() => {
        const id = localStorage.getItem("volunteerId");
        if (!id) {
            router.push("/volunteer/login");
            return;
        }
        setVolunteerId(id);
        fetchOrders(id);
    }, [router]);

    const fetchOrders = async (id: string) => {
        try {
            const response = await fetch(`/api/volunteer/orders?volunteerId=${id}`);
            if (!response.ok) throw new Error("Failed to fetch orders");
            const data = await response.json();
            setOrders(data.orders || []);
            setFilteredOrders(data.orders || []);
        } catch (error) {
            toast.error("Failed to load orders");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter + sort
    useEffect(() => {
        let filtered = orders;

        if (search) {
            filtered = filtered.filter(order =>
                order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                order.customer_phone.includes(search) ||
                order.id.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(order => order.order_status === statusFilter);
        }

        filtered = [...filtered].sort((a, b) => {
            switch (sort) {
                case "oldest":
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case "amount_high":
                    return b.total_price - a.total_price;
                case "amount_low":
                    return a.total_price - b.total_price;
                case "newest":
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });

        setFilteredOrders(filtered);
        setSelectedOrders(new Set());
    }, [search, statusFilter, sort, orders]);

    // ==== Individual actions ====

    const handleDelete = async () => {
        if (!orderToDelete) return;
        setDeleting(true);
        try {
            const response = await fetch(`/api/orders/delete?orderId=${orderToDelete.id}&phone=${volunteerId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete order");
            }
            toast.success("Order deleted successfully");
            setDeleteDialogOpen(false);
            setOrderToDelete(null);
            if (volunteerId) fetchOrders(volunteerId);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete order");
        } finally {
            setDeleting(false);
        }
    };

    const handleStatusChange = async (orderId: string, status: string) => {
        try {
            const response = await fetch(`/api/volunteer/orders/${orderId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, volunteerId }),
            });
            if (response.ok) {
                toast.success(`Status updated to ${status}`);
                if (volunteerId) fetchOrders(volunteerId);
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to update status");
            }
        } catch {
            toast.error("Failed to update status");
        }
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleEditOrder = (orderId: string) => {
        router.push(`/order?ref=${volunteerId}&edit=${orderId}`);
    };

    // ==== Selection helpers ====

    const toggleOrderSelection = (orderId: string) => {
        const newSelection = new Set(selectedOrders);
        if (newSelection.has(orderId)) newSelection.delete(orderId);
        else newSelection.add(orderId);
        setSelectedOrders(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedOrders.size === filteredOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
        }
    };

    // ==== Bulk actions config ====

    const bulkActions: BulkAction[] = [
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
                    const promises = Array.from(selectedOrders).map(orderId =>
                        fetch(`/api/orders/delete?orderId=${orderId}&phone=${volunteerId}`, {
                            method: "DELETE",
                        })
                    );
                    const results = await Promise.all(promises);
                    const successCount = results.filter(r => r.ok).length;
                    if (successCount > 0) {
                        toast.success(`Deleted ${successCount} order(s)`);
                        setSelectedOrders(new Set());
                        if (volunteerId) fetchOrders(volunteerId);
                    } else {
                        toast.error("Failed to delete orders");
                    }
                } catch {
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
            case "confirmed":
            case "pending":
                return "bg-orange-100 text-orange-800 dark:bg-yellow-950/40 dark:text-yellow-400";
            case "delivered":
                return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400";
            case "cancelled":
                return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400";
        }
    };

    const getStatusLabel = (status: string) => {
        return ORDER_STATUSES.find(s => s.value === status)?.label || status.charAt(0).toUpperCase() + status.slice(1);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading orders...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold">My Orders</h1>
                        <p className="text-muted-foreground">Manage your customer orders • {orders.length} total</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push("/volunteer/dashboard")}
                            className="rounded-xl"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Dashboard
                        </Button>
                        <Button
                            onClick={() => router.push(`/order?ref=${volunteerId}`)}
                            className="rounded-xl"
                        >
                            New Order
                        </Button>
                    </div>
                </div>

                {/* Search and Filter */}
                <Card className="p-4 rounded-3xl">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by customer name, phone, or Order ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                {ORDER_STATUSES.map(s => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={sort} onValueChange={setSort}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                                <SelectItem value="amount_high">Amount (High-Low)</SelectItem>
                                <SelectItem value="amount_low">Amount (Low-High)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {/* Orders Table */}
                <Card className="rounded-3xl overflow-hidden">
                    {filteredOrders.length === 0 ? (
                        <CardContent className="py-12 text-center">
                            <Package className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                            <p className="text-lg text-muted-foreground">
                                {orders.length === 0 ? "No orders yet" : "No orders match your search"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Start adding customer orders to see them here
                            </p>
                            <Button className="mt-6 rounded-xl" onClick={() => router.push(`/order?ref=${volunteerId}`)}>
                                Create Order with Referral
                            </Button>
                        </CardContent>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-4 text-left">
                                            <Checkbox
                                                checked={filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length}
                                                onCheckedChange={toggleSelectAll}
                                                aria-label="Select all orders"
                                            />
                                        </th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold">Customer</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold">Phone</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold">Product</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold">Qty</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold">Total</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold">Payment</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold">Status</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold">Date</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredOrders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className={`hover:bg-muted/30 transition-colors cursor-pointer ${selectedOrders.has(order.id) ? 'bg-primary/5' : ''}`}
                                            onClick={() => router.push(`/volunteer/orders/${order.id}`)}
                                        >
                                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedOrders.has(order.id)}
                                                    onCheckedChange={() => toggleOrderSelection(order.id)}
                                                    aria-label={`Select order for ${order.customer_name}`}
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-medium">{order.customer_name}</p>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-muted-foreground">
                                                {order.customer_phone}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                {order.product_name}
                                            </td>
                                            <td className="px-4 py-4">{order.quantity}</td>
                                            <td className="px-4 py-4 font-semibold text-primary">
                                                ₹{order.total_price.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm">{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method === 'volunteer_cash' ? 'Cash (Volunteer)' : order.payment_method === 'qr' ? 'UPI' : order.payment_method === 'razorpay' ? 'Razorpay' : order.payment_method}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                                                    {getStatusLabel(order.order_status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52">
                                                        <DropdownMenuItem onClick={() => router.push(`/volunteer/orders/${order.id}`)}>
                                                            <Eye className="mr-2 h-4 w-4" />View Details
                                                        </DropdownMenuItem>
                                                        {order.order_status === "confirmed" && (
                                                            <DropdownMenuItem onClick={() => handleEditOrder(order.id)}>
                                                                <Edit2 className="mr-2 h-4 w-4" />Edit Order
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger>
                                                                <Package className="mr-2 h-4 w-4" />Change Status
                                                            </DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent>
                                                                {ORDER_STATUSES.map(s => (
                                                                    <DropdownMenuItem
                                                                        key={s.value}
                                                                        onClick={() => handleStatusChange(order.id, s.value)}
                                                                        disabled={order.order_status === s.value}
                                                                    >
                                                                        {s.label}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleCopy(order.customer_phone, "Phone number")}>
                                                            <Phone className="mr-2 h-4 w-4" />Copy Phone
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setOrderToDelete(order);
                                                                setDeleteDialogOpen(true);
                                                            }}
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
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this order for {orderToDelete?.customer_name}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                            {deleting ? "Deleting..." : "Delete Order"}
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
        </main>
    );
}
