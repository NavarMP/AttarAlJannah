"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { LocationLink } from "@/components/forms/location-link";
import { Loader2, ChevronDown, ChevronUp, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { INDIAN_STATES, DISTRICTS_BY_STATE } from "@/lib/data/indian-locations";

interface AddressSectionProps {
    form: any; // react-hook-form instance with register, setValue, watch, formState
    variant?: 'order' | 'volunteer';
    showLocationLink?: boolean;
    defaultCollapsed?: boolean;
}

export function AddressSection({
    form,
    variant = 'order',
    showLocationLink = false,
    defaultCollapsed = variant === 'volunteer'
}: AddressSectionProps) {
    const { register, setValue, watch, formState: { errors } } = form;

    // Collapsible state
    const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);

    // Pincode lookup state
    const [postOffices, setPostOffices] = useState<string[]>([]);
    const [postOfficeData, setPostOfficeData] = useState<any[]>([]);
    const [isLoadingPincode, setIsLoadingPincode] = useState(false);
    const [pincodeError, setPincodeError] = useState<string>("");
    const [isPincodeValid, setIsPincodeValid] = useState<boolean | null>(null);

    // Track last fetched pincode to prevent duplicate API calls
    const lastFetchedPincode = useRef<string>("");

    // Watch form fields
    const pincode = watch("pincode");
    const selectedPost = watch("post");

    // Fetch pincode details with useCallback to stabilize reference
    const fetchPincodeDetails = useCallback(async (pincodeValue: string) => {
        // Prevent duplicate fetches
        if (pincodeValue === lastFetchedPincode.current) {
            return;
        }

        if (pincodeValue.length !== 6) {
            setPostOffices([]);
            setPostOfficeData([]);
            setPincodeError("");
            setIsPincodeValid(null);
            return;
        }

        // Validate pincode format (6 digits only)
        if (!/^\d{6}$/.test(pincodeValue)) {
            setPincodeError("Pincode must be 6 digits");
            setIsPincodeValid(false);
            return;
        }

        lastFetchedPincode.current = pincodeValue;
        setIsLoadingPincode(true);
        setPincodeError("");
        setIsPincodeValid(null);

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincodeValue}`);
            const data = await response.json();

            if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
                const offices = data[0].PostOffice;
                const officeNames = offices.map((o: any) => o.Name);

                setPostOffices(officeNames);
                setPostOfficeData(offices);
                setIsPincodeValid(true);

                // Auto-populate district and state
                setValue("district", offices[0].District);
                setValue("state", offices[0].State);

                // Auto-select post office if only one available
                if (officeNames.length === 1) {
                    setValue("post", officeNames[0]);
                    setValue("city", offices[0].Name);
                }

                // Show success only once per unique pincode
                toast.success("Address details loaded!");
            } else {
                setPostOffices([]);
                setPostOfficeData([]);
                setPincodeError("Invalid pincode");
                setIsPincodeValid(false);
                toast.error("Invalid pincode");
            }
        } catch (error) {
            setPostOffices([]);
            setPostOfficeData([]);
            setPincodeError("Failed to fetch details");
            setIsPincodeValid(false);
            toast.error("Failed to fetch pincode details");
        } finally {
            setIsLoadingPincode(false);
        }
    }, [setValue]); // Only setValue in dependencies

    // Debounced pincode lookup
    useEffect(() => {
        if (!pincode) {
            setPostOffices([]);
            setPincodeError("");
            setIsPincodeValid(null);
            lastFetchedPincode.current = "";
            return;
        }

        // Live validation for incomplete pincode
        if (pincode.length < 6) {
            setIsPincodeValid(null);
            setPincodeError("");
            setPostOffices([]);
            lastFetchedPincode.current = ""; // Reset to allow re-fetching same pincode
            return;
        }

        // Debounce API call
        const timer = setTimeout(() => {
            fetchPincodeDetails(pincode);
        }, 500);

        return () => clearTimeout(timer);
    }, [pincode, fetchPincodeDetails]);

    // Auto-populate city when post office is selected
    useEffect(() => {
        if (selectedPost && postOfficeData.length > 0) {
            const selectedOffice = postOfficeData.find((o: any) => o.Name === selectedPost);
            if (selectedOffice) {
                setValue("city", selectedOffice.Name);
            }
        }
    }, [selectedPost, postOfficeData, setValue]);

    // Render validation icon for pincode
    const renderPincodeValidation = () => {
        if (isLoadingPincode) {
            return <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />;
        }
        if (isPincodeValid === true) {
            return <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />;
        }
        if (isPincodeValid === false) {
            return <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />;
        }
        return null;
    };

    const addressContent = (
        <div className="space-y-4">
            {variant === 'volunteer' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="font-semibold text-sm">Optional Delivery Address</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Provide your address to enable automatic order assignment in your area.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* House/Building */}
            <div className="space-y-2">
                <Label htmlFor="houseBuilding">House/Building {variant === 'order' && '*'}</Label>
                <Input
                    id="houseBuilding"
                    placeholder="House name or number"
                    {...register("houseBuilding")}
                />
                {errors.houseBuilding && (
                    <p className="text-sm text-destructive">{errors.houseBuilding.message as string}</p>
                )}
            </div>

            {/* Town/Village */}
            <div className="space-y-2">
                <Label htmlFor="town">Town/Village {variant === 'order' && '*'}</Label>
                <Input
                    id="town"
                    placeholder="Enter town or village name"
                    {...register("town")}
                />
                {errors.town && (
                    <p className="text-sm text-destructive">{errors.town.message as string}</p>
                )}
            </div>

            {/* Pincode - Primary lookup method */}
            <div className="space-y-2">
                <Label htmlFor="pincode">Pincode {variant === 'order' && '*'}</Label>
                <div className="relative">
                    <Input
                        id="pincode"
                        type="text"
                        placeholder="Enter 6-digit pincode"
                        maxLength={6}
                        {...register("pincode")}
                        className={isPincodeValid === false ? "border-destructive pr-10" : "pr-10"}
                    />
                    {renderPincodeValidation()}
                </div>
                {errors.pincode && (
                    <p className="text-sm text-destructive">{errors.pincode.message as string}</p>
                )}
                {pincodeError && !errors.pincode && (
                    <p className="text-sm text-destructive">{pincodeError}</p>
                )}
                {isPincodeValid === true && !errors.pincode && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">✓ Valid pincode</p>
                )}
            </div>

            {/* Post Office - Searchable dropdown */}
            <div className="space-y-2">
                <Label htmlFor="post">Post Office {variant === 'order' && '*'}</Label>
                <SearchableSelect
                    options={postOffices}
                    value={watch("post") || ""}
                    onChange={(value) => setValue("post", value)}
                    placeholder="Select post office"
                    emptyMessage={postOffices.length === 0 ? "Enter pincode to load post offices" : "No post offices found"}
                />
                {errors.post && (
                    <p className="text-sm text-destructive">{errors.post.message as string}</p>
                )}
            </div>


            {/* City - Auto-populated from post office */}
            <div className="space-y-2">
                <Label htmlFor="city">City {variant === 'order' && '*'}</Label>
                <Input
                    id="city"
                    // placeholder="City (auto-filled)"
                    {...register("city")}
                // readOnly
                // className="bg-muted/50"
                />
                {errors.city && (
                    <p className="text-sm text-destructive">{errors.city.message as string}</p>
                )}
            </div>

            {/* District - Auto-populated */}
            <div className="space-y-2">
                <Label htmlFor="district">District {variant === 'order' && '*'}</Label>
                <SearchableSelect
                    options={watch("state") ? DISTRICTS_BY_STATE[watch("state")] || [] : []}
                    value={watch("district") || ""}
                    onChange={(value) => setValue("district", value)}
                    placeholder="Select district"
                    emptyMessage="Select state first"
                />
                {errors.district && (
                    <p className="text-sm text-destructive">{errors.district.message as string}</p>
                )}
            </div>

            {/* State - Auto-populated */}
            <div className="space-y-2">
                <Label htmlFor="state">State {variant === 'order' && '*'}</Label>
                <SearchableSelect
                    options={INDIAN_STATES}
                    value={watch("state") || ""}
                    onChange={(value) => setValue("state", value)}
                    placeholder="Select state"
                />
                {errors.state && (
                    <p className="text-sm text-destructive">{errors.state.message as string}</p>
                )}
            </div>

            {/* Location Link - Volunteer only */}
            {showLocationLink && (
                <LocationLink
                    value={watch("locationLink") || ""}
                    onChange={(link: string) => setValue("locationLink", link)}
                />
            )}
        </div>
    );

    if (variant === 'volunteer') {
        return (
            <div className="space-y-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full justify-between rounded-2xl"
                >
                    <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Address (Optional)
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>

                {isExpanded && (
                    <Card className="p-6 space-y-4 border-2 border-dashed rounded-3xl">
                        {addressContent}
                    </Card>
                )}
            </div>
        );
    }

    return addressContent;
}
