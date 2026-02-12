"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { volunteerSchema, type VolunteerFormData } from "@/lib/validations/volunteer-schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import { AddressSection } from "@/components/forms/address-section";
import { ProfilePhotoUpload } from "@/components/custom/profile-photo-upload";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

export default function VolunteerSignupPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

    // Duplicate checking state
    const [isCheckingName, setIsCheckingName] = useState(false);
    const [isCheckingVolunteerId, setIsCheckingVolunteerId] = useState(false);
    const [nameExists, setNameExists] = useState(false);
    const [volunteerIdExists, setVolunteerIdExists] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        setError,
        clearErrors,
    } = useForm<VolunteerFormData>({
        resolver: zodResolver(volunteerSchema),
        mode: "onChange",
        defaultValues: {
            phoneCountry: "+91",
        },
    });

    const name = watch("name");
    const volunteer_id = watch("volunteer_id");

    // Check for duplicate name (debounced)
    useEffect(() => {
        if (!name || name.length < 2) {
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
    }, [name, setError, clearErrors]);

    // Check for duplicate volunteer_id (debounced)
    useEffect(() => {
        if (!volunteer_id || volunteer_id.trim() === "") {
            setVolunteerIdExists(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsCheckingVolunteerId(true);
            try {
                const response = await fetch(
                    `/api/volunteer/check-duplicate?volunteerId=${encodeURIComponent(volunteer_id)}`
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
    }, [volunteer_id, setError, clearErrors]);

    const onSubmit = async (data: VolunteerFormData) => {
        // Final check before submission
        if (nameExists || volunteerIdExists) {
            toast.error("Please fix duplicate errors before submitting");
            return;
        }

        try {
            setIsSubmitting(true);

            // Upload profile photo first if provided
            let profilePhotoUrl: string | null = null;
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
                    // Photo upload failed, but continue with signup
                    console.error("Photo upload failed, continuing without photo");
                    toast.warning("Profile photo upload failed, but continuing with signup");
                }
            }

            const response = await fetch("/api/volunteer/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email || undefined,
                    phone: `${phoneCountryCode}${data.phone}`,
                    volunteer_id: data.volunteer_id,
                    password: data.password,
                    profile_photo: profilePhotoUrl, // Add profile photo URL
                    // Optional address fields
                    houseBuilding: data.houseBuilding || null,
                    town: data.town || null,
                    pincode: data.pincode || null,
                    post: data.post || null,
                    city: data.city || null,
                    district: data.district || null,
                    state: data.state || null,
                    locationLink: data.locationLink || null,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to create account");
            }

            toast.success(result.message || "Signup successful!");
            setSignupSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push("/volunteer/login");
            }, 3000);

        } catch (error: any) {
            toast.error(error.message || "Failed to create account");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (signupSuccess) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-blue-500/5 to-purple-500/10">
                <Card className="max-w-md w-full glass-strong rounded-3xl">
                    <CardContent className="pt-12 pb-8 text-center space-y-6">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Signup Successful!</h2>
                            <p className="text-muted-foreground">
                                Your account is pending admin approval. You&apos;ll be able to log in once approved.
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Redirecting to login page...
                        </p>
                        <Link href="/volunteer/login">
                            <Button variant="outline" className="rounded-xl">
                                Go to Login Now
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-blue-500/5 to-purple-500/10">
            <div className="max-w-3xl w-full space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/volunteer/login">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex justify-center flex-1">
                        <Image
                            src="/assets/typography.svg"
                            alt="عطر الجنّة"
                            width={200}
                            height={50}
                            className="h-12 w-auto"
                        />
                    </div>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>

                {/* Form */}
                <Card className="glass-strong rounded-3xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl">Volunteer Signup</CardTitle>
                        <CardDescription className="mt-2">
                            Create your volunteer account and start making a difference
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
                                        placeholder="Enter your full name"
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
                                <Label>Profile Photo (Optional)</Label>
                                <ProfilePhotoUpload
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
                                    <Label htmlFor="email">Email (Optional)</Label>
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
                                    <p className="text-xs text-muted-foreground">
                                        This will be your unique referral ID
                                    </p>
                                    {isCheckingVolunteerId && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            Checking availability...
                                        </p>
                                    )}
                                    {!isCheckingVolunteerId && volunteer_id && volunteer_id.trim() !== "" && !volunteerIdExists && !errors.volunteer_id && (
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
                                        <Label htmlFor="password">Password *</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Minimum 8 characters"
                                            {...register("password")}
                                        />
                                        {errors.password && (
                                            <p className="text-sm text-destructive">{errors.password.message}</p>
                                        )}
                                    </div>
                                    <br />
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
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

                            {/* Delivery Address Section */}
                            <AddressSection
                                form={{ register, setValue, watch, formState: { errors } }}
                                variant="volunteer"
                                showLocationLink={true}
                                defaultCollapsed={false}
                            />

                            {/* Info Banner */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                <p className="text-sm text-center text-muted-foreground">
                                    Your account will be reviewed by an admin before you can log in.
                                    You&apos;ll be notified once approved.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4">
                                <Button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Create Account
                                        </>
                                    )}
                                </Button>
                                <Link href="/volunteer/login" className="flex-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full rounded-2xl"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                            </div>

                            <p className="text-xs text-center text-muted-foreground">
                                * Required fields
                            </p>

                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">
                                    Already have an account?{" "}
                                    <Link href="/volunteer/login" className="text-primary hover:underline font-medium">
                                        Log in here
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
