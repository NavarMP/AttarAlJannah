"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderSchema, type OrderFormData } from "@/lib/validations/order-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Upload, QrCode, Copy, Camera } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { CameraCapture } from "@/components/ui/camera-capture";

interface CustomerProfile {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    default_address: string | null;
    total_orders: number;
}

interface OrderFormProps {
    studentId?: string;
    prefillData?: any;
    customerProfile?: CustomerProfile | null;
}

const PRODUCT_PRICE = 313;

export function OrderForm({ studentId, prefillData, customerProfile }: OrderFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = useForm<OrderFormData>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            quantity: 1,
            paymentMethod: "upi",
        },
    });

    // Auto-fill from customer profile or prefill data
    useEffect(() => {
        if (prefillData) {
            // Reorder scenario
            setValue("customerName", prefillData.customerName);
            setValue("customerPhone", prefillData.customerPhone);
            setValue("whatsappNumber", prefillData.whatsappNumber);
            setValue("customerEmail", prefillData.customerEmail);
            setValue("quantity", prefillData.quantity);

            // Parse address if available
            if (prefillData.customerAddress) {
                toast.info("Form prefilled with your previous order details!");
            }
        } else if (customerProfile) {
            // Logged in customer scenario
            if (customerProfile.name) setValue("customerName", customerProfile.name);
            if (customerProfile.phone) setValue("customerPhone", customerProfile.phone.replace('+91', ''));
            if (customerProfile.email) setValue("customerEmail", customerProfile.email);

            toast.success("Welcome back! Your details are prefilled.");
        }
    }, [prefillData, customerProfile, setValue]);

    const paymentMethod = watch("paymentMethod");
    const quantity = watch("quantity") || 1;
    const phoneNumber = watch("customerPhone");
    const totalPrice = quantity * PRODUCT_PRICE;

    const copyPhoneToWhatsApp = () => {
        if (phoneNumber && phoneNumber.length === 10) {
            setValue("whatsappNumber", phoneNumber);
            toast.success("Phone number copied to WhatsApp field!");
        } else {
            toast.error("Please enter a valid phone number first");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setCapturedFile(file);
        }
    };

    const handleCameraCapture = (file: File) => {
        setCapturedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setShowCamera(false);
    };

    const onSubmit = async (data: OrderFormData) => {
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("customerName", data.customerName);
            formData.append("customerPhone", data.customerPhone);
            formData.append("whatsappNumber", data.whatsappNumber);
            formData.append("customerEmail", data.customerEmail || "");

            // Combine address fields
            const fullAddress = `${data.houseBuilding}, ${data.town}, ${data.post}, ${data.city}, ${data.district}, ${data.state} - ${data.pincode}`;
            formData.append("customerAddress", fullAddress);
            formData.append("quantity", data.quantity.toString());
            formData.append("totalPrice", totalPrice.toString());
            formData.append("paymentMethod", data.paymentMethod);
            if (studentId) {
                formData.append("referredBy", studentId);
            }

            // Handle file upload - use captured file if available, otherwise use form file input
            if (capturedFile) {
                formData.append("paymentScreenshot", capturedFile);
            } else if (data.paymentScreenshot && data.paymentScreenshot[0]) {
                formData.append("paymentScreenshot", data.paymentScreenshot[0]);
            }

            const response = await fetch("/api/orders/create", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to submit order");
            }

            setIsSuccess(true);
            toast.success("Order submitted successfully!");
            reset();
            setPreviewUrl(null);
            setCapturedFile(null);

            // Reset success after 5 seconds
            setTimeout(() => setIsSuccess(false), 5000);
        } catch (error) {
            toast.error("Failed to submit order. Please try again.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <Card className="max-w-2xl mx-auto glass border-primary/30 dark:border-primary/20 rounded-3xl">
                <CardContent className="pt-12 pb-12 text-center space-y-6">
                    <div className="flex justify-center">
                        <CheckCircle2 className="w-24 h-24 text-primary animate-bounce" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-foreground">Thank You!</h2>
                        <p className="text-lg text-muted-foreground">
                            Your order has been received successfully.
                        </p>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Our admin team will verify your payment and confirm your order soon.
                            You&apos;ll receive updates via phone or Whatsapp.
                        </p>
                    </div>
                    <Button onClick={() => setIsSuccess(false)} variant="outline">
                        Place Another Order
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-2xl mx-auto glass-strong rounded-3xl">
            <CardHeader>
                <CardTitle className="text-3xl">Order Attar al-Jannah</CardTitle>
                <CardDescription>
                    Fill in your details to place an order. {studentId && "This order will be credited to your student account."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Customer Name */}
                    <div className="space-y-2">
                        <Label htmlFor="customerName">Full Name *</Label>
                        <Input
                            id="customerName"
                            placeholder="Enter your full name"
                            {...register("customerName")}
                        />
                        {errors.customerName && (
                            <p className="text-sm text-destructive">{errors.customerName.message}</p>
                        )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <Label htmlFor="customerPhone">Mobile Number *</Label>
                        <Input
                            id="customerPhone"
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            {...register("customerPhone")}
                        />
                        {errors.customerPhone && (
                            <p className="text-sm text-destructive">{errors.customerPhone.message}</p>
                        )}
                    </div>

                    {/* WhatsApp Number */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={copyPhoneToWhatsApp}
                                className="h-7 text-xs"
                            >
                                <Copy className="mr-1 h-3 w-3" />
                                Same as Phone
                            </Button>
                        </div>
                        <Input
                            id="whatsappNumber"
                            placeholder="10-digit WhatsApp number"
                            maxLength={10}
                            {...register("whatsappNumber")}
                        />
                        {errors.whatsappNumber && (
                            <p className="text-sm text-destructive">{errors.whatsappNumber.message}</p>
                        )}
                    </div>

                    {/* Email (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="customerEmail">Email (Optional)</Label>
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

                    {/* Address Fields */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">Delivery Address</h3>

                        {/* House/Building */}
                        <div className="space-y-2">
                            <Label htmlFor="houseBuilding">House/Building Name *</Label>
                            <Input
                                id="houseBuilding"
                                placeholder="House/Flat No., Building Name"
                                {...register("houseBuilding")}
                            />
                            {errors.houseBuilding && (
                                <p className="text-sm text-destructive">{errors.houseBuilding.message}</p>
                            )}
                        </div>

                        {/* Town and Post */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="town">Town *</Label>
                                <Input
                                    id="town"
                                    placeholder="Town/Locality"
                                    {...register("town")}
                                />
                                {errors.town && (
                                    <p className="text-sm text-destructive">{errors.town.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="post">Post Office *</Label>
                                <Input
                                    id="post"
                                    placeholder="Post Office"
                                    {...register("post")}
                                />
                                {errors.post && (
                                    <p className="text-sm text-destructive">{errors.post.message}</p>
                                )}
                            </div>
                        </div>

                        {/* City and Pincode */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City *</Label>
                                <Input
                                    id="city"
                                    placeholder="City"
                                    {...register("city")}
                                />
                                {errors.city && (
                                    <p className="text-sm text-destructive">{errors.city.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pincode">Pincode *</Label>
                                <Input
                                    id="pincode"
                                    placeholder="6-digit pincode"
                                    maxLength={6}
                                    {...register("pincode")}
                                />
                                {errors.pincode && (
                                    <p className="text-sm text-destructive">{errors.pincode.message}</p>
                                )}
                            </div>
                        </div>

                        {/* District and State */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="district">District *</Label>
                                <Input
                                    id="district"
                                    placeholder="District"
                                    {...register("district")}
                                />
                                {errors.district && (
                                    <p className="text-sm text-destructive">{errors.district.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">State *</Label>
                                <Input
                                    id="state"
                                    placeholder="State"
                                    {...register("state")}
                                />
                                {errors.state && (
                                    <p className="text-sm text-destructive">{errors.state.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min={1}
                            max={50}
                            {...register("quantity", { valueAsNumber: true })}
                        />
                        {errors.quantity && (
                            <p className="text-sm text-destructive">{errors.quantity.message}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            Price: ₹{PRODUCT_PRICE} per bottle | Total: <span className="font-bold text-foreground">₹{totalPrice}</span>
                        </p>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method *</Label>
                        <Select id="paymentMethod" {...register("paymentMethod")}>
                            <option value="cod">Cash on Delivery (COD)</option>
                            <option value="upi">UPI / Online Payment</option>
                        </Select>
                    </div>

                    {/* UPI Payment Details */}
                    {paymentMethod === "upi" && (
                        <div className="space-y-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-gold-500/10 border border-primary/30 dark:border-primary/20">
                            <div className="flex items-center gap-2 text-primary dark:text-primary">
                                <QrCode className="w-5 h-5" />
                                <h3 className="font-semibold">UPI Payment Information</h3>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground">UPI ID:</p>
                                    <p className="font-mono font-semibold text-foreground">placeholder@upi</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Account Holder:</p>
                                    <p className="font-semibold text-foreground">Minhajul Jannah</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Amount to Pay:</p>
                                    <p className="text-2xl font-bold text-primary dark:text-primary">₹{totalPrice}</p>
                                </div>
                            </div>

                            {/* UPI Payment QR Code */}
                            <div className="bg-white p-4 rounded-lg w-64 h-64 mx-auto flex items-center justify-center border-2 border-primary/30 shadow-lg">
                                <div className="relative w-full h-full">
                                    <Image
                                        src="/assets/payment QR.svg"
                                        alt="UPI Payment QR Code"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                            <p className="text-center text-sm text-muted-foreground">Scan to pay ₹{totalPrice}</p>

                            {/* Upload or Capture Screenshot */}
                            <div className="space-y-3">
                                <Label htmlFor="paymentScreenshot">Payment Screenshot *</Label>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* File Upload */}
                                    <div className="flex-1">
                                        <Input
                                            id="paymentScreenshot"
                                            type="file"
                                            accept="image/*"
                                            {...register("paymentScreenshot")}
                                            onChange={handleFileChange}
                                            className="cursor-pointer"
                                        />
                                    </div>

                                    {/* Camera Button */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowCamera(true)}
                                        className="sm:w-auto w-full"
                                    >
                                        <Camera className="mr-2 h-4 w-4" />
                                        Take Photo
                                    </Button>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    Upload from gallery or use camera to capture payment screen
                                </p>

                                {previewUrl && (
                                    <div className="relative w-full h-48 rounded-md overflow-hidden border">
                                        <Image
                                            src={previewUrl}
                                            alt="Payment screenshot preview"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Submitting Order...
                            </>
                        ) : (
                            `Place Order - ₹${totalPrice}`
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        * Orders will be confirmed after admin verification {paymentMethod === "upi" && "of payment screenshot"}
                    </p>
                </form>

                {/* Camera Modal */}
                {showCamera && (
                    <CameraCapture
                        onCapture={handleCameraCapture}
                        onClose={() => setShowCamera(false)}
                    />
                )}
            </CardContent>
        </Card>
    );
}

