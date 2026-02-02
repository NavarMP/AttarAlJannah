"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { DeliveryRequest, Order } from "@/types";

interface DeliveryDashboardProps {
    volunteerId: string; //String ID for API calls
}

export function DeliveryDashboard({ volunteerId }: DeliveryDashboardProps) {
    const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
    const [myRequests, setMyRequests] = useState<DeliveryRequest[]>([]);
    const [myDeliveries, setMyDeliveries] = useState<Order[]>([]);
    const [deliveryStats, setDeliveryStats] = useState({
        totalDeliveries: 0,
        totalCommission: 0,
        commissionPerBottle: 10,
    });
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState<string | null>(null);

    const fetchDeliveryData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch available orders (ordered status, no delivery volunteer)
            const ordersRes = await fetch(`/api/volunteer/orders?volunteerId=${volunteerId}&status=ordered&unassigned=true`);
            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                setAvailableOrders(ordersData.orders || []);
            }

            // Fetch volunteer's delivery requests
            const requestsRes = await fetch(`/api/volunteer/delivery-requests?volunteerId=${volunteerId}`);
            if (requestsRes.ok) {
                const requestsData = await requestsRes.json();
                setMyRequests(requestsData.requests || []);
            }

            // Fetch assigned deliveries (orders where this volunteer is delivery_volunteer_id)
            const deliveriesRes = await fetch(`/api/volunteer/orders?volunteerId=${volunteerId}&deliveryAssigned=true`);
            if (deliveriesRes.ok) {
                const deliveriesData = await deliveriesRes.json();
                setMyDeliveries(deliveriesData.orders || []);
            }

            // Fetch volunteer stats for delivery commission
            const statsRes = await fetch(`/api/volunteer/stats?volunteerId=${volunteerId}`);
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setDeliveryStats({
                    totalDeliveries: statsData.total_deliveries || 0,
                    totalCommission: statsData.total_delivery_commission || 0,
                    commissionPerBottle: statsData.delivery_commission_per_bottle || 10,
                });
            }
        } catch (error) {
            console.error("Error fetching delivery data:", error);
            toast.error("Failed to load delivery data");
        } finally {
            setLoading(false);
        }
    }, [volunteerId]);

    useEffect(() => {
        fetchDeliveryData();
    }, [fetchDeliveryData]);

    const handleRequestDelivery = async (orderId: string) => {
        try {
            setRequesting(orderId);
            const response = await fetch("/api/volunteer/delivery-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, volunteerId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to request delivery");
            }

            toast.success("Delivery request submitted successfully!");
            fetchDeliveryData(); // Refresh data
        } catch (error: any) {
            toast.error(error.message || "Failed to request delivery");
        } finally {
            setRequesting(null);
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: "delivered" | "cant_reach") => {
        try {
            const response = await fetch(`/api/volunteer/orders/${orderId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ volunteerId, newStatus }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update status");
            }

            const result = await response.json();
            if (newStatus === "delivered" && result.commission) {
                toast.success(`Order delivered! You earned ₹${result.commission.earned}`);
            } else {
                toast.success("Order status updated successfully");
            }

            fetchDeliveryData(); // Refresh data
        } catch (error: any) {
            toast.error(error.message || "Failed to update status");
        }
    };

    const getRequestStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
            case "approved":
                return <Badge variant="outline" className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
            case "rejected":
                return <Badge variant="outline" className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return <div className="text-center py-6">Loading delivery information...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Delivery Stats */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Truck className="w-5 h-5 text-blue-500" />
                            Total Deliveries
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{deliveryStats.totalDeliveries}</p>
                        <p className="text-sm text-muted-foreground">Orders delivered</p>
                    </CardContent>
                </Card>

                <Card className="glass border-gold-300 dark:border-gold-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <DollarSign className="w-5 h-5 text-gold-500" />
                            Earned Commission
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-gold-500">₹{deliveryStats.totalCommission}</p>
                        <p className="text-sm text-muted-foreground">Total earned from deliveries</p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Package className="w-5 h-5 text-emerald-500" />
                            Commission
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-emerald-500">₹{deliveryStats.commissionPerBottle}</p>
                        <p className="text-sm text-muted-foreground">Per bottle delivered</p>
                    </CardContent>
                </Card>
            </div>

            {/* My Assigned Deliveries */}
            {myDeliveries.length > 0 && (
                <Card className="glass-strong">
                    <CardHeader>
                        <CardTitle>My Assigned Deliveries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {myDeliveries.map((order) => (
                                <div key={order.id} className="p-4 border rounded-lg bg-card/50 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{order.customer_name}</p>
                                            <p className="text-sm text-muted-foreground">{order.quantity} bottles</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {order.customer_address.substring(0, 50)}...
                                            </p>
                                        </div>
                                        <Badge className={order.order_status === "ordered" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                                            {order.order_status}
                                        </Badge>
                                    </div>

                                    {order.order_status === "ordered" && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdateStatus(order.id, "delivered")}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                Mark Delivered
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleUpdateStatus(order.id, "cant_reach")}
                                            >
                                                Can&apos;t Reach
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* My Delivery Requests */}
            {myRequests.length > 0 && (
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>My Delivery Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {myRequests.map((request) => (
                                <div key={request.id} className="p-3 border rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">
                                            {request.orders?.customer_name || "Order"} - {request.orders?.quantity} bottles
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Requested: {new Date(request.requested_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {getRequestStatusBadge(request.status)}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Available Orders */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Available for Delivery</CardTitle>
                    <p className="text-sm text-muted-foreground">Request delivery duty for these orders</p>
                </CardHeader>
                <CardContent>
                    {availableOrders.length === 0 ? (
                        <p className="text-center text-muted-foreground py-6">No available orders at the moment</p>
                    ) : (
                        <div className="space-y-3">
                            {availableOrders.map((order) => (
                                <div key={order.id} className="p-4 border rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{order.customer_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {order.quantity} bottles • ₹{order.total_price}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {order.customer_address.substring(0, 60)}...
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => handleRequestDelivery(order.id)}
                                        disabled={requesting === order.id}
                                        size="sm"
                                    >
                                        {requesting === order.id ? "Requesting..." : "Request Delivery"}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
