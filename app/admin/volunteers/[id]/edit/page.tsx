
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { volunteerBaseSchema, type VolunteerFormData } from "@/lib/validations/volunteer-schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save, AlertCircle } from "lucide-react";
import { CountryCodeSelect, COUNTRY_CODES } from "@/components/ui/country-code-select";
import { AddressSection } from "@/components/forms/address-section";
import { ProfilePhotoUpload } from "@/components/custom/profile-photo-upload";
import { toast } from "sonner";
import Link from "next/link";
import { z } from "zod";

// Create a schema that makes password optional for editing
const editVolunteerSchema = volunteerBaseSchema.extend({
    password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
}).refine((data) => {
    if (data.password && data.password !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type EditVolunteerFormData = z.infer<typeof editVolunteerSchema>;

export default function EditVolunteerPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
    const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

    // Duplicate checking state (only if changed)
    const [isCheckingName, setIsCheckingName] = useState(false);
    const [isCheckingVolunteerId, setIsCheckingVolunteerId] = useState(false);
    const [nameExists, setNameExists] = useState(false);
    const [volunteerIdExists, setVolunteerIdExists] = useState(false);

    // Original values to check against changes
    const [originalName, setOriginalName] = useState("");
    const [originalVolunteerId, setOriginalVolunteerId] = useState("");

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
        setError,
        clearErrors,
    } = useForm<EditVolunteerFormData>({
        resolver: zodResolver(editVolunteerSchema),
        mode: "onChange",
        defaultValues: {
            phoneCountry: "+91",
            goal: 20,
        },
    });

    const name = watch("name");
    const volunteer_id = watch("volunteer_id");

    // Fetch volunteer data
    useEffect(() => {
        const fetchVolunteer = async () => {
            try {
                const response = await fetch(`/api/admin/volunteers/${id}`);
                if (!response.ok) throw new Error("Failed to fetch volunteer");

                const data = await response.json();

                // Extract phone country code
                // Extract phone country code
                const fullPhone = data.phone || "";
                let countryCode = "+91";
                let phoneNumber = fullPhone;

                if (fullPhone.startsWith("+")) {
                    // Sort country codes by length (longest first) to match correctly
                    const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
                    const matched = sortedCodes.find(c => fullPhone.startsWith(c.code));

                    if (matched) {
                        countryCode = matched.code;
                        phoneNumber = fullPhone.slice(matched.code.length);
                    } else {
                        // Fallback: assume +91
                        countryCode = "+91";
                        phoneNumber = fullPhone.replace(/^\+/, '').replace(/^91/, '');
                    }
                }

                setPhoneCountryCode(countryCode);

                // Set original values
                setOriginalName(data.name);
                setOriginalVolunteerId(data.volunteer_id);
                setExistingPhotoUrl(data.profile_photo);
                setProfilePhotoPreview(data.profile_photo);

                // Determine goal from challenge_progress or default
                // Fetch progress as well? Or just set from data if available 
                // GET /api/admin/volunteers/[id] currently returns just fields in volunteers table.
                // We need goal. 
                // The GET endpoint I wrote: returns `select("*")`. 'goal' is NOT in 'volunteers' table, it's in 'challenge_progress'.
                // I should update GET /api/admin/volunteers/[id] to include goal.

                // For now, let's fetch goal separately or assume default/lazy load.
                // Or I can update the GET endpoint quickly in next step.

                reset({
                    name: data.name,
                    email: data.email || "",
                    phoneCountry: countryCode,
                    phone: phoneNumber,
                    volunteer_id: data.volunteer_id,
                    goal: data.goal || 20, // This might be missing if not fetched
                    houseBuilding: data.house_building || "",
                    town: data.town || "",
                    pincode: data.pincode || "",
                    post: data.post || "",
                    city: data.city || "",
                    district: data.district || "",
                    state: data.state || "",
                    locationLink: data.location_link || "",
                });
            } catch (error) {
                console.error("Error loading volunteer:", error);
                toast.error("Failed to load volunteer data");
                router.push("/admin/volunteers");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchVolunteer();
        }
    }, [id, reset, router]);

    // Fetch goal separately since it's not in the main table
    useEffect(() => {
        const fetchGoal = async () => {
            if (!id) return;
            try {
                const response = await fetch(`/api/admin/volunteers/${id}/analytics`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.performance?.goal?.target) {
                        setValue("goal", data.performance.goal.target);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch goal", e);
            }
        };
        fetchGoal();
    }, [id, setValue]);

    // Check for duplicate name (debounced)
    useEffect(() => {
        if (!name || name.length < 2 || name === originalName) {
            setNameExists(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsCheckingName(true);
            try {
                const response = await fetch(
                    `/api/admin/volunteers/check-duplicate?name=${encodeURIComponent(name)}`
                );
                const data = await response.json();

                if (data.nameExists) {
                    setNameExists(true);
                    setError("name", {
                        type: "manual",
                        message: "A volunteer with this name already exists",
                    });
                } else {
                    setNameExists(false);
                    clearErrors("name");
                }
            } catch (error) {
                console.error("Error checking name:", error);
            } finally {
                setIsCheckingName(false);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [name, setError, clearErrors, originalName]);

    // Check for duplicate volunteer_id (debounced)
    useEffect(() => {
        if (!volunteer_id || volunteer_id.trim() === "" || volunteer_id === originalVolunteerId) {
            setVolunteerIdExists(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsCheckingVolunteerId(true);
            try {
                const response = await fetch(
                    `/api/admin/volunteers/check-duplicate?volunteerId=${encodeURIComponent(volunteer_id)}`
                );
                const data = await response.json();

                if (data.volunteerIdExists) {
                    setVolunteerIdExists(true);
                    setError("volunteer_id", {
                        type: "manual",
                        message: "This volunteer ID is already in use",
                    });
                } else {
                    setVolunteerIdExists(false);
                    clearErrors("volunteer_id");
                }
            } catch (error) {
                console.error("Error checking volunteer ID:", error);
            } finally {
                setIsCheckingVolunteerId(false);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [volunteer_id, setError, clearErrors, originalVolunteerId]);

    const onSubmit = async (data: EditVolunteerFormData) => {
        if (nameExists || volunteerIdExists) {
            toast.error("Please fix duplicate errors before submitting");
            return;
        }

        try {
            setIsSubmitting(true);

            // Upload profile photo if changed
            let profilePhotoUrl = existingPhotoUrl;
            if (profilePhotoFile) {
                const photoFormData = new FormData();
                photoFormData.append("file", profilePhotoFile);
                photoFormData.append("volunteerId", data.volunteer_id);

                const photoResponse = await fetch("/api/upload/profile-photo", {
                    method: "POST",
                    body: photoFormData,
                });

                if (photoResponse.ok) {
                    const photoResult = await photoResponse.json();
                    profilePhotoUrl = photoResult.photoUrl;
                } else {
                    console.error("Photo upload failed");
                    toast.warning("Profile photo upload failed, keeping existing photo");
                }
            } else if (profilePhotoPreview === null) {
                // Photo was removed
                profilePhotoUrl = null;
            }

            let cleanPhone = data.phone.trim();
            if (cleanPhone.startsWith(phoneCountryCode)) {
                cleanPhone = cleanPhone.substring(phoneCountryCode.length).trim();
            } else if (cleanPhone.startsWith(phoneCountryCode.replace("+", ""))) {
                cleanPhone = cleanPhone.substring(phoneCountryCode.length - 1).trim();
            }

            const response = await fetch(`/api/admin/volunteers/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    phone: `${phoneCountryCode}${cleanPhone}`,
                    profile_photo: profilePhotoUrl,
                    house_building: data.houseBuilding || null,
                    town: data.town || null,
                    pincode: data.pincode || null,
                    post: data.post || null,
                    city: data.city || null,
                    district: data.district || null,
                    state: data.state || null,
                    location_link: data.locationLink || null,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to update volunteer");
            }

            toast.success("Volunteer updated successfully!");
            router.push(`/admin/volunteers/${id}`);

        } catch (error: any) {
            toast.error(error.message || "Failed to update volunteer");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/admin/volunteers/${id}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Edit Volunteer</h1>
                    <p className="text-muted-foreground mt-1">
                        Update volunteer details and settings
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card className="glass-strong">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Save className="h-5 w-5" />
                        Volunteer Information
                    </CardTitle>
                    <CardDescription>
                        Modify the volunteer details. Leave password blank to keep current password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <div className="relative">
                                <Input
                                    id="name"
                                    placeholder="Enter volunteer's full name"
                                    className={nameExists ? "border-destructive" : ""}
                                    {...register("name")}
                                />
                                {isCheckingName && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>
                            {isCheckingName && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    Checking availability...
                                </p>
                            )}
                            {errors.name && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        {/* Profile Photo */}
                        <div className="space-y-2">
                            <Label>Profile Photo</Label>
                            <ProfilePhotoUpload
                                currentPhotoUrl={profilePhotoPreview}
                                volunteerName={name || "Volunteer"}
                                onPhotoChange={(file, preview) => {
                                    setProfilePhotoFile(file);
                                    setProfilePhotoPreview(preview);
                                }}
                                size="md"
                            />
                        </div>

                        {/* Email and Phone */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="volunteer@example.com"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number *</Label>
                                <div className="flex gap-2">
                                    <CountryCodeSelect
                                        value={phoneCountryCode}
                                        onChange={(code) => {
                                            setPhoneCountryCode(code);
                                            setValue("phoneCountry", code);
                                        }}
                                    />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="Enter phone number"
                                        className="flex-1"
                                        {...register("phone")}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Volunteer ID and Password */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="volunteer_id">Volunteer ID *</Label>
                                <div className="relative">
                                    <Input
                                        id="volunteer_id"
                                        placeholder="E.g., Muhammed"
                                        className={volunteerIdExists ? "border-destructive" : ""}
                                        {...register("volunteer_id")}
                                    />
                                    {isCheckingVolunteerId && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                                {isCheckingVolunteerId && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        Checking availability...
                                    </p>
                                )}
                                {!isCheckingVolunteerId && volunteer_id && volunteer_id.trim() !== "" && !volunteerIdExists && volunteer_id !== originalVolunteerId && (
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        ✓ Available
                                    </p>
                                )}
                                {errors.volunteer_id && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.volunteer_id.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Leave blank to keep current"
                                        {...register("password")}
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-destructive">{errors.password.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2 mt-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Re-enter password"
                                        {...register("confirmPassword")}
                                    />
                                    {errors.confirmPassword && (
                                        <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Goal */}
                        <div className="space-y-2">
                            <Label htmlFor="goal">Sales Goal</Label>
                            <Input
                                id="goal"
                                type="number"
                                min="1"
                                placeholder="20"
                                {...register("goal", { valueAsNumber: true })}
                            />
                            {errors.goal && (
                                <p className="text-sm text-destructive">{errors.goal.message}</p>
                            )}
                        </div>

                        {/* Delivery Address Section */}
                        <AddressSection
                            form={{ register, setValue, watch, formState: { errors } }}
                            variant="volunteer"
                            showLocationLink={true}
                            defaultCollapsed={false}
                        />

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Update Volunteer
                                    </>
                                )}
                            </Button>
                            <Link href={`/admin/volunteers/${id}`} className="flex-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
