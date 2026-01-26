"use client";


import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/lib/contexts/customer-auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, RefreshCw, ShoppingCart, LogOut, User, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    product_name: string;
    quantity: number;
    total_price: number;
    order_status: string;
    payment_method: string;
    created_at: string;
}

export default function CustomerDashboard() {
    const { user, customerProfile, loading: authLoading, signOut, refreshProfile } = useCustomerAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchOrders = useCallback(async () => {
        if (!user?.phone) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/customer/orders?phone=${encodeURIComponent(user.phone)}`);
            const data = await response.json();
            setOrders(data.orders || []);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    }, [user?.phone]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/customer/login");
        } else if (user?.phone) {
            fetchOrders();
        }
    }, [user, authLoading, router, fetchOrders]);

    const handleLogout = async () => {
        try {
            await signOut();
            toast.success("Logged out successfully");
            router.push("/");
        } catch (error) {
            toast.error("Failed to log out");
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch(`/api/orders/delete?orderId=${orderId}&phone=${encodeURIComponent(user?.phone || '')}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete order");
            }

            toast.success("Order deleted successfully");
            fetchOrders(); // Refresh the orders list
        } catch (error: any) {
            toast.error(error.message || "Failed to delete order");
            console.error(error);
        }
    };

    const handleEditOrder = (orderId: string) => {
        router.push(`/order?edit=${orderId}`);
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

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-gold-500/10 p-4 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold-500">
                            Welcome Back!
                        </h1>
                        <p className="text-muted-foreground mt-1">{user.phone}</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="rounded-xl"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>

                {/* Profile Summary */}
                {customerProfile && (
                    <Card className="glass-strong rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Your Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-medium">{customerProfile.name || "Not set"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Orders</p>
                                <p className="font-medium text-2xl text-primary">{customerProfile.total_orders}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Last Order</p>
                                <p className="font-medium">
                                    {customerProfile.last_order_at
                                        ? new Date(customerProfile.last_order_at).toLocaleDateString()
                                        : "No orders yet"
                                    }
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-4">
                    <Link href={`/order?phone=${encodeURIComponent(user?.phone || '')}`}>
                        <Card className="glass-strong rounded-3xl hover:border-primary transition-all cursor-pointer h-full">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-gold-500/20 flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Place New Order</h3>
                                    <p className="text-sm text-muted-foreground">Order with saved details</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card
                        className="glass-strong rounded-3xl hover:border-primary transition-all cursor-pointer h-full"
                        onClick={() => {
                            refreshProfile();
                            fetchOrders();
                            toast.success("Refreshed!");
                        }}
                    >
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Refresh Orders</h3>
                                <p className="text-sm text-muted-foreground">Update order status</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Orders List */}
                <Card className="glass-strong rounded-3xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Your Orders
                        </CardTitle>
                        <CardDescription>
                            {orders.length} order{orders.length !== 1 ? 's' : ''} found
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-2xl border border-border/50" />
                                ))}
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                                <p className="text-muted-foreground mb-4">No orders yet</p>
                                <Link href="/order">
                                    <Button className="bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl">
                                        Place Your First Order
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div
                                        key={order.id}
                                        onClick={() => router.push(`/customer/orders/${order.id}`)}
                                        className="p-4 rounded-2xl border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{order.product_name}</h3>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                                                        {order.order_status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Quantity: {order.quantity} • {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    Payment: {order.payment_method}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-primary">₹{order.total_price}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {order.order_status === "pending" && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleEditOrder(order.id)}
                                                                className="rounded-xl"
                                                            >
                                                                <Edit2 className="w-4 h-4 mr-1" />
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDeleteOrder(order.id)}
                                                                className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-1" />
                                                                Delete
                                                            </Button>
                                                        </>
                                                    )}
                                                    {order.order_status === "delivered" && (
                                                        <Link href={`/order?reorder=${order.id}`}>
                                                            <Button variant="outline" size="sm" className="rounded-xl">
                                                                <RefreshCw className="w-4 h-4 mr-1" />
                                                                Reorder
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Back to Home */}
                <div className="text-center">
                    <Link href="/">
                        <Button variant="ghost" className="rounded-xl">
                            ← Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
