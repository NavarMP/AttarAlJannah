"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThankYouPoster } from "@/components/thank-you-poster";
import { OrderBill } from "@/components/order-bill";
import { CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    whatsapp_number: string;
    customer_email: string | null;
    customer_address: string;
    product_name: string;
    quantity: number;
    total_price: number;
    payment_method: string;
    payment_status: string;
    order_status: string;
    created_at: string;
}

function ThanksContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("orderId");
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) {
            setError("No order ID provided");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/orders/${orderId}`);

            if (!response.ok) {
                throw new Error("Order not found");
            }

            const data = await response.json();
            setOrder(data);
        } catch (err) {
            console.error("Error fetching order:", err);
            setError("Failed to load order details");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full glass-strong rounded-3xl">
                    <CardContent className="p-12 text-center">
                        <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading your order details...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full glass-strong rounded-3xl">
                    <CardContent className="p-12 text-center space-y-4">
                        <div className="text-destructive text-6xl">⚠️</div>
                        <h2 className="text-2xl font-bold text-foreground">Order Not Found</h2>
                        <p className="text-muted-foreground">{error || "Unable to find the order"}</p>
                        <Link href="/order">
                            <Button className="rounded-2xl">Place New Order</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Success Header */}
                <Card className="glass border-primary/30 dark:border-primary/20 rounded-3xl">
                    <CardContent className="pt-8 pb-8 text-center space-y-4">
                        <div className="flex justify-center">
                            <CheckCircle2 className="w-20 h-20 text-primary animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold text-foreground">Order Placed Successfully!</h1>
                            <p className="text-lg text-muted-foreground">
                                Thank you for your order, <span className="font-semibold text-primary">{order.customer_name}</span>!
                            </p>
                            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                                Your order has been received and is being processed.
                                Our team will verify your payment and confirm your order soon.
                                You&apos;ll receive updates via phone or WhatsApp.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Personalized Thank You Poster */}
                <div>
                    {/* <h2 className="text-2xl font-bold text-foreground mb-4">Your Personalized Thank You</h2> */}
                    <ThankYouPoster customerName={order.customer_name} />
                </div>

                {/* Order Bill */}
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">Order Details & Invoice</h2>
                    <OrderBill order={order} />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/order" className="flex-1">
                        <Button
                            variant="outline"
                            className="w-full rounded-2xl"
                            size="lg"
                        >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Place Another Order
                        </Button>
                    </Link>
                    <Link href="/" className="flex-1">
                        <Button
                            variant="outline"
                            className="w-full rounded-2xl"
                            size="lg"
                        >
                            Back to Home
                        </Button>
                    </Link>
                </div>

                {/* Footer Note */}
                <Card className="glass-strong rounded-3xl">
                    <CardContent className="p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            💡 <strong>Tip:</strong> Save or bookmark this page for your records.
                            Your order ID is <code className="px-2 py-1 rounded bg-muted text-foreground font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</code>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function ThanksPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full glass-strong rounded-3xl">
                    <CardContent className="p-12 text-center">
                        <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading...</p>
                    </CardContent>
                </Card>
            </div>
        }>
            <ThanksContent />
        </Suspense>
    );
}
