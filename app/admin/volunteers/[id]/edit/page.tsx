"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save, AlertCircle } from "lucide-react";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import { toast } from "sonner";
import Link from "next/link";

// Edit schema - password is optional
const volunteerEditSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phoneCountry: z.string().default("+91"),
    phone: z
        .string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number is too long"),
    volunteer_id: z.string().min(1, "Volunteer ID is required"),
    password: z.string().min(8, "Password must be at least 8 characters if provided").optional().or(z.literal("")),
    goal: z.number().min(1, "Goal must be at least 1").default(20),
});

type VolunteerEditFormData = z.infer<typeof volunteerEditSchema>;

export default function EditVolunteerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [phoneCountryCode, setPhoneCountryCode] = useState("+91");

    // Duplicate checking state
    const [isCheckingName, setIsCheckingName] = useState(false);
    const [isCheckingVolunteerId, setIsCheckingVolunteerId] = useState(false);
    const [nameExists, setNameExists] = useState(false);
    const [volunteerIdExists, setVolunteerIdExists] = useState(false);
    const [stats, setStats] = useState({
        confirmed_bottles: 0,
        goal: 20,
        stats: {
            totalBottles: 0,
            confirmedBottles: 0,
            pendingBottles: 0,
        },
    });

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        setError,
        clearErrors,
    } = useForm<VolunteerEditFormData>({
        resolver: zodResolver(volunteerEditSchema),
        mode: "onChange",
        defaultValues: {
            phoneCountry: "+91",
            goal: 20,
        },
    });

    const fetchVolunteer = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/admin/volunteers/${id}`);
            if (!response.ok) throw new Error("Failed to fetch volunteer");

            const data = await response.json();
            const volunteer = data.volunteer;

            // Parse phone number to separate country code
            let cleanPhone = volunteer.phone;
            let extractedCountryCode = "+91";

            // Try to extract country code
            if (cleanPhone.startsWith("+")) {
                // Find where digits start after +
                const match = cleanPhone.match(/^(\+\d{1,4})(.*)$/);
                if (match) {
                    extractedCountryCode = match[1];
                    cleanPhone = match[2];
                }
            }

            setPhoneCountryCode(extractedCountryCode);
            setValue("phoneCountry", extractedCountryCode);
            setValue("name", volunteer.name);
            setValue("email", volunteer.email || "");
            setValue("phone", cleanPhone);
            setValue("volunteer_id", volunteer.volunteer_id);
            setValue("password", "");
            setValue("goal", volunteer.goal || 20);

            setStats({
                confirmed_bottles: volunteer.confirmed_bottles || 0,
                goal: volunteer.goal || 20,
                stats: {
                    totalBottles: volunteer.stats?.totalBottles || 0,
                    confirmedBottles: volunteer.stats?.confirmedBottles || 0,
                    pendingBottles: volunteer.stats?.pendingBottles || 0,
                },
            });

        } catch (error) {
            toast.error("Failed to load volunteer");
            router.push("/admin/volunteers");
        } finally {
            setIsLoading(false);
        }
    }, [id, router, setValue]);

    useEffect(() => {
        fetchVolunteer();
    }, [fetchVolunteer]);


    const name = watch("name");
    const volunteer_id = watch("volunteer_id");

    // Check for duplicate name (debounced) - exclude current volunteer
    useEffect(() => {
        if (!name || name.length < 2 || !id) {
            setNameExists(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsCheckingName(true);
            try {
                const response = await fetch(
                    `/api/admin/volunteers/check-duplicate?name=${encodeURIComponent(name)}&excludeId=${id}`
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
    }, [name, id, setError, clearErrors]);

    // Check for duplicate volunteer_id (debounced) - exclude current volunteer
    useEffect(() => {
        if (!volunteer_id || volunteer_id.trim() === "" || !id) {
            setVolunteerIdExists(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsCheckingVolunteerId(true);
            try {
                const response = await fetch(
                    `/api/admin/volunteers/check-duplicate?volunteerId=${encodeURIComponent(volunteer_id)}&excludeId=${id}`
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
    }, [volunteer_id, id, setError, clearErrors]);
    const onSubmit = async (data: VolunteerEditFormData) => {
        // Final check before submission
        if (nameExists || volunteerIdExists) {
            toast.error("Please fix duplicate errors before submitting");
            return;
        }

        try {
            setIsSubmitting(true);

            const updateData: any = {
                name: data.name,
                email: data.email,
                phone: `${phoneCountryCode}${data.phone}`,
                volunteer_id: data.volunteer_id,
                goal: data.goal,
            };

            // Only include password if it's being changed
            if (data.password) {
                updateData.password = data.password;
            }

            const response = await fetch(`/api/admin/volunteers/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to update volunteer");
            }

            toast.success("Volunteer updated successfully!");
            router.push("/admin/volunteers");

        } catch (error: any) {
            toast.error(error.message || "Failed to update volunteer");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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
                    <h1 className="text-3xl font-bold">Edit Volunteer</h1>
                    <p className="text-muted-foreground mt-1">
                        Update volunteer information and progress
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card className="glass">
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Confirmed Bottles</div>
                        <div className="text-2xl font-bold text-emerald-500 mt-1">
                            {stats.confirmed_bottles}
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Total Bottles</div>
                        <div className="text-2xl font-bold mt-1">{stats.stats.totalBottles}</div>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Pending Bottles</div>
                        <div className="text-2xl font-bold mt-1">{stats.stats.pendingBottles}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Form */}
            <Card className="glass-strong">
                <CardHeader>
                    <CardTitle>Volunteer Information</CardTitle>
                    <CardDescription>
                        Update volunteer details. Leave password empty to keep current password.
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
                                        className={volunteerIdExists ? "border-destructive" : ""}
                                        {...register("volunteer_id")}
                                    />
                                    {isCheckingVolunteerId && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Be careful when changing this
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
                                <Label htmlFor="password">New Password (Optional)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Leave empty to keep current"
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
                                {...register("goal", { valueAsNumber: true })}
                            />
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
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
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
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
