"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderSchema, type OrderFormData } from "@/lib/validations/order-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Copy, Camera, Upload, X, QrCode, Smartphone, ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, Download } from "lucide-react";
import { LocationLink } from "@/components/forms/location-link";
import { AddressSection } from "@/components/forms/address-section";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/translations";
import { loadRazorpayScript, createRazorpayOptions, openRazorpayCheckout, type RazorpayResponse } from "@/lib/config/razorpay-config";
import Image from "next/image";
import { CountryCodeSelect, COUNTRY_CODES } from "@/components/ui/country-code-select";
import { CameraCapture } from "@/components/ui/camera-capture";
import { createClient } from "@/lib/supabase/client";
import QRCodeLib from "qrcode";

interface CustomerProfile {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    default_address: string | null;
    total_orders: number;
}

interface OrderFormProps {
    volunteerId?: string;
    prefillData?: any;
    customerProfile?: CustomerProfile | null;
}

const PRODUCT_PRICE = 313;

export function OrderForm({ volunteerId, prefillData, customerProfile }: OrderFormProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Payment method state
    const [globalPaymentMethod, setGlobalPaymentMethod] = useState<"qr" | "razorpay">("qr");
    const [activePaymentMethod, setActivePaymentMethod] = useState<"qr" | "razorpay" | "volunteer_cash">("qr");
    const [paymentMethodLoading, setPaymentMethodLoading] = useState(true);

    // QR screenshot state
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string>("");
    const [showCamera, setShowCamera] = useState(false);
    const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
    const [screenshotPublicUrl, setScreenshotPublicUrl] = useState<string>("");

    // AI Verification state
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<any>(null);

    // UPI / dynamic QR state
    const [upiId, setUpiId] = useState("");
    const [merchantName, setMerchantName] = useState("");
    const [qrDataUrl, setQrDataUrl] = useState<string>("");

    // Volunteer referral state
    const [volunteerReferralId, setVolunteerReferralId] = useState<string>(volunteerId || "");
    const [volunteerName, setVolunteerName] = useState<string>("");
    const [isValidatingVolunteer, setIsValidatingVolunteer] = useState(false);
    const [volunteerValidationError, setVolunteerValidationError] = useState<string>("");
    const [isVolunteerValidated, setIsVolunteerValidated] = useState(!!volunteerId);

    // Country code state
    const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
    const [whatsappCountryCode, setWhatsappCountryCode] = useState("+91");

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = useForm<OrderFormData>({
        resolver: zodResolver(orderSchema),
        mode: "onChange",
        defaultValues: {
            quantity: 1,
            customerPhoneCountry: "+91",
            whatsappNumberCountry: "+91",
        },
    });

    // Fetch active payment method and UPI settings
    useEffect(() => {
        const fetchPaymentMethod = async () => {
            try {
                const response = await fetch("/api/settings/payment-method");
                const data = await response.json();
                const fetchedMethod = data.paymentMethod === "razorpay" ? "razorpay" : "qr";
                setGlobalPaymentMethod(fetchedMethod);
                setActivePaymentMethod(fetchedMethod);
                setUpiId(data.upiId || "");
                setMerchantName(data.merchantName || "Attar Al Jannah");
            } catch (error) {
                console.error("Failed to fetch payment method:", error);
                setGlobalPaymentMethod("qr");
                setActivePaymentMethod("qr");
            } finally {
                setPaymentMethodLoading(false);
            }
        };
        fetchPaymentMethod();
    }, []);


    // Helper function to correctly parse phone number with country code
    const parsePhoneWithCountryCode = (fullPhone: string): { code: string; number: string } => {
        if (!fullPhone.startsWith("+")) {
            return { code: "+91", number: fullPhone.replace(/^\+91/, '') };
        }

        // Sort country codes by length (longest first) to match correctly
        const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
        const matched = sortedCodes.find(c => fullPhone.startsWith(c.code));

        if (matched) {
            return {
                code: matched.code,
                number: fullPhone.slice(matched.code.length)
            };
        }

        // Fallback: assume +91
        return { code: "+91", number: fullPhone.replace(/^\+/, '').replace(/^91/, '') };
    };

    // Auto-fill from customer profile or prefill data
    // Priority: 1. localStorage (unsaved data) > 2. prefillData > 3. customerProfile
    useEffect(() => {
        // HIGHEST PRIORITY: Check localStorage first
        const savedForm = localStorage.getItem('orderFormData');
        let hasRestoredFromLocalStorage = false;

        if (savedForm && !prefillData?.orderId) {
            // Only restore if not editing an existing order
            try {
                const data = JSON.parse(savedForm);
                if (data && typeof data === 'object') {
                    // Check if saved data has meaningful content (not just empty fields)
                    const hasContent = Object.values(data).some(val => val && val !== '');

                    if (hasContent) {
                        Object.keys(data).forEach(key => {
                            // Skip file inputs
                            if (key !== 'paymentScreenshot' && data[key]) {
                                setValue(key as keyof OrderFormData, data[key]);
                            }
                        });

                        // Set country codes if they exist in saved data
                        if (data.customerPhoneCountry) setPhoneCountryCode(data.customerPhoneCountry);
                        if (data.whatsappNumberCountry) setWhatsappCountryCode(data.whatsappNumberCountry);

                        // Restore volunteer referral if available and not overridden by props
                        if (data.volunteerReferralId && !volunteerId) {
                            setVolunteerReferralId(data.volunteerReferralId);
                        }

                        hasRestoredFromLocalStorage = true;
                        toast.info(t("toast.restoredForm", "Restored your unsaved form data"));
                    }
                }
            } catch (e) {
                console.error("Failed to restore form data", e);
                localStorage.removeItem('orderFormData');
            }
        }

        // If we restored from localStorage, skip other prefills
        if (hasRestoredFromLocalStorage) {
            return;
        }

        // MEDIUM PRIORITY: prefillData (reorder/edit scenario)
        if (prefillData) {
            setValue("customerName", prefillData.customerName);

            // Parse customer phone
            if (prefillData.customerPhone) {
                let phone = prefillData.customerPhone;
                let code = "+91";

                if (prefillData.customerPhoneCountry) {
                    code = prefillData.customerPhoneCountry;
                    // If phone starts with code, strip it
                    if (phone.startsWith(code)) {
                        phone = phone.slice(code.length);
                    }
                } else if (phone.startsWith("+")) {
                    const parsed = parsePhoneWithCountryCode(phone);
                    code = parsed.code;
                    phone = parsed.number;
                }
                setPhoneCountryCode(code);
                setValue("customerPhoneCountry", code);
                setValue("customerPhone", phone);
            }

            // Parse WhatsApp
            if (prefillData.whatsappNumber) {
                let wa = prefillData.whatsappNumber;
                let waCode = "+91";

                if (prefillData.whatsappNumberCountry) {
                    waCode = prefillData.whatsappNumberCountry;
                    if (wa.startsWith(waCode)) {
                        wa = wa.slice(waCode.length);
                    }
                } else if (wa.startsWith("+")) {
                    const parsed = parsePhoneWithCountryCode(wa);
                    waCode = parsed.code;
                    wa = parsed.number;
                }
                setWhatsappCountryCode(waCode);
                setValue("whatsappNumberCountry", waCode);
                setValue("whatsappNumber", wa);
            }

            // Parse address if available (for edit mode with individual fields)
            if (prefillData.houseBuilding) {
                setValue("houseBuilding", prefillData.houseBuilding);
                setValue("town", prefillData.town);
                setValue("post", prefillData.post);
                setValue("city", prefillData.city);
                setValue("district", prefillData.district);
                setValue("state", prefillData.state);
                setValue("pincode", prefillData.pincode);
            }

            // Show a message if data was prefilled
            if (prefillData.orderId) {
                toast.info(t("toast.editingOrder", "Editing your order. Update the details and submit."));
            } else if (prefillData.customerAddress) {
                toast.info(t("toast.prefilled", "Form prefilled with your previous order details!"));
            } else if (prefillData.customerPhone) {
                toast.success(t("toast.phonePrefilled", "Your phone number has been prefilled!"));
            }
        } else if (customerProfile) {
            // LOWEST PRIORITY: Logged in customer scenario
            if (customerProfile.name) setValue("customerName", customerProfile.name);

            // Parse phone number with country code using helper
            if (customerProfile.phone) {
                const parsed = parsePhoneWithCountryCode(customerProfile.phone);
                setPhoneCountryCode(parsed.code);
                setValue("customerPhoneCountry", parsed.code);
                setValue("customerPhone", parsed.number);

                // Also set WhatsApp to same by default
                setWhatsappCountryCode(parsed.code);
                setValue("whatsappNumberCountry", parsed.code);
                setValue("whatsappNumber", parsed.number);
            }

            if (customerProfile.email) setValue("customerEmail", customerProfile.email);

            toast.success(t("toast.welcomeBack", "Welcome back! Your details are prefilled."));
        }
    }, [prefillData, customerProfile, setValue, volunteerId, t]);

    // Save form data to localStorage on change
    useEffect(() => {
        const subscription = watch((value) => {
            const timer = setTimeout(() => {
                const dataToSave = {
                    ...value,
                    customerPhoneCountry: phoneCountryCode,
                    whatsappNumberCountry: whatsappCountryCode,
                    volunteerReferralId: volunteerReferralId // Save volunteer ID
                };
                localStorage.setItem('orderFormData', JSON.stringify(dataToSave));
            }, 1000);
            return () => clearTimeout(timer);
        });
        return () => subscription.unsubscribe();
    }, [watch, phoneCountryCode, whatsappCountryCode, volunteerReferralId]);

    const quantity = watch("quantity") || 1;
    const phoneNumber = watch("customerPhone");
    const selectedState = watch("state");
    const totalPrice = quantity * PRODUCT_PRICE;

    // Generate dynamic UPI QR code whenever price or UPI settings change
    useEffect(() => {
        if (activePaymentMethod !== "qr" || !upiId) {
            setQrDataUrl("");
            return;
        }

        // const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${totalPrice.toFixed(2)}&cu=INR`;
        // Removed &am= parameter to fix "exceeded bank limit" error in UPI apps for P2P VPAs.
        // UPI apps impose strict limits on dynamic QRs with pre-filled amounts for non-merchant accounts.
        const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&cu=INR`;

        QRCodeLib.toDataURL(upiUrl, {
            width: 300,
            margin: 2,
            color: { dark: "#000000", light: "#ffffff" },
            errorCorrectionLevel: "M",
        })
            .then((url: string) => setQrDataUrl(url))
            .catch((err: Error) => {
                console.error("QR generation error:", err);
                setQrDataUrl("");
            });
    }, [activePaymentMethod, upiId, merchantName, totalPrice]);

    const copyPhoneToWhatsApp = () => {
        if (phoneNumber && phoneNumber.length >= 10) {
            setValue("whatsappNumber", phoneNumber);
            setWhatsappCountryCode(phoneCountryCode);
            toast.success(t("toast.phoneCopied", "Phone number copied to WhatsApp field!"));
        } else {
            toast.error(t("toast.enterPhone", "Please enter a valid phone number first"));
        }
    };



    // Upload screenshot to Supabase & verify with Gemini AI
    const handleScreenshotUploadAndVerify = async (file: File) => {
        setUploadingScreenshot(true);
        setVerificationResult(null);
        setScreenshotPublicUrl("");

        try {
            // Step 1: Upload to Supabase Storage
            const supabase = createClient();
            const fileExt = file.name.split(".").pop() || "jpg";
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `screenshots/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("payment-screenshots")
                .upload(filePath, file, { cacheControl: "3600", upsert: false });

            if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
            }

            const { data: urlData } = supabase.storage
                .from("payment-screenshots")
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;
            setScreenshotPublicUrl(publicUrl);
            setUploadingScreenshot(false);

            // Step 2: Verify with Gemini AI
            setVerifying(true);
            try {
                const verifyResponse = await fetch("/api/verify-payment-screenshot", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        imageUrl: publicUrl,
                        expectedAmount: totalPrice,
                    }),
                });

                const result = await verifyResponse.json();
                setVerificationResult(result);

                // Show toast based on result
                if (result.verified) {
                    toast.success(t("toast.paymentVerified", "Payment verified by AI!"));
                } else if (result.checks?.is_payment_screenshot === false) {
                    toast.error(t("toast.notPayment", "This doesn't look like a payment screenshot"));
                } else {
                    toast.warning(result.message || "Payment needs admin verification");
                }
            } catch (verifyErr) {
                console.error("Verification error:", verifyErr);
                // Don't block — verification is advisory
                setVerificationResult({
                    verified: false,
                    message: "Verification skipped. Admin will verify manually.",
                    checks: { is_payment_screenshot: true, amount_match: null, is_duplicate: false },
                    extracted: {},
                });
            } finally {
                setVerifying(false);
            }
        } catch (uploadErr: any) {
            toast.error(uploadErr.message || "Failed to upload screenshot");
            setUploadingScreenshot(false);
        }
    };

    // Validate volunteer ID with debouncing
    const validateVolunteerId = async (id: string) => {
        if (!id || id.trim() === "") {
            setVolunteerName("");
            setVolunteerValidationError("");
            setIsVolunteerValidated(false);
            setIsValidatingVolunteer(false); // Clear validating state
            if (activePaymentMethod === "volunteer_cash") setActivePaymentMethod(globalPaymentMethod);
            return;
        }

        setIsValidatingVolunteer(true);
        setVolunteerValidationError("");

        try {
            const response = await fetch(`/api/volunteer/validate?volunteerId=${encodeURIComponent(id)}`);
            const data = await response.json();

            if (data.valid && data.volunteer) {
                setVolunteerName(data.volunteer.name);
                setIsVolunteerValidated(true);
                setVolunteerValidationError("");
                toast.success(`${t("toast.volunteerValidated", "Referred by:")} ${data.volunteer.name}`);
            } else {
                setVolunteerName("");
                setIsVolunteerValidated(false);
                setVolunteerValidationError("Invalid volunteer ID");
                if (activePaymentMethod === "volunteer_cash") setActivePaymentMethod(globalPaymentMethod);
            }
        } catch (error) {
            setVolunteerName("");
            setIsVolunteerValidated(false);
            setVolunteerValidationError("Failed to validate volunteer ID");
            if (activePaymentMethod === "volunteer_cash") setActivePaymentMethod(globalPaymentMethod);
        } finally {
            setIsValidatingVolunteer(false);
        }
    };

    // Auto-validate if volunteerId is passed via props
    useEffect(() => {
        if (volunteerId) {
            setVolunteerReferralId(volunteerId);
            validateVolunteerId(volunteerId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [volunteerId]);

    // Debounced validation on input change
    useEffect(() => {
        if (!volunteerId) {
            if (volunteerReferralId.trim()) {
                const timer = setTimeout(() => {
                    validateVolunteerId(volunteerReferralId.trim());
                }, 800); // Validate after 800ms of no typing

                return () => clearTimeout(timer);
            } else {
                // Clear validation when field is empty
                validateVolunteerId("");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [volunteerReferralId, volunteerId]);


    const onSubmit = async (data: OrderFormData) => {
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("customerName", data.customerName);

            // Clean phone numbers: remove any existing country code prefix before appending
            const cleanPhone = data.customerPhone.replace(/^\+\d{1,4}/, '').trim();
            const cleanWhatsapp = data.whatsappNumber.replace(/^\+\d{1,4}/, '').trim();

            formData.append("customerPhone", `${phoneCountryCode}${cleanPhone}`);
            formData.append("whatsappNumber", `${whatsappCountryCode}${cleanWhatsapp}`);
            formData.append("customerEmail", data.customerEmail || "");

            // Combine address fields
            const fullAddress = `${data.houseBuilding}, ${data.town}, ${data.post}, ${data.city}, ${data.district}, ${data.state} - ${data.pincode}`;
            formData.append("customerAddress", fullAddress);
            // Add location link if provided
            if (data.locationLink) {
                formData.append("locationLink", data.locationLink);
            }
            formData.append("quantity", data.quantity.toString());
            formData.append("totalPrice", totalPrice.toString());
            formData.append("productName", "Attar Al Jannah");

            // No payment_method - all orders use Razorpay

            // Add referred_by if volunteer ID is provided and validated
            if (volunteerId) {
                formData.append("referredBy", volunteerId);
            } else if (isVolunteerValidated && volunteerReferralId.trim()) {
                formData.append("referredBy", volunteerReferralId.trim());
            }

            // Add individual address fields for database storage
            formData.append("houseBuilding", data.houseBuilding);
            formData.append("town", data.town);
            formData.append("post", data.post);
            formData.append("city", data.city);
            formData.append("district", data.district);
            formData.append("state", data.state);
            formData.append("pincode", data.pincode);

            // Add payment method
            formData.append("paymentMethod", activePaymentMethod);

            // Handle QR payment: attach previously uploaded screenshot URL + verification
            if (activePaymentMethod === "qr") {
                if (!screenshotPublicUrl) {
                    toast.error(t("toast.uploadScreenshot", "Please upload a payment screenshot"));
                    setIsSubmitting(false);
                    return;
                }

                formData.append("paymentScreenshotUrl", screenshotPublicUrl);

                // Attach verification data if available
                if (verificationResult) {
                    formData.append("screenshotVerified", String(verificationResult.verified));
                    formData.append("screenshotVerificationDetails", JSON.stringify(verificationResult));
                    if (verificationResult.extracted?.transaction_id) {
                        formData.append("extractedTransactionId", verificationResult.extracted.transaction_id);
                    }
                }
            }

            const response = await fetch("/api/orders/create", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to submit order");
            }

            const result = await response.json();
            const order = result.order;

            if (!order?.id) {
                throw new Error("Order ID not received");
            }

            console.log("✅ Order created:", order.id, "Payment method:", activePaymentMethod);

            // QR Payment or Volunteer Cash: Order is done — redirect to thanks page
            if (activePaymentMethod === "qr" || activePaymentMethod === "volunteer_cash") {
                toast.success(activePaymentMethod === "volunteer_cash" ? "Order submitted! Cash will be collected by volunteer." : "Order submitted! Payment is being verified.");
                localStorage.removeItem('orderFormData');
                await new Promise(resolve => setTimeout(resolve, 500));
                window.location.href = `/thanks?orderId=${order.id}`;
                return;
            }

            // Razorpay Payment: Create Razorpay order and process payment
            console.log("💳 Initiating Razorpay payment for order:", order.id);
            setIsProcessingPayment(true);
            toast.loading("Preparing payment...", { id: "payment-loading" });

            try {
                // Step 1: Load Razorpay script
                const scriptLoaded = await loadRazorpayScript();
                if (!scriptLoaded) {
                    throw new Error("Failed to load payment gateway");
                }

                // Step 2: Create Razorpay order
                const razorpayResponse = await fetch("/api/razorpay/create-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: totalPrice,
                        orderId: order.id,
                        customerInfo: {
                            name: data.customerName,
                            phone: `${phoneCountryCode}${data.customerPhone}`,
                        },
                    }),
                });

                if (!razorpayResponse.ok) {
                    throw new Error("Failed to create payment order");
                }

                const razorpayData = await razorpayResponse.json();
                toast.dismiss("payment-loading");

                // Step 3: Open Razorpay checkout
                const options = createRazorpayOptions({
                    orderId: razorpayData.razorpayOrderId,
                    amount: totalPrice,
                    customerName: data.customerName,
                    customerEmail: data.customerEmail || undefined,
                    customerPhone: `${phoneCountryCode}${data.customerPhone}`,
                    onSuccess: async (paymentResponse: RazorpayResponse) => {
                        console.log("💳 Payment successful:", paymentResponse);
                        toast.loading("Verifying payment...", { id: "verify-payment" });

                        try {
                            // Step 4: Verify payment
                            const verifyResponse = await fetch("/api/razorpay/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    razorpay_order_id: paymentResponse.razorpay_order_id,
                                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                    razorpay_signature: paymentResponse.razorpay_signature,
                                    order_id: order.id,
                                }),
                            });

                            if (!verifyResponse.ok) {
                                throw new Error("Payment verification failed");
                            }

                            toast.dismiss("verify-payment");
                            toast.success("Payment successful!");

                            // Clear saved form data
                            localStorage.removeItem('orderFormData');

                            // Redirect to thanks page
                            await new Promise(resolve => setTimeout(resolve, 500));
                            window.location.href = `/thanks?orderId=${order.id}`;
                        } catch (verifyError) {
                            toast.dismiss("verify-payment");
                            toast.error("Payment verification failed. Please contact support.");
                            console.error("Verification error:", verifyError);
                        } finally {
                            setIsProcessingPayment(false);
                        }
                    },
                    onDismiss: () => {
                        setIsProcessingPayment(false);
                        toast.info("Payment cancelled. You can retry anytime.");
                    },
                });

                await openRazorpayCheckout(options);
            } catch (paymentError) {
                toast.dismiss("payment-loading");
                toast.error("Payment initialization failed. Please try again.");
                console.error("Payment error:", paymentError);
                setIsProcessingPayment(false);
            }
        } catch (error) {
            toast.error(t("toast.orderFailed", "Failed to submit order. Please try again."));
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
            {/* Contact Details */}
            <Card className="glass-strong rounded-3xl">
                {/* ... existing header ... */}
                <CardHeader>
                    <CardTitle className="text-3xl">{t("form.title", "Order Attar al-Jannah")}</CardTitle>
                    <CardDescription>
                        {t("form.description", "Fill in your details to place an order.")} {volunteerId && t("form.volunteerCredit", "This order will be credited to your volunteer account.")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* ... customer name, phone, whatsapp, email ... */}
                    {/* Customer Name */}
                    <div className="space-y-2">
                        <Label htmlFor="customerName">{t("form.fullName", "Full Name")} *</Label>
                        <Input
                            id="customerName"
                            placeholder={t("form.fullNamePlaceholder", "Enter your full name")}
                            {...register("customerName")}
                        />
                        {errors.customerName && (
                            <p className="text-sm text-destructive">{errors.customerName.message}</p>
                        )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <Label htmlFor="customerPhone">{t("form.mobileNumber", "Mobile Number")} *</Label>
                        <div className="flex gap-2">
                            <CountryCodeSelect
                                value={phoneCountryCode}
                                onChange={(code) => {
                                    setPhoneCountryCode(code);
                                    setValue("customerPhoneCountry", code);
                                }}
                            />
                            <Input
                                id="customerPhone"
                                type="tel"
                                placeholder={t("form.mobilePlaceholder", "Enter mobile number")}
                                className="flex-1"
                                {...register("customerPhone")}
                            />
                        </div>
                        {errors.customerPhone && (
                            <p className="text-sm text-destructive">{errors.customerPhone.message}</p>
                        )}
                    </div>

                    {/* WhatsApp Number */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="whatsappNumber">{t("form.whatsappNumber", "WhatsApp Number")} *</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={copyPhoneToWhatsApp}
                                className="text-xs"
                            >
                                <Copy className="w-3 h-3 mr-1" />
                                {t("form.sameAsPhone", "Same as phone")}
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <CountryCodeSelect
                                value={whatsappCountryCode}
                                onChange={(code) => {
                                    setWhatsappCountryCode(code);
                                    setValue("whatsappNumberCountry", code);
                                }}
                            />
                            <Input
                                id="whatsappNumber"
                                type="tel"
                                placeholder={t("form.whatsappPlaceholder", "Enter WhatsApp number")}
                                className="flex-1"
                                {...register("whatsappNumber")}
                            />
                        </div>
                        {errors.whatsappNumber && (
                            <p className="text-sm text-destructive">{errors.whatsappNumber.message}</p>
                        )}
                    </div>

                    {/* Email (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="customerEmail">{t("form.email", "Email")}</Label>
                        <span className="text-xs text-muted-foreground ml-2">
                            {t("form.emailHint", "(Let's keep you posted! Enter your email for order updates.)")}
                        </span>
                        <Input
                            id="customerEmail"
                            type="email"
                            placeholder="your.email@example.com"
                            {...register("customerEmail")}
                        />
                        {errors.customerEmail && (
                            <p className="text-sm text-destructive">{errors.customerEmail.message}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Volunteer Referral Section */}
            <Card className="glass-strong border-gold-300 dark:border-gold-700">
                <CardHeader>
                    <CardTitle className="text-lg">{t("referral.title", "Volunteer Referral")}</CardTitle>
                    <CardDescription>
                        {t("referral.description", "If you were referred by a volunteer, enter their ID to credit them for this order")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Input
                            id="volunteerReferral"
                            type="text"
                            placeholder={t("referral.placeholder", "Enter Volunteer ID")}
                            value={volunteerReferralId}
                            onChange={(e) => setVolunteerReferralId(e.target.value)}
                            readOnly={!!volunteerId}
                            // REMOVED: disabled={isValidatingVolunteer} - kept generic disabled only if needed
                            className={
                                volunteerValidationError
                                    ? "border-destructive"
                                    : isVolunteerValidated
                                        ? "border-emerald-500"
                                        : ""
                            }
                        />
                        {isValidatingVolunteer && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {t("referral.validating", "Validating volunteer ID...")}
                            </p>
                        )}
                        {isVolunteerValidated && volunteerName && (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                {t("referral.referredBy", "Referred by:")} <span className="font-semibold">{volunteerName}</span>
                            </p>
                        )}
                        {volunteerValidationError && (
                            <p className="text-sm text-destructive mt-1">{volunteerValidationError}</p>
                        )}
                        {!!volunteerId && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {t("referral.creditNote", "This order will be credited to the referring volunteer")}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Order Details */}
            <Card className="glass-strong">
                <CardHeader>
                    <CardTitle className="text-lg">{t("order.title", "Order & Delivery Details")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Address Section */}
                    <AddressSection
                        form={{ register, setValue, watch, formState: { errors } }}
                        variant="order"
                    />

                    {/* Location Link */}
                    <LocationLink
                        value={watch("locationLink") || ""}
                        onChange={(link) => setValue("locationLink", link)}
                    />

                    {/* Quantity */}
                    <div className="space-y-2">
                        <Label htmlFor="quantity">{t("order.quantity", "Quantity")} *</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min={1}
                            max={1000}
                            {...register("quantity", { valueAsNumber: true })}
                        />
                        {errors.quantity && (
                            <p className="text-sm text-destructive">{errors.quantity.message}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            {t("order.pricePerBottle", `Price: ₹${PRODUCT_PRICE} per bottle`).replace("{price}", String(PRODUCT_PRICE))} | {t("order.total", "Total:")} <span className="font-bold text-foreground">₹{totalPrice}</span>
                        </p>
                    </div>

                    {/* Payment Mode Selection (Only if volunteer is active) */}
                    {(volunteerId || (isVolunteerValidated && volunteerName)) && (
                        <div className="space-y-3 pt-4 border-t">
                            <Label className="text-base font-semibold">{t("payment.title", "Payment Option")}</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${activePaymentMethod !== "volunteer_cash" ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-accent"}`}>
                                    <input
                                        type="radio"
                                        className="w-4 h-4 text-primary mt-0.5"
                                        checked={activePaymentMethod !== "volunteer_cash"}
                                        onChange={() => setActivePaymentMethod(globalPaymentMethod)}
                                    />
                                    <div>
                                        <p className="font-medium">{t("payment.online", "Pay Online / UPI")}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{t("payment.onlineDesc", "Pay directly using PhonePe, GPay, etc.")}</p>
                                    </div>
                                </label>
                                <label className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${activePaymentMethod === "volunteer_cash" ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-accent"}`}>
                                    <input
                                        type="radio"
                                        className="w-4 h-4 text-primary mt-0.5"
                                        checked={activePaymentMethod === "volunteer_cash"}
                                        onChange={() => setActivePaymentMethod("volunteer_cash")}
                                    />
                                    <div>
                                        <p className="font-medium">{t("payment.cash", "Cash to Volunteer")}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{t("payment.cashDesc", "Hand over cash to")} {volunteerName || "the volunteer"}.</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* QR Payment Section */}
                    {activePaymentMethod === "qr" && (
                        <div className="space-y-4 mt-2">
                            <div className="border-t pt-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                                    <QrCode className="h-5 w-5 text-primary" />
                                    {t("payment.qrTitle", "Pay Online/UPI")}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {t("payment.qrInstruction", "Scan the QR code below or click on the link to pay")} <span className="font-bold text-foreground">₹{totalPrice}</span>{t("payment.thenUpload", ", then upload the payment screenshot.")}
                                </p>

                                {/* QR Code Image (Dynamic) */}
                                <div className="flex flex-col items-center justify-center mb-4 gap-3">
                                    <div className="bg-white p-3 rounded-2xl shadow-md inline-block">
                                        {qrDataUrl ? (
                                            <Image
                                                src={qrDataUrl}
                                                alt="UPI Payment QR Code"
                                                width={280}
                                                height={280}
                                                className="rounded-xl"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-[280px] h-[280px] flex items-center justify-center text-muted-foreground">
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    {qrDataUrl && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full gap-2 border-primary/20 text-primary hover:bg-primary/5"
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = qrDataUrl;
                                                link.download = `attar_al_jannah_qr_amount_${totalPrice}.png`;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                        >
                                            <Download className="w-4 h-4" />
                                            {t("payment.downloadQr", "Download QR Code")}
                                        </Button>
                                    )}
                                </div>
                                {upiId && (
                                    <p className="text-xs text-center text-muted-foreground mb-3">
                                        {t("payment.payTo", "Pay to:")} <code className="bg-muted px-1 rounded">{upiId}</code>
                                    </p>
                                )}

                                {/* Quick Pay Options */}
                                <div className="space-y-3 mb-4">
                                    {/* Open UPI App Button */}
                                    {/* {upiId && (
                                        <a
                                            // href={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${totalPrice.toFixed(2)}&cu=INR`}
                                            href={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&cu=INR`}
                                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-2xl transition-all shadow-md active:scale-[0.98]"
                                        >
                                            <Smartphone className="h-5 w-5" />
                                            {t("payment.openUpi", `Open UPI App to Pay ₹${totalPrice}`).replace("{amount}", String(totalPrice))}
                                        </a>
                                    )} */}

                                    {/* Copy Details Row */}
                                    <div className="flex gap-2">
                                        {/* Copy UPI ID */}
                                        {upiId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(upiId);
                                                    toast.success("UPI ID copied!");
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border rounded-2xl hover:bg-accent/50 transition-colors text-sm"
                                            >
                                                <Copy className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-mono text-xs truncate">{upiId}</span>
                                            </button>
                                        )}

                                        {/* Copy Amount */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(totalPrice.toString());
                                                toast.success("Amount copied!");
                                            }}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 border rounded-2xl hover:bg-accent/50 transition-colors text-sm whitespace-nowrap"
                                        >
                                            <Copy className="h-4 w-4 text-muted-foreground" />
                                            ₹{totalPrice}
                                        </button>
                                    </div>

                                    <p className="text-xs text-center text-muted-foreground">
                                        {t("payment.tapToPay", "Tap button above to pay directly, or scan the QR code")}
                                    </p>
                                </div>

                                {/* Screenshot Upload */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">{t("payment.screenshot", "Payment Screenshot *")}</Label>

                                    {screenshotPreview ? (
                                        <div className="relative w-full max-w-sm mx-auto">
                                            <Image
                                                src={screenshotPreview}
                                                alt="Payment screenshot"
                                                width={400}
                                                height={300}
                                                className="w-full h-auto rounded-2xl border shadow-sm"
                                                unoptimized
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setScreenshotFile(null);
                                                    setScreenshotPreview("");
                                                    setScreenshotPublicUrl("");
                                                    setVerificationResult(null);
                                                }}
                                                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-md hover:opacity-90 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>

                                            {/* Upload / Verify Status */}
                                            {uploadingScreenshot && (
                                                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1 justify-center">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    {t("payment.uploading", "Uploading screenshot...")}
                                                </p>
                                            )}
                                            {verifying && (
                                                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1 justify-center">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    {t("payment.aiVerifying", "AI is verifying payment...")}
                                                </p>
                                            )}

                                            {/* Verification Result Badge */}
                                            {verificationResult && !verifying && !uploadingScreenshot && (
                                                <div className={`mt-3 p-3 rounded-2xl border text-sm ${verificationResult.verified
                                                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                                                    : verificationResult.checks?.is_payment_screenshot === false
                                                        ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                                                        : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                                                    }`}>
                                                    <div className="flex items-center gap-2">
                                                        {verificationResult.verified ? (
                                                            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                                        ) : verificationResult.checks?.is_payment_screenshot === false ? (
                                                            <ShieldX className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                                        ) : (
                                                            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                                        )}
                                                        <span className={`font-medium ${verificationResult.verified
                                                            ? "text-emerald-700 dark:text-emerald-300"
                                                            : verificationResult.checks?.is_payment_screenshot === false
                                                                ? "text-red-700 dark:text-red-300"
                                                                : "text-amber-700 dark:text-amber-300"
                                                            }`}>
                                                            {verificationResult.message}
                                                        </span>
                                                    </div>
                                                    {verificationResult.extracted?.amount && (
                                                        <p className="text-xs text-muted-foreground mt-1 ml-7">
                                                            Detected: ₹{verificationResult.extracted.amount}
                                                            {verificationResult.extracted.app_name && ` via ${verificationResult.extracted.app_name}`}
                                                            {verificationResult.extracted.transaction_id && ` • Txn: ${verificationResult.extracted.transaction_id}`}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {!uploadingScreenshot && !verifying && !verificationResult && screenshotPublicUrl && (
                                                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 justify-center">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    {t("payment.uploaded", "Screenshot uploaded")}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex gap-3">
                                            {/* File Upload Button */}
                                            <label className="flex-1 cursor-pointer">
                                                <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-muted-foreground/30 rounded-2xl hover:border-primary/50 hover:bg-accent/50 transition-all">
                                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">{t("payment.uploadFile", "Upload File")}</span>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setScreenshotFile(file);
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setScreenshotPreview(reader.result as string);
                                                            };
                                                            reader.readAsDataURL(file);
                                                            handleScreenshotUploadAndVerify(file);
                                                        }
                                                    }}
                                                />
                                            </label>

                                            {/* Camera Button */}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1 rounded-2xl gap-2 border-2 border-dashed py-3 h-auto"
                                                onClick={() => setShowCamera(true)}
                                            >
                                                <Camera className="h-5 w-5" />
                                                <span className="text-sm">{t("payment.takePhoto", "Take Photo")}</span>
                                            </Button>
                                        </div>
                                    )}

                                    {/* Camera Capture Modal */}
                                    {showCamera && (
                                        <CameraCapture
                                            onCapture={(file: File, dataUrl: string) => {
                                                setScreenshotFile(file);
                                                setScreenshotPreview(dataUrl);
                                                setShowCamera(false);
                                                handleScreenshotUploadAndVerify(file);
                                            }}
                                            onClose={() => setShowCamera(false)}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl"
                        disabled={isSubmitting || isProcessingPayment || uploadingScreenshot || (activePaymentMethod === "qr" && !screenshotPublicUrl)}
                    >
                        {isProcessingPayment ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {t("submit.processing", "Processing Payment...")}
                            </>
                        ) : uploadingScreenshot ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {t("submit.uploading", "Uploading Screenshot...")}
                            </>
                        ) : isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {t("submit.creating", "Creating Order...")}
                            </>
                        ) : activePaymentMethod === "qr" ? (
                            t("submit.qr", `Submit Order - ₹${totalPrice}`).replace("{amount}", String(totalPrice))
                        ) : activePaymentMethod === "volunteer_cash" ? (
                            t("submit.cash", `Confirm Cash Order - ₹${totalPrice}`).replace("{amount}", String(totalPrice))
                        ) : (
                            t("submit.pay", `Proceed to Payment - ₹${totalPrice}`).replace("{amount}", String(totalPrice))
                        )}
                    </Button>

                    {verifying && activePaymentMethod === "qr" && (
                        <p className="text-xs text-center text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {t("submit.aiVerifying", "AI verification in progress — you can submit now")}
                        </p>
                    )}

                    <p className="text-xs text-center text-muted-foreground">
                        {activePaymentMethod === "qr"
                            ? t("submit.qrNote", "* Your order will be confirmed after payment verification")
                            : activePaymentMethod === "volunteer_cash"
                                ? t("submit.cashNote", "* You will pay the cash directly to the volunteer")
                                : t("submit.razorpayNote", "* Secure payment powered by Razorpay")
                        }
                    </p>
                </CardContent>
            </Card>
        </form >
    );
}
