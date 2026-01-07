"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderSchema, type OrderFormData } from "@/lib/validations/order-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Upload, QrCode } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface OrderFormProps {
    studentId?: string;
}

const PRODUCT_PRICE = 499;

export function OrderForm({ studentId }: OrderFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
    } = useForm<OrderFormData>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            quantity: 1,
            paymentMethod: "cod",
        },
    });

    const paymentMethod = watch("paymentMethod");
    const quantity = watch("quantity") || 1;
    const totalPrice = quantity * PRODUCT_PRICE;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const onSubmit = async (data: OrderFormData) => {
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("customerName", data.customerName);
            formData.append("customerPhone", data.customerPhone);
            formData.append("customerEmail", data.customerEmail || "");
            formData.append("customerAddress", data.customerAddress);
            formData.append("quantity", data.quantity.toString());
            formData.append("totalPrice", totalPrice.toString());
            formData.append("paymentMethod", data.paymentMethod);
            if (studentId) {
                formData.append("referredBy", studentId);
            }

            // Handle file upload
            if (data.paymentScreenshot && data.paymentScreenshot[0]) {
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
            <Card className="max-w-2xl mx-auto glass border-emerald-300 dark:border-emerald-700">
                <CardContent className="pt-12 pb-12 text-center space-y-6">
                    <div className="flex justify-center">
                        <CheckCircle2 className="w-24 h-24 text-emerald-500 animate-bounce" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-foreground">Thank You!</h2>
                        <p className="text-lg text-muted-foreground">
                            Your order has been received successfully.
                        </p>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Our admin team will verify your payment and confirm your order soon.
                            You&apos;ll receive updates via phone.
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
        <Card className="max-w-2xl mx-auto glass-strong">
            <CardHeader>
                <CardTitle className="text-3xl">Order عطر الجنّة</CardTitle>
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

                    {/* Address */}
                    <div className="space-y-2">
                        <Label htmlFor="customerAddress">Delivery Address *</Label>
                        <Textarea
                            id="customerAddress"
                            placeholder="Enter your complete address with pincode"
                            rows={3}
                            {...register("customerAddress")}
                        />
                        {errors.customerAddress && (
                            <p className="text-sm text-destructive">{errors.customerAddress.message}</p>
                        )}
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
                        <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-gold-50 dark:from-emerald-950/20 dark:to-gold-950/20 border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
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
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{totalPrice}</p>
                                </div>
                            </div>

                            {/* QR Code Placeholder */}
                            <div className="bg-white p-4 rounded-lg w-48 h-48 mx-auto flex items-center justify-center border-2 border-dashed border-emerald-300">
                                <p className="text-center text-sm text-muted-foreground">QR Code<br />Placeholder</p>
                            </div>

                            {/* Upload Screenshot */}
                            <div className="space-y-2">
                                <Label htmlFor="paymentScreenshot">Upload Payment Screenshot *</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="paymentScreenshot"
                                        type="file"
                                        accept="image/*"
                                        {...register("paymentScreenshot")}
                                        onChange={handleFileChange}
                                        className="cursor-pointer"
                                    />
                                    <Upload className="w-5 h-5 text-muted-foreground" />
                                </div>
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
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
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
            </CardContent>
        </Card>
    );
}
