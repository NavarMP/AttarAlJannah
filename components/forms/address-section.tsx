"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { LocationLink } from "@/components/forms/location-link";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { useAddressAutocomplete } from "@/hooks/use-address-autocomplete";
import { Loader2, ChevronDown, ChevronUp, MapPin, CheckCircle2, XCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { INDIAN_STATES, DISTRICTS_BY_STATE } from "@/lib/data/indian-locations";
import { useTranslation } from "@/lib/i18n/translations";

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
    const { t } = useTranslation();

    // Collapsible state (for volunteer variant)
    const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);

    // Collapsible state for City/District/State in order variant
    const [showExtraFields, setShowExtraFields] = useState(false);

    // Pincode lookup state
    const [postOffices, setPostOffices] = useState<string[]>([]);
    const [postOfficeData, setPostOfficeData] = useState<any[]>([]);
    const [isLoadingPincode, setIsLoadingPincode] = useState(false);
    const [pincodeError, setPincodeError] = useState<string>("");
    const [isPincodeValid, setIsPincodeValid] = useState<boolean | null>(null);

    // Post office search state
    const [postOfficeSearchResults, setPostOfficeSearchResults] = useState<any[]>([]);
    const [isSearchingPostOffice, setIsSearchingPostOffice] = useState(false);

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

                // Auto-expand City/District/State when auto-filled
                if (variant === 'order') {
                    setShowExtraFields(true);
                }

                // Show success only once per unique pincode
                toast.success(t("toast.addressLoaded", "Address details loaded!"));
            } else {
                setPostOffices([]);
                setPostOfficeData([]);
                setPincodeError(t("toast.invalidPincode", "Invalid pincode"));
                setIsPincodeValid(false);
                toast.error(t("toast.invalidPincode", "Invalid pincode"));
            }
        } catch (error) {
            setPostOffices([]);
            setPostOfficeData([]);
            setPincodeError(t("toast.fetchFailed", "Failed to fetch details"));
            setIsPincodeValid(false);
            toast.error(t("toast.fetchFailed", "Failed to fetch pincode details"));
        } finally {
            setIsLoadingPincode(false);
        }
    }, [setValue, t, variant]); // Only setValue in dependencies

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

    // Watch form fields for autocomplete
    const houseBuilding = watch("houseBuilding") || "";
    const town = watch("town") || "";

    // Geoapify autocomplete hooks
    const houseBuildingAutocomplete = useAddressAutocomplete({
        query: houseBuilding,
        enabled: houseBuilding.length >= 3,
        minLength: 3,
        debounceMs: 500,
    });

    const townAutocomplete = useAddressAutocomplete({
        query: town,
        enabled: town.length >= 3,
        minLength: 3,
        debounceMs: 500,
    });

    // Search post offices by name
    const searchPostOffices = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 3) {
            setPostOfficeSearchResults([]);
            return;
        }

        setIsSearchingPostOffice(true);
        try {
            const response = await fetch(
                `https://api.postalpincode.in/postoffice/${encodeURIComponent(searchQuery)}`
            );
            const data = await response.json();

            if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
                setPostOfficeSearchResults(data[0].PostOffice);
            } else {
                setPostOfficeSearchResults([]);
            }
        } catch (error) {
            console.error("Post office search error:", error);
            toast.error("Failed to search post offices");
            setPostOfficeSearchResults([]);
        } finally {
            setIsSearchingPostOffice(false);
        }
    }, []);

    // Handle post office selection from search
    const handlePostOfficeSelect = useCallback((office: any) => {
        setValue("post", office.Name);
        setValue("pincode", office.Pincode);
        setValue("city", office.Name);
        setValue("district", office.District);
        setValue("state", office.State);
        setPincodeError("");
        setIsPincodeValid(true);
        setPostOfficeSearchResults([]);

        // Auto-expand City/District/State when auto-filled
        if (variant === 'order') {
            setShowExtraFields(true);
        }

        toast.success(t("toast.addressAutoFilled", "Address auto-filled!"));
    }, [setValue, t, variant]);

    // Deduplicate and format post office options
    const postOfficeOptions = useMemo(() => {
        const allOffices = [...postOfficeData, ...postOfficeSearchResults];
        const uniqueMap = new Map();
        allOffices.forEach(o => {
            const key = `${o.Name}-${o.Pincode}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, {
                    value: key,
                    label: o.Name,
                    subLabel: o.Pincode,
                    original: o
                });
            }
        });
        return Array.from(uniqueMap.values());
    }, [postOfficeData, postOfficeSearchResults]);

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
                            <p className="font-semibold text-sm">Delivery Address</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Provide your address to enable automatic order assignment in your area.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* House/Building with Autocomplete */}
            <div className="space-y-2">
                <Label htmlFor="houseBuilding">{t("address.houseBuilding", "House/Building")} {variant === 'order' && '*'}</Label>
                <AutocompleteInput
                    id="houseBuilding"
                    value={houseBuilding}
                    onChange={(value) => setValue("houseBuilding", value)}
                    suggestions={houseBuildingAutocomplete.suggestions}
                    loading={houseBuildingAutocomplete.loading}
                    placeholder={t("address.housePlaceholder", "House name or number")}
                />
                {errors.houseBuilding && (
                    <p className="text-sm text-destructive">{errors.houseBuilding.message as string}</p>
                )}
            </div>

            {/* Town/Village with Autocomplete */}
            <div className="space-y-2">
                <Label htmlFor="town">{t("address.town", "Town/Village")} {variant === 'order' && '*'}</Label>
                <AutocompleteInput
                    id="town"
                    value={town}
                    onChange={(value) => setValue("town", value)}
                    suggestions={townAutocomplete.suggestions}
                    loading={townAutocomplete.loading}
                    placeholder={t("address.townPlaceholder", "Enter town or village name")}
                />
                {errors.town && (
                    <p className="text-sm text-destructive">{errors.town.message as string}</p>
                )}
            </div>

            {/* Pincode - Primary lookup method */}
            <div className="space-y-2">
                <Label htmlFor="pincode">{t("address.pincode", "Pincode")} {variant === 'order' && '*'}</Label>
                <span className="text-xs text-muted-foreground ml-2">
                    {t("address.pincodeHint", "(Input a pincode to auto-fill district and state)")}
                </span>
                <div className="relative">
                    <Input
                        id="pincode"
                        type="text"
                        placeholder={t("address.pincodePlaceholder", "Enter 6-digit pincode")}
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
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("address.validPincode", "✓ Valid pincode")}</p>
                )}
            </div>

            {/* Post Office - Smart searchable dropdown */}
            <div className="space-y-2">
                <Label htmlFor="post">
                    {t("address.postOffice", "Post Office")} {variant === 'order' && '*'}
                    <span className="text-xs text-muted-foreground ml-2">
                        {t("address.postHint", "(Type to search by name to auto-fill all address fields)")}
                    </span>
                </Label>
                <SearchableSelect
                    options={postOfficeOptions}
                    value={watch("post") || ""}
                    onChange={(selectedValue) => {
                        // value is unique key "Name-Pincode"

                        // Find original in the memoized options
                        const selectedOption = postOfficeOptions.find((o: any) => o.value === selectedValue);

                        if (selectedOption) {
                            handlePostOfficeSelect(selectedOption.original);
                        } else {
                            // Fallback for direct text input or legacy state
                            setValue("post", selectedValue);
                        }
                    }}
                    placeholder={t("address.selectPostOffice", "Select or search post office")}
                    searchPlaceholder={t("address.searchPostOffice", "Type post office name or select from list...")}
                    emptyMessage={postOffices.length === 0 && postOfficeSearchResults.length === 0
                        ? t("address.enterPincodeOrSearch", "Enter pincode or type post office name to search")
                        : t("address.noPostOffice", "No post offices found")}
                    onCustomSearch={(query) => searchPostOffices(query)}
                    isSearching={isSearchingPostOffice}
                />
                {errors.post && (
                    <p className="text-sm text-destructive">{errors.post.message as string}</p>
                )}
            </div>

            {/* City, District, State — Collapsible in order variant */}
            {variant === 'order' ? (
                <div className="space-y-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowExtraFields(!showExtraFields)}
                        className="w-full justify-between rounded-xl text-xs h-9"
                    >
                        <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {showExtraFields
                                ? t("address.hideMore", "Hide City, District & State")
                                : t("address.showMore", "Show City, District & State")}
                        </span>
                        {showExtraFields ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>

                    {showExtraFields && (
                        <div className="space-y-4 pl-1 border-l-2 border-primary/20 ml-1">
                            <p className="text-xs text-muted-foreground pl-3">
                                {t("address.autoFilledHint", "These fields are auto-filled from pincode/post office")}
                            </p>

                            {/* City */}
                            <div className="space-y-2 pl-3">
                                <Label htmlFor="city">{t("address.city", "City")} *</Label>
                                <Input
                                    id="city"
                                    {...register("city")}
                                />
                                {errors.city && (
                                    <p className="text-sm text-destructive">{errors.city.message as string}</p>
                                )}
                            </div>

                            {/* District */}
                            <div className="space-y-2 pl-3">
                                <Label htmlFor="district">{t("address.district", "District")} *</Label>
                                <SearchableSelect
                                    options={watch("state") ? DISTRICTS_BY_STATE[watch("state")] || [] : []}
                                    value={watch("district") || ""}
                                    onChange={(value) => setValue("district", value)}
                                    placeholder={t("address.selectDistrict", "Select district")}
                                    emptyMessage={t("address.selectStateFirst", "Select state first")}
                                />
                                {errors.district && (
                                    <p className="text-sm text-destructive">{errors.district.message as string}</p>
                                )}
                            </div>

                            {/* State */}
                            <div className="space-y-2 pl-3">
                                <Label htmlFor="state">{t("address.state", "State")} *</Label>
                                <SearchableSelect
                                    options={INDIAN_STATES}
                                    value={watch("state") || ""}
                                    onChange={(value) => setValue("state", value)}
                                    placeholder={t("address.selectState", "Select state")}
                                />
                                {errors.state && (
                                    <p className="text-sm text-destructive">{errors.state.message as string}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* City - Auto-populated from post office */}
                    <div className="space-y-2">
                        <Label htmlFor="city">{t("address.city", "City")}</Label>
                        <Input
                            id="city"
                            {...register("city")}
                        />
                        {errors.city && (
                            <p className="text-sm text-destructive">{errors.city.message as string}</p>
                        )}
                    </div>

                    {/* District - Auto-populated */}
                    <div className="space-y-2">
                        <Label htmlFor="district">{t("address.district", "District")}</Label>
                        <SearchableSelect
                            options={watch("state") ? DISTRICTS_BY_STATE[watch("state")] || [] : []}
                            value={watch("district") || ""}
                            onChange={(value) => setValue("district", value)}
                            placeholder={t("address.selectDistrict", "Select district")}
                            emptyMessage={t("address.selectStateFirst", "Select state first")}
                        />
                        {errors.district && (
                            <p className="text-sm text-destructive">{errors.district.message as string}</p>
                        )}
                    </div>

                    {/* State - Auto-populated */}
                    <div className="space-y-2">
                        <Label htmlFor="state">{t("address.state", "State")}</Label>
                        <SearchableSelect
                            options={INDIAN_STATES}
                            value={watch("state") || ""}
                            onChange={(value) => setValue("state", value)}
                            placeholder={t("address.selectState", "Select state")}
                        />
                        {errors.state && (
                            <p className="text-sm text-destructive">{errors.state.message as string}</p>
                        )}
                    </div>
                </>
            )}

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
                        Delivery Address
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
