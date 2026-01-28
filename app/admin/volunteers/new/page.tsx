"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { volunteerSchema, type VolunteerFormData } from "@/lib/validations/volunteer-schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, UserPlus, AlertCircle } from "lucide-react";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import { toast } from "sonner";
import Link from "next/link";

export default function NewVolunteerPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [phoneCountryCode, setPhoneCountryCode] = useState("+91");

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
            goal: 20,
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
    }, [volunteer_id, setError, clearErrors]);

    const onSubmit = async (data: VolunteerFormData) => {
        // Final check before submission
        if (nameExists || volunteerIdExists) {
            toast.error("Please fix duplicate errors before submitting");
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await fetch("/api/admin/volunteers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    phone: `${phoneCountryCode}${data.phone}`,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to create volunteer");
            }

            toast.success("Volunteer created successfully!");
            router.push("/admin/volunteers");

        } catch (error: any) {
            toast.error(error.message || "Failed to create volunteer");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/volunteers">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Add New Volunteer</h1>
                    <p className="text-muted-foreground mt-1">
                        Create a new volunteer account for the challenge
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card className="glass-strong">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Volunteer Information
                    </CardTitle>
                    <CardDescription>
                        Fill in the volunteer details. Volunteer ID will be auto-generated if left empty.
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
                                <Label htmlFor="volunteer_id">Volunteer ID</Label>
                                <div className="relative">
                                    <Input
                                        id="volunteer_id"
                                        placeholder="E.g., VOL001"
                                        className={volunteerIdExists ? "border-destructive" : ""}
                                        {...register("volunteer_id")}
                                    />
                                    {isCheckingVolunteerId && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Required (Unique ID for this volunteer)
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
                            <p className="text-xs text-muted-foreground">
                                Default: 20 verified sales
                            </p>
                            {errors.goal && (
                                <p className="text-sm text-destructive">{errors.goal.message}</p>
                            )}
                        </div>

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
                                        Creating Volunteer...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Create Volunteer
                                    </>
                                )}
                            </Button>
                            <Link href="/admin/volunteers" className="flex-1">
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

                        <p className="text-xs text-center text-muted-foreground">
                            * Required fields
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
