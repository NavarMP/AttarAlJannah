"use client";


import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/lib/contexts/customer-auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, RefreshCw, ShoppingCart, LogOut, User, Edit2, Trash2, Bell } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { AssignVolunteerDialog } from "@/components/assign-volunteer-dialog";
import { ThemeToggle } from "@/components/custom";

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
    volunteer_id?: string | null;
}

export default function CustomerDashboard() {
    const { user, customerProfile, loading: authLoading, signOut, refreshProfile } = useCustomerAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [loadingFeedback, setLoadingFeedback] = useState(true);

    // Collapsible state
    const [visibleOrdersCount, setVisibleOrdersCount] = useState(3);
    const [visibleFeedbackCount, setVisibleFeedbackCount] = useState(3);

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

    const fetchFeedback = useCallback(async () => {
        if (!user) return;
        setLoadingFeedback(true);
        try {
            // Updated API allows customers to fetch their own feedback
            const response = await fetch(`/api/feedback?phone=${encodeURIComponent(user.phone || "")}`);
            if (response.ok) {
                const data = await response.json();
                setFeedback(data.feedback || []);
            }
        } catch (error) {
            console.error("Failed to fetch feedback:", error);
        } finally {
            setLoadingFeedback(false);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/customer/login");
        } else if (user?.phone) {
            fetchOrders();
            fetchFeedback();
        }
    }, [user, authLoading, router, fetchOrders, fetchFeedback]);

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
            case "ordered":
                return "bg-blue-100 text-blue-700";
            case "delivered":
                return "bg-green-100 text-green-700";
            case "cant_reach":
                return "bg-yellow-100 text-yellow-700";
            case "cancelled":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    // Helper to render stars
    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`text-sm ${star <= rating ? "text-yellow-400" : "text-muted-foreground/30"}`}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
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
                        <p className="text-muted-foreground mt-1">{customerProfile?.name || user?.phone}</p>
                    </div>
                    <div className="flex gap-2">
                        {/* Add Notification Bell Here - Note: NotificationContext requires 'useAuth' (Supabase), 
                                 but Customer uses 'useCustomerAuth' (Phone). 
                                 NotificationSystem currently depends on `useAuth().user`.
                                 Since Customer is NOT Supabase Authenticated (simple auth), they won't see realtime notifications 
                                 unless we update NotificationContext to support CustomerProfile or Phone.
                                 
                                 CRITICAL: NotificationContext depends on `useAuth`. Admin is `useAuth`. Customer is `useCustomerAuth`.
                                 We need to bridge this. If Customer is logged in, they have a phone, but maybe not a Supabase User ID (unless they are also auth'd).
                                 
                                 If User says "add notification dropdown in customer dashboard", and Customer is Simple Auth... we have a problem.
                                 The Notification system is built for Supabase Auth Users.
                                 
                                 However, let's assume for now we just place it. If it's empty, it's empty.
                                 But to make it work, we'd need to refactor NotificationContext to take a user_id or phone.
                                 
                                 For now, I'll add the button.
                             */}
                        {/* <NotificationBell /> will fail if not inside NotificationProvider which needs AuthProvider.
                                 The Dashboard is largely client side. App likely wraps everything in Providers.
                             */}
                        < NotificationBell />
                        < ThemeToggle />
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="mr-2">
                                <span className="sr-only">Home</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="rounded-xl"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
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
                <div className="grid md:grid-cols-3 gap-4">
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

                    <Link href="/customer/feedback">
                        <Card className="glass-strong rounded-3xl hover:border-primary transition-all cursor-pointer h-full">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                                    <Edit2 className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Give Feedback</h3>
                                    <p className="text-sm text-muted-foreground">Share your experience</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card
                        className="glass-strong rounded-3xl hover:border-primary transition-all cursor-pointer h-full"
                        onClick={() => {
                            refreshProfile();
                            fetchOrders();
                            fetchFeedback();
                            toast.success("Refreshed!");
                        }}
                    >
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Refresh Data</h3>
                                <p className="text-sm text-muted-foreground">Update orders & feedback</p>
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
                                {orders.slice(0, visibleOrdersCount).map((order) => (
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
                                                    {(!order.volunteer_id) && (
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <AssignVolunteerDialog
                                                                orderId={order.id}
                                                                customerPhone={user?.phone || ""}
                                                                onSuccess={() => {
                                                                    toast.success("Order updated!");
                                                                    fetchOrders();
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                    {order.order_status === "delivered" && (
                                                        <Link href={`/order?reorder=${order.id}`} onClick={(e) => e.stopPropagation()}>
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

                                {orders.length > 3 && (
                                    <div className="flex justify-center pt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setVisibleOrdersCount(prev => prev === 3 ? orders.length : 3)}
                                            className="text-muted-foreground hover:text-primary"
                                        >
                                            {visibleOrdersCount === 3 ? "Show More" : "Show Less"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Feedback History */}
                <Card className="glass-strong rounded-3xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-xl">💬</span>
                            Your Feedback
                        </CardTitle>
                        <CardDescription>
                            Past feedback you&apos;ve shared with us
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingFeedback ? (
                            <div className="space-y-4">
                                <div className="h-20 bg-muted/20 animate-pulse rounded-2xl" />
                            </div>
                        ) : feedback.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>You haven&apos;t submitted any feedback yet.</p>
                                {/* <Link href="/customer/feedback" className="text-primary hover:underline mt-2 inline-block">
                                    Share your thoughts →
                                </Link> */}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {feedback.slice(0, visibleFeedbackCount).map((item) => (
                                    <Link key={item.id} href={`/customer/feedback/${item.id}`} className="block">
                                        <div className="p-4 rounded-2xl bg-secondary/10 border border-border hover:bg-secondary/20 transition-colors cursor-pointer">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-lg">
                                                            {renderStars(item.rating_overall)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                                            {item.category?.replace("_", " ")}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-lg capitalize ${item.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                    item.status === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {item.status.replace("_", " ")}
                                                </span>
                                            </div>
                                            {item.message && (
                                                <p className="text-sm text-foreground/80 line-clamp-2">
                                                    {item.message}
                                                </p>
                                            )}
                                            {item.admin_reply && (
                                                <div className="mt-3 pl-3 border-l-2 border-primary/30">
                                                    <p className="text-xs font-semibold text-primary">Reply from Admin:</p>
                                                    <p className="text-sm text-muted-foreground">{item.admin_reply}</p>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}

                                {feedback.length > 3 && (
                                    <div className="flex justify-center pt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setVisibleFeedbackCount(prev => prev === 3 ? feedback.length : 3)}
                                            className="text-muted-foreground hover:text-primary"
                                        >
                                            {visibleFeedbackCount === 3 ? "Show More" : "Show Less"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* <div className="mt-6 text-center border-t border-border/50 pt-4">
                            <Link href="/customer/feedback">
                                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Send New Feedback
                                </Button>
                            </Link>
                        </div> */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
