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
import { Loader2, CheckCircle2, Upload, QrCode, Copy, Camera, X, AlertTriangle } from "lucide-react";
import { LocationPicker } from "@/components/ui/location-picker";
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
    volunteerId?: string;
    prefillData?: any;
    customerProfile?: CustomerProfile | null;
}

const PRODUCT_PRICE = 313;

export function OrderForm({ volunteerId, prefillData, customerProfile }: OrderFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [screenshotError, setScreenshotError] = useState<string | null>(null);

    // Volunteer referral state
    const [volunteerReferralId, setVolunteerReferralId] = useState<string>(volunteerId || "");
    const [volunteerName, setVolunteerName] = useState<string>("");
    const [isValidatingVolunteer, setIsValidatingVolunteer] = useState(false);
    const [volunteerValidationError, setVolunteerValidationError] = useState<string>("");
    const [isVolunteerValidated, setIsVolunteerValidated] = useState(!!volunteerId);

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
            // Reorder or Edit scenario
            setValue("customerName", prefillData.customerName);
            setValue("customerPhone", prefillData.customerPhone);
            setValue("whatsappNumber", prefillData.whatsappNumber);
            setValue("customerEmail", prefillData.customerEmail);
            setValue("quantity", prefillData.quantity);

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
                toast.info("Editing your order. Update the details and submit.");
            } else if (prefillData.customerAddress) {
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

    // Validate volunteer ID
    const validateVolunteerId = async (id: string) => {
        if (!id || id.trim() === "") {
            setVolunteerName("");
            setVolunteerValidationError("");
            setIsVolunteerValidated(false);
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
                toast.success(`Referred by: ${data.volunteer.name}`);
            } else {
                setVolunteerName("");
                setIsVolunteerValidated(false);
                setVolunteerValidationError("Invalid volunteer ID");
            }
        } catch (error) {
            setVolunteerName("");
            setIsVolunteerValidated(false);
            setVolunteerValidationError("Failed to validate volunteer ID");
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
    }, [volunteerId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
            if (!validTypes.includes(file.type.toLowerCase())) {
                toast.error('Please upload a valid image file (JPG, PNG, WEBP, or HEIC)');
                e.target.value = ''; // Clear the input
                return;
            }

            // Validate file size (10MB max)
            const maxSize = 10 * 1024 * 1024; // 10MB in bytes
            if (file.size > maxSize) {
                toast.error('Image size must be less than 10MB');
                e.target.value = ''; // Clear the input
                return;
            }

            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setCapturedFile(file);
            setScreenshotError(null); // Clear error when file is selected
        }
    };

    const handleRemoveFile = () => {
        // Clear preview and file
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setCapturedFile(null);
        // Reset the file input
        const fileInput = document.getElementById('paymentScreenshot') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleCameraCapture = (file: File) => {
        setCapturedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setShowCamera(false);
        setScreenshotError(null); // Clear error when file is captured
    };

    const onSubmit = async (data: OrderFormData) => {
        // Validate UPI payment screenshot before submission
        if (data.paymentMethod === "upi" && !capturedFile && (!data.paymentScreenshot || !data.paymentScreenshot[0])) {
            setScreenshotError("Please upload a payment screenshot for UPI payments");
            // Scroll to the payment screenshot field
            const screenshotField = document.getElementById('paymentScreenshot');
            if (screenshotField) {
                screenshotField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Focus on the field to draw attention
                setTimeout(() => screenshotField.focus(), 300);
            }
            return;
        }

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
            // Add referred_by if volunteer ID is provided and validated
            if (volunteerId) {
                formData.append("referredBy", volunteerId);
            } else if (isVolunteerValidated && volunteerReferralId.trim()) {
                formData.append("referredBy", volunteerReferralId.trim());
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

            const result = await response.json();
            const orderId = result.order?.id;

            if (orderId) {
                toast.success("Order submitted successfully!");
                // Show loading toast during redirect
                toast.loading("Preparing your order details...", { duration: Infinity });
                // Small delay to ensure toast shows
                await new Promise(resolve => setTimeout(resolve, 300));
                // Redirect to thanks page with order ID
                window.location.href = `/thanks?orderId=${orderId}`;
            } else {
                throw new Error("Order ID not received");
            }
        } catch (error) {
            toast.error("Failed to submit order. Please try again.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
            {/* Contact Details */}
            <Card className="glass-strong rounded-3xl">
                <CardHeader>
                    <CardTitle className="text-3xl">Order Attar al-Jannah</CardTitle>
                    <CardDescription>
                        Fill in your details to place an order. {volunteerId && "This order will be credited to your volunteer account."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                            type="number"
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 10);
                            }}
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
                                className="text-xs"
                            >
                                <Copy className="w-3 h-3 mr-1" />
                                Same as phone
                            </Button>
                        </div>
                        <Input
                            id="whatsappNumber"
                            type="number"
                            placeholder="10-digit WhatsApp number"
                            maxLength={10}
                            onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 10);
                            }}
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
                </CardContent>
            </Card>

            {/* Volunteer Referral Section */}
            <Card className="glass-strong border-gold-300 dark:border-gold-700">
                <CardHeader>
                    <CardTitle className="text-lg">Volunteer Referral (Optional)</CardTitle>
                    <CardDescription>
                        If you were referred by a volunteer, enter their ID to credit them for this order
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    id="volunteerReferral"
                                    type="text"
                                    placeholder="Enter Volunteer ID"
                                    value={volunteerReferralId}
                                    onChange={(e) => setVolunteerReferralId(e.target.value)}
                                    readOnly={!!volunteerId}
                                    disabled={isValidatingVolunteer}
                                    className={
                                        volunteerValidationError
                                            ? "border-destructive"
                                            : isVolunteerValidated
                                                ? "border-emerald-500"
                                                : ""
                                    }
                                />
                                {isVolunteerValidated && volunteerName && (
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Referred by: <span className="font-semibold">{volunteerName}</span>
                                    </p>
                                )}
                                {volunteerValidationError && (
                                    <p className="text-sm text-destructive mt-1">{volunteerValidationError}</p>
                                )}
                                {!!volunteerId && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        This order will be credited to the referring volunteer
                                    </p>
                                )}
                            </div>
                            {!volunteerId && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => validateVolunteerId(volunteerReferralId)}
                                    disabled={isValidatingVolunteer || !volunteerReferralId.trim()}
                                >
                                    {isValidatingVolunteer ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Validating...
                                        </>
                                    ) : (
                                        "Validate"
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Order Details */}
            <Card className="glass-strong">
                <CardHeader>
                    <CardTitle className="text-lg">Order & Delivery Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Address Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Delivery Address</h3>
                        </div>

                        {/* Location Picker */}
                        <LocationPicker
                            onLocationSelect={(address) => {
                                setValue("houseBuilding", address.houseBuilding);
                                setValue("town", address.town);
                                setValue("post", address.post);
                                setValue("city", address.city);
                                setValue("district", address.district);
                                setValue("state", address.state);
                                setValue("pincode", address.pincode);
                            }}
                        />

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
                                    type="number"
                                    placeholder="6-digit pincode"
                                    maxLength={6}
                                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 6);
                                    }}
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
                                    <p className="font-semibold text-foreground">Minhajul Janna</p>
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
                                        src="/assets/Payment QR.webp"
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

                                <div className={`p-4 rounded-xl border-2 transition-colors ${screenshotError
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                                    : 'border-border bg-background'
                                    }`}>
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

                                    <p className="text-xs text-muted-foreground mt-2">
                                        Upload from gallery or use camera to capture payment screen
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        <strong>Supported:</strong> JPG, PNG, WEBP, HEIC • <strong>Max size:</strong> 10 MB
                                    </p>

                                    {screenshotError && (
                                        <p className="text-sm text-red-500 font-medium mt-2 flex items-center gap-1">
                                            <span className="text-red-500">⚠</span>
                                            {screenshotError}
                                        </p>
                                    )}

                                    {previewUrl && (
                                        <div className="relative w-full h-48 rounded-md overflow-hidden border mt-3">
                                            <Image
                                                src={previewUrl}
                                                alt="Payment screenshot preview"
                                                fill
                                                className="object-contain"
                                            />
                                            {/* Remove Button */}
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors z-10"
                                                aria-label="Remove screenshot"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
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
                </CardContent>
            </Card>

            {/* Camera Modal */}
            {showCamera && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onClose={() => setShowCamera(false)}
                />
            )}
        </form>
    );
}
