"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

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
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                ...(statusFilter !== "all" && { status: statusFilter }),
                ...(search && { search }),
            });

            const response = await fetch(`/api/admin/orders?${params}`);
            const data = await response.json();
            setOrders(data.orders);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, search]);

    useEffect(() => {
        fetchOrders();
    }, [search, statusFilter, page, fetchOrders]);

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
                            placeholder="Search by customer name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
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
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No orders found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Quantity</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Total</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Payment</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
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
        </div>
    );
}
