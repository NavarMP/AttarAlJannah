"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MessageCircle, Image as ImageIcon, Package } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    whatsapp_number: string;
    customer_email: string;
    customer_address: string;
    product_name: string;
    quantity: number;
    total_price: number;
    payment_method: string;
    payment_status: string;
    order_status: string;
    payment_screenshot_url: string | null;
    created_at: string;
    volunteer_id?: string;
    is_delivery_duty?: boolean;
}

export default function VolunteerOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchOrder = useCallback(async () => {
        const volunteerId = localStorage.getItem("volunteerId");
        if (!volunteerId) {
            router.push("/volunteer/login");
            return;
        }

        try {
            const response = await fetch(`/api/volunteer/orders?volunteerId=${volunteerId}&orderId=${id}`);
            if (!response.ok) {
                throw new Error("Order not found");
            }
            const data = await response.json();
            setOrder(data.order);
        } catch (error) {
            console.error("Failed to fetch order:", error);
            toast.error("Failed to load order");
            router.push("/volunteer/orders");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

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

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="text-center py-12">Loading order details...</div></div>;
    }

    if (!order) {
        return <div className="min-h-screen flex items-center justify-center"><div className="text-center py-12">Order not found</div></div>;
    }

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/volunteer/orders">
                        <Button variant="outline" size="icon" className="rounded-xl">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Order Details</h1>
                        <p className="text-muted-foreground">Order ID: {order.id.slice(0, 8)}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Order Information */}
                    <Card className="glass-strong rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Order Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Product</p>
                                <p className="font-medium">{order.product_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Quantity</p>
                                <p className="font-medium">{order.quantity} bottle(s)</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Price</p>
                                <p className="text-2xl font-bold text-primary">₹{order.total_price}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Payment Method</p>
                                <p className="font-medium capitalize">{order.payment_method}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                                    {order.order_status}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Order Date</p>
                                <p className="font-medium">
                                    {new Date(order.created_at).toLocaleString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Actions */}
                    {order.volunteer_id && order.is_delivery_duty && (
                        <Card className="glass-strong rounded-3xl md:col-span-2 border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Delivery Management
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    You are assigned to deliver this order.
                                </p>
                                {order.order_status === 'ordered' && (
                                    <div className="flex flex-wrap gap-4">
                                        <Button
                                            onClick={async () => {
                                                try {
                                                    const volunteerId = localStorage.getItem("volunteerId");
                                                    if (!volunteerId) return;

                                                    const response = await fetch(`/api/volunteer/orders/${order.id}/status`, {
                                                        method: "PATCH",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            volunteerId: volunteerId, // Passing ID instead of UUID for now as API handles lookup
                                                            newStatus: "delivered"
                                                        }),
                                                    });

                                                    if (!response.ok) throw new Error("Failed to update");
                                                    const data = await response.json();

                                                    toast.success(`Marked as delivered! Commission earned: ₹${data.commission}`);
                                                    fetchOrder();
                                                } catch (error) {
                                                    console.error(error);
                                                    toast.error("Failed to update status");
                                                }
                                            }}
                                            className="bg-green-600 hover:bg-green-700 rounded-xl flex-1"
                                        >
                                            Mark Delivered
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={async () => {
                                                try {
                                                    const volunteerId = localStorage.getItem("volunteerId");
                                                    if (!volunteerId) return;

                                                    const response = await fetch(`/api/volunteer/orders/${order.id}/status`, {
                                                        method: "PATCH",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            volunteerId: volunteerId,
                                                            newStatus: "cant_reach"
                                                        }),
                                                    });

                                                    if (!response.ok) throw new Error("Failed to update");

                                                    toast.success("Marked as Can't Reach");
                                                    fetchOrder();
                                                } catch (error) {
                                                    console.error(error);
                                                    toast.error("Failed to update status");
                                                }
                                            }}
                                            className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 rounded-xl flex-1"
                                        >
                                            Can&apos;t Reach Customer
                                        </Button>
                                    </div>
                                )}
                                {order.order_status === 'delivered' && (
                                    <div className="p-3 bg-green-100 text-green-800 rounded-xl text-center font-medium">
                                        Delivered Successfully
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Customer Information */}
                    <Card className="glass-strong rounded-3xl">
                        <CardHeader>
                            <CardTitle>Customer Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-medium">{order.customer_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium">{order.customer_phone}</p>
                                    <a href={`tel:${order.customer_phone}`}>
                                        <Button variant="outline" size="sm" className="rounded-xl h-7">
                                            <Phone className="h-3 w-3" />
                                        </Button>
                                    </a>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">WhatsApp</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium">{order.whatsapp_number}</p>
                                    <a
                                        href={`https://wa.me/91${order.whatsapp_number}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button variant="outline" size="sm" className="rounded-xl h-7">
                                            <MessageCircle className="h-3 w-3" />
                                        </Button>
                                    </a>
                                </div>
                            </div>
                            {order.customer_email && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{order.customer_email}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">Delivery Address</p>
                                <p className="font-medium">{order.customer_address}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Screenshot */}
                {order.payment_screenshot_url && (
                    <Card className="glass-strong rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                Payment Screenshot
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-full max-w-md h-96 rounded-2xl overflow-hidden border-2 border-border mx-auto">
                                <Image
                                    src={order.payment_screenshot_url}
                                    alt="Payment screenshot"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
