"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Clock, CheckCircle, DollarSign } from "lucide-react";

interface Stats {
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
}

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    total_price: number;
    order_status: string;
    created_at: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/admin/stats");
            const data = await response.json();
            setStats(data.stats);
            setRecentOrders(data.recentOrders);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your store</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-3xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Orders
                        </CardTitle>
                        <Package className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.totalOrders || 0}</div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pending
                        </CardTitle>
                        <Clock className="h-5 w-5 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.pendingOrders || 0}</div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Delivered
                        </CardTitle>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.deliveredOrders || 0}</div>
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

            {/* Recent Orders */}
            <Card className="rounded-3xl">
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentOrders.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No orders yet</p>
                    ) : (
                        <div className="space-y-4">
                            {recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    onClick={() => window.location.href = `/admin/orders/${order.id}`}
                                    className="flex items-center justify-between p-4 rounded-2xl border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                                >
                                    <div>
                                        <p className="font-medium">{order.customer_name}</p>
                                        <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary">₹{order.total_price}</p>
                                        <p className="text-sm text-muted-foreground capitalize">{order.order_status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
