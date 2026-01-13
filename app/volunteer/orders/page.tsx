"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, CheckCircle2, Clock, XCircle, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

export default function VolunteerOrdersPage() {
    const router = useRouter();
    const [volunteerId, setVolunteerId] = useState("");
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
        } catch (error) {
            toast.error("Failed to load orders");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
            return;
        }

        try {
            // Use volunteer ID for authentication
            const response = await fetch(`/api/orders/delete?orderId=${orderId}&phone=${volunteerId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete order");
            }

            toast.success("Order deleted successfully");
            if (volunteerId) fetchOrders(volunteerId); // Refresh the orders list
        } catch (error: any) {
            toast.error(error.message || "Failed to delete order");
            console.error(error);
        }
    };

    const handleEditOrder = (orderId: string) => {
        // Edit via main order page with edit parameter
        router.push(`/order?ref=${volunteerId}&edit=${orderId}`);
    };

    const getStatusIcon = (paymentStatus: string, orderStatus: string) => {
        if (paymentStatus === "verified" && orderStatus === "delivered") {
            return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
        } else if (orderStatus === "cancelled") {
            return <XCircle className="w-5 h-5 text-red-500" />;
        }
        return <Clock className="w-5 h-5 text-yellow-500" />;
    };

    const getStatusText = (paymentStatus: string, orderStatus: string) => {
        if (paymentStatus === "verified" && orderStatus === "delivered") {
            return "Completed";
        } else if (orderStatus === "cancelled") {
            return "Cancelled";
        }
        return "Pending";
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
                <div className="space-y-3">
                    <h1 className="text-4xl font-bold text-foreground">My Orders</h1>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push("/volunteer/dashboard")}
                            className="rounded-2xl w-fit"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>
                </div>

                {/* Orders List */}
                {orders.length === 0 ? (
                    <Card className="glass-strong">
                        <CardContent className="py-12 text-center">
                            <Package className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                            <p className="text-lg text-muted-foreground">No orders yet</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Start adding customer orders to see them here
                            </p>
                            <Button
                                className="mt-6"
                                onClick={() => router.push(`/order?ref=${volunteerId}`)}
                            >
                                Create Order with Referral
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Card
                                key={order.id}
                                onClick={() => router.push(`/volunteer/orders/${order.id}`)}
                                className="glass hover:border-primary/50 transition-colors cursor-pointer"
                            >
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-3">
                                                {getStatusIcon(order.payment_status, order.order_status)}
                                                <div>
                                                    <h3 className="font-semibold text-lg">{order.customer_name}</h3>
                                                    <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Product:</span>
                                                    <p className="font-medium">{order.product_name}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Quantity:</span>
                                                    <p className="font-medium">{order.quantity}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Payment:</span>
                                                    <p className="font-medium uppercase">{order.payment_method}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Date:</span>
                                                    <p className="font-medium">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-primary">
                                                    ₹{order.total_price.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusText(order.payment_status, order.order_status) === "Completed"
                                                ? "bg-emerald-500/20 text-emerald-500"
                                                : getStatusText(order.payment_status, order.order_status) === "Cancelled"
                                                    ? "bg-red-500/20 text-red-500"
                                                    : "bg-yellow-500/20 text-yellow-500"
                                                }`}>
                                                {getStatusText(order.payment_status, order.order_status)}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
