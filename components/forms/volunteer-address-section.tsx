"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LocationLink } from "@/components/ui/location-link";

// Indian States and Districts
const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const indianDistricts = [
    "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
    "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
    "Kozhikode", "Wayanad", "Kannur", "Kasaragod",
];

interface VolunteerAddressSectionProps {
    form: UseFormReturn<any>;
}

export function VolunteerAddressSection({ form }: VolunteerAddressSectionProps) {
    const { register, setValue, watch, formState: { errors } } = form;

    const [isExpanded, setIsExpanded] = useState(false);
    const [postOffices, setPostOffices] = useState<string[]>([]);
    const [postOfficeData, setPostOfficeData] = useState<any[]>([]);
    const [isLoadingPincode, setIsLoadingPincode] = useState(false);
    const [pincodeError, setPincodeError] = useState<string>("");

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
                setPostOfficeData(offices);

                // Auto-populate district and state
                setValue("district", offices[0].District);
                setValue("state", offices[0].State);

                // Auto-select post office if only one available
                if (officeNames.length === 1) {
                    setValue("post", officeNames[0]);
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

    // Watch pincode and trigger lookup
    const pincode = watch("pincode");
    useEffect(() => {
        if (pincode && pincode.length === 6) {
            fetchPincodeDetails(pincode);
        } else if (pincode && pincode.length < 6) {
            setPostOffices([]);
            setPincodeError("");
        }
    }, [pincode]);

    // Watch post office selection and update city
    const selectedPost = watch("post");
    useEffect(() => {
        if (selectedPost && postOfficeData.length > 0) {
            const selectedOffice = postOfficeData.find((o: any) => o.Name === selectedPost);
            if (selectedOffice) {
                setValue("city", selectedOffice.Name);
            }
        }
    }, [selectedPost, postOfficeData, setValue]);

    return (
        <div className="space-y-4">
            {/* Collapsible Header */}
            <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between rounded-xl"
            >
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Delivery Address (Optional)</span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                ) : (
                    <ChevronDown className="h-4 w-4" />
                )}
            </Button>

            {/* Address Form (Collapsible) */}
            {isExpanded && (
                <Card className="p-6 space-y-4 border-2 border-dashed">
                    {/* Info Banner */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <p className="text-sm text-center text-muted-foreground">
                            💡  Orders matching this address will be automatically assigned for delivery
                        </p>
                    </div>

                    {/* House/Building */}
                    <div className="space-y-2">
                        <Label htmlFor="houseBuilding">House/Building Name</Label>
                        <Input
                            id="houseBuilding"
                            placeholder="House/Flat No., Building Name"
                            {...register("houseBuilding")}
                        />
                        {errors.houseBuilding && (
                            <p className="text-sm text-destructive">{errors.houseBuilding.message as string}</p>
                        )}
                    </div>

                    {/* Town */}
                    <div className="space-y-2">
                        <Label htmlFor="town">Town/Locality</Label>
                        <Input
                            id="town"
                            placeholder="Town/Locality"
                            {...register("town")}
                        />
                        {errors.town && (
                            <p className="text-sm text-destructive">{errors.town.message as string}</p>
                        )}
                    </div>

                    {/* Pincode */}
                    <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode</Label>
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
                            <p className="text-sm text-destructive">{errors.pincode.message as string}</p>
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

                    {/* Post Office */}
                    <div className="space-y-2">
                        <Label htmlFor="post">Post Office</Label>
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
                            <p className="text-sm text-destructive">{errors.post.message as string}</p>
                        )}
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                            id="city"
                            placeholder="City"
                            {...register("city")}
                        />
                        {errors.city && (
                            <p className="text-sm text-destructive">{errors.city.message as string}</p>
                        )}
                    </div>

                    {/* District and State */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="district">District</Label>
                            <SearchableSelect
                                options={indianDistricts}
                                value={watch("district")}
                                onChange={(val) => setValue("district", val, { shouldValidate: true })}
                                placeholder="Select District"
                                searchPlaceholder="Search District..."
                            />
                            <input type="hidden" {...register("district")} />
                            {errors.district && (
                                <p className="text-sm text-destructive">{errors.district.message as string}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <SearchableSelect
                                options={indianStates}
                                value={watch("state")}
                                onChange={(val) => setValue("state", val, { shouldValidate: true })}
                                placeholder="Select State"
                                searchPlaceholder="Search State..."
                            />
                            <input type="hidden" {...register("state")} />
                            {errors.state && (
                                <p className="text-sm text-destructive">{errors.state.message as string}</p>
                            )}
                        </div>
                    </div>

                    {/* Location Link */}
                    <LocationLink
                        value={watch("locationLink") || ""}
                        onChange={(link) => setValue("locationLink", link)}
                    />
                </Card>
            )}
        </div>
    );
}
