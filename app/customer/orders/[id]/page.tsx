"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MessageCircle, Image as ImageIcon, Package } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { useCustomerAuth } from "@/lib/contexts/customer-auth-context";

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
}

export default function CustomerOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useCustomerAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchOrder = useCallback(async () => {
        if (!user?.phone) return;

        try {
            const response = await fetch(`/api/customer/orders?phone=${encodeURIComponent(user.phone)}&orderId=${id}`);
            if (!response.ok) {
                throw new Error("Order not found");
            }
            const data = await response.json();
            setOrder(data.order);
        } catch (error) {
            console.error("Failed to fetch order:", error);
            toast.error("Failed to load order");
            router.push("/customer/dashboard");
        } finally {
            setLoading(false);
        }
    }, [id, user?.phone, router]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

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

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="text-center py-12">Loading order details...</div></div>;
    }

    if (!order) {
        return <div className="min-h-screen flex items-center justify-center"><div className="text-center py-12">Order not found</div></div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-gold-500/10 p-4 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/customer/dashboard">
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

                    {/* Delivery Information */}
                    <Card className="glass-strong rounded-3xl">
                        <CardHeader>
                            <CardTitle>Delivery Information</CardTitle>
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
