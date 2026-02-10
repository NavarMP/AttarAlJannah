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
import { Loader2, CheckCircle2, Copy } from "lucide-react";
import { LocationLink } from "@/components/ui/location-link";
import { toast } from "sonner";
import { loadRazorpayScript, createRazorpayOptions, openRazorpayCheckout, type RazorpayResponse } from "@/lib/config/razorpay-config";

import { SearchableSelect } from "@/components/ui/searchable-select";
import { CountryCodeSelect, COUNTRY_CODES } from "@/components/ui/country-code-select";
import { INDIAN_STATES, DISTRICTS_BY_STATE } from "@/lib/data/indian-locations";

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
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Volunteer referral state
    const [volunteerReferralId, setVolunteerReferralId] = useState<string>(volunteerId || "");
    const [volunteerName, setVolunteerName] = useState<string>("");
    const [isValidatingVolunteer, setIsValidatingVolunteer] = useState(false);
    const [volunteerValidationError, setVolunteerValidationError] = useState<string>("");
    const [isVolunteerValidated, setIsVolunteerValidated] = useState(!!volunteerId);

    // Country code state
    const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
    const [whatsappCountryCode, setWhatsappCountryCode] = useState("+91");

    // Pincode lookup state
    const [postOffices, setPostOffices] = useState<string[]>([]);
    const [postOfficeData, setPostOfficeData] = useState<any[]>([]);
    const [isLoadingPincode, setIsLoadingPincode] = useState(false);
    const [pincodeError, setPincodeError] = useState<string>("");

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

                        hasRestoredFromLocalStorage = true;
                        toast.info("Restored your unsaved form data");
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
                toast.info("Editing your order. Update the details and submit.");
            } else if (prefillData.customerAddress) {
                toast.info("Form prefilled with your previous order details!");
            } else if (prefillData.customerPhone) {
                toast.success("Your phone number has been prefilled!");
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

            toast.success("Welcome back! Your details are prefilled.");
        }
    }, [prefillData, customerProfile, setValue]);

    // Save form data to localStorage on change
    useEffect(() => {
        const subscription = watch((value) => {
            const timer = setTimeout(() => {
                localStorage.setItem('orderFormData', JSON.stringify(value));
            }, 1000);
            return () => clearTimeout(timer);
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    const quantity = watch("quantity") || 1;
    const phoneNumber = watch("customerPhone");
    const selectedState = watch("state");
    const totalPrice = quantity * PRODUCT_PRICE;

    const copyPhoneToWhatsApp = () => {
        if (phoneNumber && phoneNumber.length >= 10) {
            setValue("whatsappNumber", phoneNumber);
            setWhatsappCountryCode(phoneCountryCode);
            toast.success("Phone number copied to WhatsApp field!");
        } else {
            toast.error("Please enter a valid phone number first");
        }
    };

    // Fetch pincode details from India Post API
    const fetchPincodeDetails = async (pincode: string) => {
        if (pincode.length !== 6) {
            setPostOffices([]);
            setPostOfficeData([]);
            setPincodeError("");
            return;
        }

        setIsLoadingPincode(true);
        setPincodeError("");

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();

            if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
                const offices = data[0].PostOffice;
                const officeNames = offices.map((o: any) => o.Name);

                setPostOffices(officeNames);
                setPostOfficeData(offices); // Store full data for later use

                // Auto-populate only district and state (NOT city - it comes from post office selection)
                setValue("district", offices[0].District);
                setValue("state", offices[0].State);

                // Auto-select post office if only one available
                if (officeNames.length === 1) {
                    setValue("post", officeNames[0]);
                    // City will be auto-populated by useEffect watching post selection
                }

                toast.success("Address details loaded!");
            } else {
                setPostOffices([]);
                setPostOfficeData([]);
                setPincodeError("Invalid pincode or no data found");
                toast.error("Invalid pincode");
            }
        } catch (error) {
            setPostOffices([]);
            setPostOfficeData([]);
            setPincodeError("Failed to fetch pincode details");
            toast.error("Failed to fetch pincode details");
        } finally {
            setIsLoadingPincode(false);
        }
    };

    // Validate volunteer ID with debouncing
    const validateVolunteerId = async (id: string) => {
        if (!id || id.trim() === "") {
            setVolunteerName("");
            setVolunteerValidationError("");
            setIsVolunteerValidated(false);
            setIsValidatingVolunteer(false); // Clear validating state
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
    }, [volunteerReferralId, volunteerId]);

    // Clear district when state changes
    useEffect(() => {
        if (selectedState) {
            const currentDistrict = watch("district");
            const districtsForState = DISTRICTS_BY_STATE[selectedState] || [];

            // If current district is not in the new state's list, clear it
            if (currentDistrict && !districtsForState.includes(currentDistrict)) {
                setValue("district", "");
            }
        }
    }, [selectedState, setValue, watch]);

    // Watch pincode and trigger lookup
    const pincode = watch("pincode");
    useEffect(() => {
        if (pincode && pincode.length === 6) {
            fetchPincodeDetails(pincode);
        } else if (pincode && pincode.length < 6) {
            setPostOffices([]);
            setPincodeError("");
        }
    }, [pincode, fetchPincodeDetails]);

    // Watch post office selection and update city
    const selectedPost = watch("post");
    useEffect(() => {
        if (selectedPost && postOfficeData.length > 0) {
            // Find the selected post office in the data
            const selectedOffice = postOfficeData.find((o: any) => o.Name === selectedPost);
            if (selectedOffice) {
                // Set city to the post office name
                setValue("city", selectedOffice.Name);
            }
        }
    }, [selectedPost, postOfficeData, setValue]);



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

            console.log("✅ Order created, initiating payment:", order.id);

            // Now create Razorpay order and process payment
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
                {/* ... existing header ... */}
                <CardHeader>
                    <CardTitle className="text-3xl">Order Attar al-Jannah</CardTitle>
                    <CardDescription>
                        Fill in your details to place an order. {volunteerId && "This order will be credited to your volunteer account."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* ... customer name, phone, whatsapp, email ... */}
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
                                placeholder="Enter mobile number"
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
                                placeholder="Enter WhatsApp number"
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
                        <Input
                            id="volunteerReferral"
                            type="text"
                            placeholder="Enter Volunteer ID"
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
                                Validating volunteer ID...
                            </p>
                        )}
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
                        {/* <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Delivery Address</h3>
                        </div> */}

                        {/* Location Link */}
                        <LocationLink
                            value={watch("locationLink") || ""}
                            onChange={(link) => setValue("locationLink", link)}
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

                        {/* Town */}
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

                        {/* Pincode - MOVED UP to trigger auto-population */}
                        <div className="space-y-2">
                            <Label htmlFor="pincode">Pincode *</Label>
                            <div className="relative">
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
                                {isLoadingPincode && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            {errors.pincode && (
                                <p className="text-sm text-destructive">{errors.pincode.message}</p>
                            )}
                            {pincodeError && (
                                <p className="text-sm text-destructive">{pincodeError}</p>
                            )}
                            {postOffices.length > 0 && (
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                    ✓ {postOffices.length} post office{postOffices.length > 1 ? 's' : ''} found
                                </p>
                            )}
                        </div>

                        {/* Post Office - NOW AS DROPDOWN */}
                        <div className="space-y-2">
                            <Label htmlFor="post">Post Office *</Label>
                            <SearchableSelect
                                options={postOffices}
                                value={watch("post")}
                                onChange={(val) => setValue("post", val, { shouldValidate: true })}
                                placeholder="Select Post Office"
                                searchPlaceholder="Search Post Office..."
                                disabled={postOffices.length === 0}
                                emptyMessage="Please enter a valid pincode first"
                            />
                            <input type="hidden" {...register("post")} />
                            {errors.post && (
                                <p className="text-sm text-destructive">{errors.post.message}</p>
                            )}
                        </div>

                        {/* City (Auto-populated from pincode) */}
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

                        {/* District (Auto-populated from pincode) */}
                        <div className="space-y-2">
                            <Label htmlFor="district">District *</Label>
                            <SearchableSelect
                                options={
                                    selectedState
                                        ? (DISTRICTS_BY_STATE[selectedState] || [])
                                        : []
                                }
                                value={watch("district")}
                                onChange={(val) => setValue("district", val, { shouldValidate: true })}
                                placeholder="Select District"
                                searchPlaceholder="Search District..."
                                disabled={!selectedState}
                                emptyMessage={!selectedState ? "Please select a state first" : "No district found"}
                            />
                            <input type="hidden" {...register("district")} />
                            {errors.district && (
                                <p className="text-sm text-destructive">{errors.district.message}</p>
                            )}
                        </div>

                        {/* State (Auto-populated from pincode) */}
                        <div className="space-y-2">
                            <Label htmlFor="state">State *</Label>
                            <SearchableSelect
                                options={INDIAN_STATES}
                                value={watch("state")}
                                onChange={(val) => {
                                    setValue("state", val, { shouldValidate: true });
                                }}
                                placeholder="Select State"
                                searchPlaceholder="Search State..."
                            />
                            <input type="hidden" {...register("state")} />
                            {errors.state && (
                                <p className="text-sm text-destructive">{errors.state.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min={1}
                            // max={1000}
                            {...register("quantity", { valueAsNumber: true })}
                        />
                        {errors.quantity && (
                            <p className="text-sm text-destructive">{errors.quantity.message}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            Price: ₹{PRODUCT_PRICE} per bottle | Total: <span className="font-bold text-foreground">₹{totalPrice}</span>
                        </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl"
                        disabled={isSubmitting || isProcessingPayment}
                    >
                        {isProcessingPayment ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing Payment...
                            </>
                        ) : isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Creating Order...
                            </>
                        ) : (
                            `Proceed to Payment - ₹${totalPrice}`
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        * Secure payment powered by Razorpay
                    </p>
                </CardContent>
            </Card>
        </form>
    );
}
