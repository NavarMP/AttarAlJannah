"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Phone, MessageCircle, Image as ImageIcon } from "lucide-react";
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
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState("");

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const response = await fetch(`/api/admin/orders/${id}`);
            if (!response.ok) {
                throw new Error("Order not found");
            }
            const data = await response.json();
            setOrder(data);
            setNewStatus(data.order_status);
        } catch (error) {
            console.error("Failed to fetch order:", error);
            toast.error("Failed to load order");
            router.push("/admin/orders");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!order || newStatus === order.order_status) return;

        setUpdating(true);
        try {
            const response = await fetch(`/api/admin/orders/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order_status: newStatus }),
            });

            if (!response.ok) throw new Error("Failed to update");

            toast.success("Order status updated successfully");
            fetchOrder();
        } catch (error) {
            console.error("Failed to update order:", error);
            toast.error("Failed to update order");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading order details...</div>;
    }

    if (!order) {
        return <div className="text-center py-12">Order not found</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center gap-4">
                <Link href="/admin/orders">
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
                {/* Customer Information */}
                <Card className="rounded-3xl">
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
                                    <Button variant="outline" size="sm" className="rounded-xl">
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
                                    <Button variant="outline" size="sm" className="rounded-xl">
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
                            <p className="text-sm text-muted-foreground">Address</p>
                            <p className="font-medium">{order.customer_address}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Information */}
                <Card className="rounded-3xl">
                    <CardHeader>
                        <CardTitle>Order Information</CardTitle>
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
                            <p className="text-sm text-muted-foreground">Order Date</p>
                            <p className="font-medium">
                                {new Date(order.created_at).toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Screenshot */}
            {order.payment_screenshot_url && (
                <Card className="rounded-3xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" />
                            Payment Screenshot
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full max-w-md h-96 rounded-2xl overflow-hidden border-2 border-border">
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

            {/* Status Update */}
            <Card className="rounded-3xl">
                <CardHeader>
                    <CardTitle>Update Order Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Order Status</Label>
                        <Select
                            id="status"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                        >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="delivered">Delivered</option>
                        </Select>
                    </div>
                    <Button
                        onClick={handleStatusUpdate}
                        disabled={updating || newStatus === order.order_status}
                        className="bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl"
                    >
                        {updating ? "Updating..." : "Update Status"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
