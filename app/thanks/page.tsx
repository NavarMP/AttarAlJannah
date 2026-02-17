"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrderBill } from "@/components/order-bill";
import { CheckCircle2, Loader2, ShoppingBag, Pencil } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCustomerAuth } from "@/lib/contexts/customer-auth-context";
import { ThankYouPoster } from "@/components/thank-you-poster";
import { AssignVolunteerDialog } from "@/components/assign-volunteer-dialog";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import { AutoHideContainer } from "@/components/custom/auto-hide-container";

// Lazy load heavy components
const LazyOrderBill = dynamic(() => import("@/components/order-bill").then(mod => ({ default: mod.OrderBill })), {
    loading: () => (
        <Card className="glass-strong rounded-3xl">
            <CardContent className="p-12 text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Generating your invoice...</p>
            </CardContent>
        </Card>
    ),
    ssr: false
});

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
    volunteer?: {
        name: string;
        volunteer_id: string; // The readable ID (e.g. VOL-123)
    } | null;
}

function ThanksContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("orderId");
    const { loginWithPhone, user } = useCustomerAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [orderLoading, setOrderLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showBill, setShowBill] = useState(false);

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) {
            setError("No order ID provided");
            setOrderLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/orders/${orderId}`);

            if (!response.ok) {
                throw new Error("Order not found");
            }

            const data = await response.json();
            setOrder(data);

            // Auto-login if not logged in or phone doesn't match
            if (data.customer_phone && (!user || user.phone !== data.customer_phone)) {
                console.log("Auto-logging in user:", data.customer_phone);
                loginWithPhone(data.customer_phone);
            }

            // Show bill after 500ms
            setTimeout(() => setShowBill(true), 500);
        } catch (err) {
            console.error("Error fetching order:", err);
            setError("Failed to load order details");
        } finally {
            setOrderLoading(false);
        }
    }, [orderId, user, loginWithPhone]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    // Show success message immediately while order loads
    if (!orderId) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full glass-strong rounded-3xl">
                    <CardContent className="p-12 text-center space-y-4">
                        <div className="text-destructive text-6xl">⚠️</div>
                        <h2 className="text-2xl font-bold text-foreground">No Order ID</h2>
                        <p className="text-muted-foreground">Please place an order first</p>
                        <Link href="/order">
                            <Button className="rounded-2xl">Place New Order</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        
        <div className="min-h-screen flex items-center justify-center px-4">
            <AutoHideContainer className="fixed top-6 right-6 z-50 flex gap-2">
                <ThemeToggle />
                <Link href="/">
                    <Button variant="ghost" size="icon" className="mr-2">
                        <span className="sr-only">Home</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    </Button>
                </Link>
                <Link href="/customer/dashboard">
                    <Button className="bg-gradient-to-r from-primary/10 to-gold-500/10 hover:from-primary/20 hover:to-gold-500/20 border border-primary/20 rounded-xl">
                        Customer Dashboard
                    </Button>
                </Link>
            </AutoHideContainer>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Success Header - Shows Immediately */}
                <Card className="glass border-primary/30 dark:border-primary/20 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardContent className="pt-8 pb-8 text-center space-y-4">
                        <div className="flex justify-center">
                            <CheckCircle2 className="w-20 h-20 text-primary animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold text-foreground">Order Placed Successfully!</h1>
                            {orderLoading ? (
                                <div className="space-y-2">
                                    <Loader2 className="flex w-6 h-6 animate-spin mx-auto text-primary" />
                                    <p className="text-sm text-muted-foreground">Loading order details...</p>
                                </div>
                            ) : order ? (
                                <>
                                    <p className="text-lg text-muted-foreground">
                                        Thank you for your order, <span className="font-semibold text-primary">{order.customer_name}</span>!
                                    </p>
                                    <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                                        Your order has been received.
                                        You&apos;ll receive updates via notification and WhatsApp.
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Order ID: <code className="px-2 py-1 rounded bg-muted text-foreground font-mono">{order.id.slice(0, 8).toUpperCase()}</code>
                                    </p>

                                    {order.volunteer && (
                                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-2 mt-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Referred by: {order.volunteer.name} ({order.volunteer.volunteer_id})
                                        </p>
                                    )}

                                    {!order.volunteer && (
                                        <div className="pt-2">
                                            <AssignVolunteerDialog
                                                orderId={order.id}
                                                customerPhone={order.customer_phone}
                                                onSuccess={() => {
                                                    fetchOrderDetails();
                                                }}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : error ? (
                                <p className="text-destructive">{error}</p>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                {/* Thank You Poster Generator */}
                {order && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-600">
                        <ThankYouPoster customerName={order.customer_name} />
                    </div>
                )}

                {/* Order Bill - Loads Asynchronously */}
                {order && showBill && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="mb-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold-500">
                                Order Details
                            </h2>
                        </div>
                        <LazyOrderBill order={order} />
                    </div>
                )}

                {/* Actions - Show once order is loaded */}
                {order && (
                    <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in duration-700">
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
                        {/* <Link href="/" className="flex-1">
                            <Button
                                variant="outline"
                                className="w-full rounded-2xl"
                                size="lg"
                            >
                                Back to Home
                            </Button>
                        </Link> */}
                    </div>
                )}

                {/* Footer Note */}
                {/* {order && (
                    <Card className="glass-strong rounded-3xl animate-in fade-in duration-700">
                        <CardContent className="p-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                💡 <strong>Tip:</strong> Save or bookmark this page for your records.
                            </p>
                        </CardContent>
                    </Card>
                )} */}
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
