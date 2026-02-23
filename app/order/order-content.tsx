"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { OrderForm } from "@/components/forms/order-form";
import { useCustomerAuth } from "@/lib/contexts/customer-auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { COUNTRY_CODES } from "@/components/ui/country-code-select";
import { LanguageProvider, useTranslation } from "@/lib/i18n/translations";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { HelpButton } from "@/components/ui/help-button";
import { StartupPopup } from "@/components/custom/startup-popup";

function OrderContentInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, customerProfile } = useCustomerAuth();
    const [prefillData, setPrefillData] = useState<any>(null);
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const { t, language } = useTranslation();

    const handleBack = () => {
        // Check for volunteer session
        const volunteerId = localStorage.getItem("volunteerId");

        // Go to appropriate dashboard or home
        if (user && customerProfile) {
            router.push("/customer/dashboard");
        } else if (volunteerId) {
            router.push("/volunteer/dashboard");
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
            // Fetch order directly by ID (works for everyone)
            const response = await fetch(`/api/orders/${orderId}`);
            const order = await response.json();

            if (order && order.id) {
                // Parse address from the combined string
                const addressParts = order.customer_address.split(', ');
                setPrefillData({
                    customerName: order.customer_name,
                    customerPhone: order.customer_phone,
                    whatsappNumber: order.whatsapp_number,
                    customerEmail: order.customer_email || '',
                    quantity: order.quantity,
                    paymentMethod: order.payment_method,
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
            } else {
                toast.error("Order not found or cannot be edited");
            }
        } catch (error) {
            console.error("Failed to fetch order for edit:", error);
            toast.error("Failed to load order details");
        }
    }, []);

    useEffect(() => {
        // Get referral code from URL
        const ref = searchParams.get("ref");
        if (ref) {
            setReferralCode(ref);
        }

        // Get phone number from URL (for customer auto-fill)
        const phoneParam = searchParams.get("phone");
        if (phoneParam && !prefillData) {
            // Parse phone number to extract country code
            // Expected format: +919746902268 or 9746902268
            let cleanPhone = phoneParam;
            let countryCode = "+91"; // Default to India

            // If phone starts with +, extract country code using known codes
            if (cleanPhone.startsWith("+")) {
                const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
                const matched = sortedCodes.find(c => cleanPhone.startsWith(c.code));

                if (matched) {
                    countryCode = matched.code;
                    cleanPhone = cleanPhone.slice(matched.code.length);
                } else {
                    // Fallback check specifically for +91 if not matched above (though it should be in COUNTRY_CODES)
                    if (cleanPhone.startsWith("+91")) {
                        countryCode = "+91";
                        cleanPhone = cleanPhone.slice(3);
                    } else {
                        // Generic fallback using regex
                        const match = cleanPhone.match(/^(\+\d{1,3})(\d+)$/);
                        if (match) {
                            countryCode = match[1];
                            cleanPhone = match[2];
                        }
                    }
                }
            }

            // Auto-fill phone numbers when coming from customer dashboard
            setPrefillData({
                customerPhone: cleanPhone,
                whatsappNumber: cleanPhone,
                customerPhoneCountry: countryCode,
                whatsappNumberCountry: countryCode,
            });
        }

        // Get reorder ID from URL
        const reorderId = searchParams.get("reorder");
        if (reorderId) {
            fetchOrderForReorder(reorderId);
            return; // Don't auto-fill when reordering
        }

        // Get edit ID from URL
        const editId = searchParams.get("edit");
        if (editId) {
            fetchOrderForEdit(editId);
            return; // Don't auto-fill when editing
        }
    }, [searchParams, fetchOrderForReorder, fetchOrderForEdit, prefillData]);

    const whatsappMessage = language === "ml"
        ? "ഹായ്, എനിക്ക് അത്തർ അൽ-ജന്ന ഓർഡർ ചെയ്യാൻ സഹായം വേണം.%0A%0Aപേര്: %0Aവിലാസം: %0A%0Aഞാൻ പേയ്‌മെന്റ് സ്ക്രീൻഷോട്ട് അയയ്ക്കാം."
        : "Hi, I need help placing an order for Attar al-Jannah.%0A%0AName: %0AAddress: %0A%0AI will send the payment screenshot.";

    return (
        <div className="max-w-4xl mx-auto space-y-8 relative">
            <StartupPopup />

            {/* Back Button, Help, and Language Toggle */}
            <div className="flex items-center justify-between relative z-20">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="rounded-xl -ml-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t("page.back", "Back")}
                </Button>
                <div className="flex items-center gap-2">
                    <HelpButton />
                    <LanguageToggle />
                </div>
            </div>

            <div className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                    {t("page.title", "Place Your Order")}
                </h1>
                <p className="text-lg text-muted-foreground">
                    {t("page.subtitle", "Attar al-Jannah - Experience the divine fragrance")}
                </p>
                {user && (
                    <p className="text-sm text-primary">
                        {t("page.loggedInAs", "✨ Logged in as")} {user.phone}
                    </p>
                )}
                {referralCode && (
                    <p className="text-sm text-blue-600">
                        {t("page.referralCode", "🎁 Using referral code:")} {referralCode}
                    </p>
                )}
            </div>

            <OrderForm
                volunteerId={referralCode || undefined}
                prefillData={prefillData}
                customerProfile={customerProfile}
            />
        </div>
    );
}

export function OrderContent() {
    return (
        <LanguageProvider>
            <OrderContentInner />
        </LanguageProvider>
    );
}
