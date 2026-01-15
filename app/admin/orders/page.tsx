"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    whatsapp_number: string;
    total_price: number;
    quantity: number;
    payment_method: string;
    order_status: string;
    created_at: string;
    referred_by?: string;
    volunteer_name?: string;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState(""); // For debouncing
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1); // Reset to first page on search
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                status: statusFilter,
                search: search,
                page: page.toString(),
            });

            console.log("Fetching orders with search:", search);
            const response = await fetch(`/api/admin/orders?${queryParams}`);
            const data = await response.json();

            setOrders(data.orders || []);
            setTotalCount(data.totalCount || 0);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, search]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

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
                fetchOrders(); // Refresh the list
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400";
            case "confirmed":
                return "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400";
            case "delivered":
                return "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400";
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Orders</h1>
                <p className="text-muted-foreground">Manage all customer orders</p>
            </div>

            {/* Filters */}
            <Card className="p-4 rounded-3xl">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by customer name, phone, or Order ID..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-48"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="delivered">Delivered</option>
                    </Select>
                </div>
            </Card>

            {/* Orders Table */}
            <Card className="rounded-3xl overflow-hidden">
                {loading ? (
                    <div className="text-center py-12">Loading orders...</div>
                ) : !orders || orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No orders found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Volunteer</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Quantity</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Total</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Payment</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        onClick={() => window.location.href = `/admin/orders/${order.id}`}
                                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <p className="font-medium">{order.customer_name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {order.customer_phone}
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.volunteer_name ? (
                                                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                    {order.volunteer_name}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{order.quantity}</td>
                                        <td className="px-6 py-4 font-semibold text-primary">
                                            ₹{order.total_price}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm capitalize">{order.payment_method}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                                                {order.order_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {order.order_status === 'pending' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.location.href = `/admin/orders/${order.id}`;
                                                        }}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                                        title="Edit Order"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                            <path d="m15 5 4 4" />
                                                        </svg>
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOrderToDelete(order);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
        </div>
    );
}
