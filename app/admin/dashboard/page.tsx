"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Clock, CheckCircle, DollarSign, CreditCard, QrCode, Pencil, Save } from "lucide-react";
import { MetricToggle } from "@/components/custom/metric-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Stats {
    totalBottles: number;
    totalOrders: number;
    pendingBottles: number;
    pendingOrders: number;
    deliveredBottles: number;
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
    const [paymentMethod, setPaymentMethod] = useState<string>("qr");
    const [togglingPayment, setTogglingPayment] = useState(false);
    const [upiId, setUpiId] = useState("");
    const [merchantName, setMerchantName] = useState("");
    const [editingUpi, setEditingUpi] = useState(false);
    const [savingUpi, setSavingUpi] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchPaymentMethod();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/admin/stats");
            const data = await response.json();
            setStats(data.stats);
            setRecentOrders(data.recentOrders || []);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentMethod = async () => {
        try {
            const response = await fetch("/api/admin/settings");
            const data = await response.json();
            const s = data.settings || {};
            setPaymentMethod(s.payment_method || "qr");
            setUpiId(s.upi_id || "");
            setMerchantName(s.merchant_name || "Attar Al Jannah");
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        }
    };

    const togglePaymentMethod = async () => {
        const newMethod = paymentMethod === "qr" ? "razorpay" : "qr";
        setTogglingPayment(true);
        try {
            const response = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "payment_method", value: newMethod }),
            });
            if (response.ok) {
                setPaymentMethod(newMethod);
                toast.success(`Payment method switched to ${newMethod === "qr" ? "QR Code" : "Razorpay"}`);
            } else {
                toast.error("Failed to update payment method");
            }
        } catch (error) {
            toast.error("Failed to update payment method");
        } finally {
            setTogglingPayment(false);
        }
    };

    const saveUpiSettings = async () => {
        if (!upiId.trim()) {
            toast.error("UPI ID is required");
            return;
        }
        setSavingUpi(true);
        try {
            const updates = [
                fetch("/api/admin/settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: "upi_id", value: upiId.trim() }),
                }),
                fetch("/api/admin/settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: "merchant_name", value: merchantName.trim() }),
                }),
            ];
            const results = await Promise.all(updates);
            if (results.every(r => r.ok)) {
                toast.success("UPI settings saved");
                setEditingUpi(false);
            } else {
                toast.error("Failed to save UPI settings");
            }
        } catch (error) {
            toast.error("Failed to save UPI settings");
        } finally {
            setSavingUpi(false);
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

            {/* Payment Method Toggle */}
            <Card className="rounded-3xl border-2 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-lg">Payment Method</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Active payment method for new orders</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${paymentMethod === "qr"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                        }`}>
                        {paymentMethod === "qr" ? "QR Code" : "Razorpay"}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Button
                            variant={paymentMethod === "qr" ? "default" : "outline"}
                            className={`flex-1 rounded-2xl gap-2 ${paymentMethod === "qr" ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700" : ""}`}
                            onClick={() => paymentMethod !== "qr" && togglePaymentMethod()}
                            disabled={togglingPayment}
                        >
                            <QrCode className="h-4 w-4" />
                            QR Code
                        </Button>
                        <Button
                            variant={paymentMethod === "razorpay" ? "default" : "outline"}
                            className={`flex-1 rounded-2xl gap-2 ${paymentMethod === "razorpay" ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" : ""}`}
                            onClick={() => paymentMethod !== "razorpay" && togglePaymentMethod()}
                            disabled={togglingPayment}
                        >
                            <CreditCard className="h-4 w-4" />
                            Razorpay
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* UPI Settings (visible when QR is active) */}
            {paymentMethod === "qr" && (
                <Card className="rounded-3xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-lg">UPI Settings</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Configure UPI details for dynamic QR generation</p>
                        </div>
                        {!editingUpi ? (
                            <Button variant="ghost" size="icon" onClick={() => setEditingUpi(true)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={saveUpiSettings}
                                disabled={savingUpi}
                            >
                                <Save className="h-4 w-4" />
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="upiId" className="text-sm">UPI ID *</Label>
                            <Input
                                id="upiId"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                placeholder="yourname@upi"
                                disabled={!editingUpi}
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="merchantName" className="text-sm">Merchant Name</Label>
                            <Input
                                id="merchantName"
                                value={merchantName}
                                onChange={(e) => setMerchantName(e.target.value)}
                                placeholder="Your Store Name"
                                disabled={!editingUpi}
                            />
                        </div>
                        {editingUpi && (
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 rounded-2xl"
                                    onClick={saveUpiSettings}
                                    disabled={savingUpi}
                                >
                                    {savingUpi ? "Saving..." : "Save Settings"}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-2xl"
                                    onClick={() => {
                                        setEditingUpi(false);
                                        fetchPaymentMethod(); // Reset to saved values
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                        {!editingUpi && upiId && (
                            <p className="text-xs text-muted-foreground">
                                QR codes will be generated with: <code className="bg-muted px-1 rounded">{upiId}</code>
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Recent Orders */}
            <Card className="rounded-3xl">
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    {!recentOrders || recentOrders.length === 0 ? (
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
