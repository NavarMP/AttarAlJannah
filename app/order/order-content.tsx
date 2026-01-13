"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { OrderForm } from "@/components/forms/order-form";
import { useCustomerAuth } from "@/lib/contexts/customer-auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function OrderContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, customerProfile } = useCustomerAuth();
    const [prefillData, setPrefillData] = useState<any>(null);
    const [referralCode, setReferralCode] = useState<string | null>(null);

    const handleBack = () => {
        // Go to customer dashboard if logged in, otherwise go to home
        if (user && customerProfile) {
            router.push("/customer/dashboard");
        } else {
            router.push("/");
        }
    };

    const fetchOrderForReorder = useCallback(async (orderId: string) => {
        try {
            const response = await fetch(`/api/customer/orders?phone=${encodeURIComponent(user?.phone || '')}`);
            const data = await response.json();
            const order = data.orders?.find((o: any) => o.id === orderId);

            if (order) {
                setPrefillData({
                    customerName: order.customer_name,
                    customerPhone: order.customer_phone,
                    whatsappNumber: order.whatsapp_number,
                    customerEmail: order.customer_email || '',
                    customerAddress: order.customer_address,
                    quantity: order.quantity,
                });
            }
        } catch (error) {
            console.error("Failed to fetch order for reorder:", error);
        }
    }, [user?.phone]);

    const fetchOrderForEdit = useCallback(async (orderId: string) => {
        try {
            const response = await fetch(`/api/customer/orders?phone=${encodeURIComponent(user?.phone || '')}&orderId=${orderId}`);
            const data = await response.json();
            const order = data.order;

            if (order) {
                // Parse address from the combined string
                const addressParts = order.customer_address.split(', ');
                setPrefillData({
                    customerName: order.customer_name,
                    customerPhone: order.customer_phone,
                    whatsappNumber: order.whatsapp_number,
                    customerEmail: order.customer_email || '',
                    quantity: order.quantity,
                    orderId: order.id, // Include orderId for the edit flow
                    // Parse address parts
                    houseBuilding: addressParts[0] || '',
                    town: addressParts[1] || '',
                    post: addressParts[2] || '',
                    city: addressParts[3] || '',
                    district: addressParts[4] || '',
                    state: addressParts[5]?.split(' - ')[0] || '',
                    pincode: addressParts[5]?.split(' - ')[1] || '',
                });
            }
        } catch (error) {
            console.error("Failed to fetch order for edit:", error);
            toast.error("Failed to load order details");
        }
    }, [user?.phone]);

    useEffect(() => {
        // Get referral code from URL
        const ref = searchParams.get("ref");
        if (ref) {
            setReferralCode(ref);
        }

        // Get reorder ID from URL
        const reorderId = searchParams.get("reorder");
        if (reorderId) {
            fetchOrderForReorder(reorderId);
        }

        // Get edit ID from URL
        const editId = searchParams.get("edit");
        if (editId) {
            fetchOrderForEdit(editId);
        }
    }, [searchParams, fetchOrderForReorder, fetchOrderForEdit]);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={handleBack}
                className="rounded-xl -ml-2"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>

            <div className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                    Place Your Order
                </h1>
                <p className="text-lg text-muted-foreground">
                    عطر الجنّة - Experience the divine fragrance
                </p>
                {user && (
                    <p className="text-sm text-primary">
                        ✨ Logged in as {user.phone}
                    </p>
                )}
                {referralCode && (
                    <p className="text-sm text-blue-600">
                        🎁 Using referral code: {referralCode}
                    </p>
                )}
            </div>

            {/* Contact Support */}
            <Card className="glass border-primary/30">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <p className="text-sm text-muted-foreground font-medium">
                            Need help with your order?
                        </p>
                        <div className="flex gap-3">
                            <Link
                                href="tel:+919072358001"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
                            >
                                <Phone className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">+91 907 235 8001</span>
                            </Link>
                            <Link
                                href="https://whatsapp.com/channel/0029VaxowK2DzgTE7cdK4G11"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-500" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-400">WhatsApp</span>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <OrderForm
                volunteerId={referralCode || undefined}
                prefillData={prefillData}
                customerProfile={customerProfile}
            />
        </div>
    );
}
