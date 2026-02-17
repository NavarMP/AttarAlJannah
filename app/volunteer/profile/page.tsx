"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfilePhotoUpload } from "@/components/custom/profile-photo-upload";
import { AddressSection } from "@/components/forms/address-section";
import { CountryCodeSelect, COUNTRY_CODES } from "@/components/ui/country-code-select";
import { toast } from "sonner";
import {
    Loader2,
    Edit,
    Save,
    X,
    Target,
    TrendingUp,
    Package,
    DollarSign,
    ArrowLeft,
    Mail,
    Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getInitials } from "@/lib/utils/image-utils";
import Link from "next/link";
import { ShareButton } from "@/components/ui/share-button";

// Validation schema (excluding goal and password fields)
const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phoneCountry: z.string(),
    phone: z.string().min(10, "Phone must be at least 10 digits"),
    houseBuilding: z.string().optional(),
    town: z.string().optional(),
    pincode: z.string().optional(),
    post: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
    locationLink: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function VolunteerProfilePage() {
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileData, setProfileData] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [phoneCountryCode, setPhoneCountryCode] = useState("+91");

    // Profile photo management
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        reset,
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            phoneCountry: "+91",
        },
    });

    const fetchProfile = useCallback(async () => {
        try {
            setIsLoadingProfile(true);
            const response = await fetch("/api/volunteer/profile");

            if (!response.ok) {
                throw new Error("Failed to fetch profile");
            }

            const data = await response.json();
            setProfileData(data.volunteer);
            setStats(data.stats);

            // Extract phone country code
            // Extract phone country code
            const fullPhone = data.volunteer.phone || "";
            let countryCode = "+91";
            let phoneNumber = fullPhone;

            if (fullPhone.startsWith("+")) {
                const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
                const matched = sortedCodes.find(c => fullPhone.startsWith(c.code));

                if (matched) {
                    countryCode = matched.code;
                    phoneNumber = fullPhone.slice(matched.code.length);
                } else {
                    countryCode = "+91";
                    phoneNumber = fullPhone.replace(/^\+/, '').replace(/^91/, '');
                }
            }

            setPhoneCountryCode(countryCode);
            setProfilePhotoPreview(data.volunteer.profile_photo);

            // Set form values
            reset({
                name: data.volunteer.name,
                email: data.volunteer.email || "",
                phoneCountry: countryCode,
                phone: phoneNumber,
                houseBuilding: data.volunteer.house_building || "",
                town: data.volunteer.town || "",
                pincode: data.volunteer.pincode || "",
                post: data.volunteer.post || "",
                city: data.volunteer.city || "",
                district: data.volunteer.district || "",
                state: data.volunteer.state || "",
                locationLink: data.volunteer.location_link || "",
            });

        } catch (error) {
            console.error("Profile fetch error:", error);
            toast.error("Failed to load profile");
        } finally {
            setIsLoadingProfile(false);
        }
    }, [reset]);

    // Check auth and fetch profile
    useEffect(() => {
        const id = localStorage.getItem("volunteerId");
        const name = localStorage.getItem("volunteerName");

        if (!id || !name) {
            toast.error("Please login to view your profile");
            router.push("/volunteer/login");
            return;
        }

        fetchProfile();
    }, [router, fetchProfile]);

    const onSubmit = async (data: ProfileFormData) => {
        try {
            setIsSaving(true);

            const response = await fetch("/api/volunteer/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    phone: `${phoneCountryCode}${data.phone}`,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update profile");
            }

            const result = await response.json();
            setProfileData(result.volunteer);
            setIsEditing(false);
            toast.success("Profile updated successfully!");

        } catch (error) {
            console.error("Profile update error:", error);
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoUpload = async () => {
        if (!profilePhotoFile || !profileData) return;

        try {
            setIsUploadingPhoto(true);

            // Upload photo to storage
            const photoFormData = new FormData();
            photoFormData.append("file", profilePhotoFile);
            photoFormData.append("volunteerId", profileData.volunteer_id);

            const uploadResponse = await fetch("/api/upload/profile-photo", {
                method: "POST",
                body: photoFormData,
            });

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload photo");
            }

            const uploadResult = await uploadResponse.json();

            // Update profile with new photo URL
            const updateResponse = await fetch("/api/volunteer/profile/photo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photoUrl: uploadResult.photoUrl }),
            });

            if (!updateResponse.ok) {
                throw new Error("Failed to update profile photo");
            }

            setProfileData({ ...profileData, profile_photo: uploadResult.photoUrl });
            setProfilePhotoPreview(uploadResult.photoUrl);
            setProfilePhotoFile(null);
            toast.success("Profile photo updated!");

        } catch (error) {
            console.error("Photo upload error:", error);
            toast.error("Failed to upload photo");
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handlePhotoDelete = async () => {
        try {
            setIsUploadingPhoto(true);

            const response = await fetch("/api/volunteer/profile/photo", {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete photo");
            }

            setProfileData({ ...profileData, profile_photo: null });
            setProfilePhotoPreview(null);
            toast.success("Profile photo removed!");

        } catch (error) {
            console.error("Photo delete error:", error);
            toast.error("Failed to remove photo");
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    // Construct share URL
    const shareUrl = typeof window !== "undefined" && profileData
        ? `${window.location.origin}/profile/${profileData.volunteer_id}`
        : "";

    if (isLoadingProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profileData) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/volunteer/dashboard"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>

                    {profileData && stats && (
                        <ShareButton
                            data={{
                                title: `Support ${profileData.name} on Attar Al Jannah`,
                                text: `Check out ${profileData.name}'s volunteer profile! They've sold ${stats.totalBottles} bottles so far.`,
                                url: shareUrl,
                            }}
                            variant="outline"
                        />
                    )}
                </div>

                {/* Profile Header Card */}
                <Card className="glass-strong rounded-3xl">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                            {/* Profile Photo */}
                            <div className="space-y-3">
                                <Avatar className="w-32 h-32 border-4 border-border">
                                    <AvatarImage src={profilePhotoPreview || undefined} />
                                    <AvatarFallback className="text-3xl font-semibold bg-gradient-to-br from-primary to-gold-500 text-white">
                                        {getInitials(profileData.name)}
                                    </AvatarFallback>
                                </Avatar>

                                {isEditing && (
                                    <div className="space-y-2">
                                        <ProfilePhotoUpload
                                            currentPhotoUrl={profilePhotoPreview}
                                            volunteerName={profileData.name}
                                            onPhotoChange={(file, preview) => {
                                                setProfilePhotoFile(file);
                                                if (preview) setProfilePhotoPreview(preview);
                                            }}
                                            size="sm"
                                        />
                                        {profilePhotoFile && (
                                            <Button
                                                onClick={handlePhotoUpload}
                                                disabled={isUploadingPhoto}
                                                size="sm"
                                                className="w-full"
                                            >
                                                {isUploadingPhoto ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    "Save Photo"
                                                )}
                                            </Button>
                                        )}
                                        {profilePhotoPreview && !profilePhotoFile && (
                                            <Button
                                                onClick={handlePhotoDelete}
                                                disabled={isUploadingPhoto}
                                                variant="destructive"
                                                size="sm"
                                                className="w-full"
                                            >
                                                Remove Photo
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Profile Info */}
                            <div className="flex-1 space-y-4 text-center md:text-left">
                                <div>
                                    <h1 className="text-3xl font-bold">{profileData.name}</h1>
                                    <p className="text-muted-foreground">@{profileData.volunteer_id}</p>
                                </div>

                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    <Badge variant={profileData.status === "active" ? "default" : "secondary"}>
                                        {profileData.status}
                                    </Badge>
                                    {profileData.email && (
                                        <Badge variant="outline" className="gap-1">
                                            <Mail className="w-3 h-3" />
                                            {profileData.email}
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className="gap-1">
                                        <Phone className="w-3 h-3" />
                                        {profileData.phone}
                                    </Badge>
                                </div>

                                {!isEditing && (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        className="gap-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit Profile
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid md:grid-cols-4 gap-4">
                        <Card className="glass rounded-2xl">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-full bg-primary/10">
                                        <Package className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bottles Sold</p>
                                        <p className="text-2xl font-bold">{stats.totalBottles}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass rounded-2xl">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-full bg-gold-500/10">
                                        <Target className="w-5 h-5 text-gold-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Goal</p>
                                        <p className="text-2xl font-bold">{stats.goal}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass rounded-2xl">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-full bg-emerald-500/10">
                                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Progress</p>
                                        <p className="text-2xl font-bold">{stats.goalProgress}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass rounded-2xl">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-full bg-blue-500/10">
                                        <DollarSign className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Commission</p>
                                        <p className="text-2xl font-bold">₹{stats.commission.toFixed(2)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Goal Progress */}
                {stats && (
                    <Card className="glass rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg">Goal Progress</CardTitle>
                            <CardDescription>
                                {stats.totalBottles} / {stats.goal} bottles sold
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Progress value={stats.goalProgress} className="h-3" />
                        </CardContent>
                    </Card>
                )}

                {/* Profile Details Form */}
                <Card className="glass-strong rounded-3xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>
                                    {isEditing ? "Update your profile details" : "View your profile details"}
                                </CardDescription>
                            </div>
                            {isEditing && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setIsEditing(false);
                                        reset();
                                        setProfilePhotoFile(null);
                                        setProfilePhotoPreview(profileData.profile_photo);
                                    }}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    {...register("name")}
                                    disabled={!isEditing}
                                    className={!isEditing ? "bg-muted" : ""}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                            </div>

                            {/* Email and Phone */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        {...register("email")}
                                        disabled={!isEditing}
                                        className={!isEditing ? "bg-muted" : ""}
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
                                            disabled={!isEditing}
                                        />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            {...register("phone")}
                                            disabled={!isEditing}
                                            className={`flex-1 ${!isEditing ? "bg-muted" : ""}`}
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Address Section */}
                            <AddressSection
                                form={{ register, watch, setValue, formState: { errors } } as any}
                                variant="volunteer"
                                showLocationLink={true}
                                defaultCollapsed={!isEditing}
                            />

                            {/* Action Buttons */}
                            {isEditing && (
                                <div className="flex gap-3 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditing(false);
                                            reset();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="gap-2"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
