"use client";

import { useState } from "react";
import { MapPin, Navigation, X } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { toast } from "sonner";

// Dynamically import MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/ui/map-component"), {
    ssr: false,
    loading: () => (
        <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground">Loading map...</p>
        </div>
    ),
});

interface LocationPickerProps {
    onLocationSelect: (address: {
        houseBuilding: string;
        town: string;
        post: string;
        city: string;
        district: string;
        state: string;
        pincode: string;
    }) => void;
}

export function LocationPicker({ onLocationSelect }: LocationPickerProps) {
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    const handleCurrentLocation = async () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            toast.info("Please use 'Pick on Map' to select your location", {
                duration: 4000,
            });
            return;
        }

        setIsLoadingLocation(true);

        // Try with high accuracy first, fallback to low accuracy
        const attemptGeolocation = (enableHighAccuracy: boolean) => {
            return new Promise<GeolocationPosition>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error("TIMEOUT"));
                }, 8000);

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        clearTimeout(timeoutId);
                        resolve(position);
                    },
                    (error) => {
                        clearTimeout(timeoutId);
                        reject(error);
                    },
                    {
                        enableHighAccuracy,
                        timeout: 8000,
                        maximumAge: enableHighAccuracy ? 0 : 30000, // Allow older position for low accuracy
                    }
                );
            });
        };

        try {
            // Try high accuracy first
            let position: GeolocationPosition;
            try {
                position = await attemptGeolocation(true);
                toast.info("Location found with high accuracy!");
            } catch (firstError) {
                // If high accuracy fails, try low accuracy
                console.log("High accuracy failed, trying low accuracy...");
                toast.info("Trying alternative location method...");
                position = await attemptGeolocation(false);
                toast.info("Location found!");
            }

            const { latitude, longitude } = position.coords;
            await fetchAddressFromCoords(latitude, longitude);
        } catch (error: any) {
            let errorMessage = "Unable to retrieve your location";
            let shouldShowMapSuggestion = true;

            if (error?.code === 1 || error?.message === "PERMISSION_DENIED") {
                errorMessage = "Location permission denied. Please enable location access in your browser settings.";
            } else if (error?.code === 2 || error?.message === "POSITION_UNAVAILABLE") {
                errorMessage = "Location unavailable. Your device may not have GPS.";
            } else if (error?.code === 3 || error?.message === "TIMEOUT") {
                errorMessage = "Location request timed out.";
            }

            toast.error(errorMessage);

            if (shouldShowMapSuggestion) {
                // Auto-suggest map picking
                setTimeout(() => {
                    toast.info("💡 Try using 'Pick on Map' for easy location selection", {
                        duration: 5000,
                    });
                }, 1000);
            }

            console.error("Geolocation error:", error);
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const fetchAddressFromCoords = async (lat: number, lng: number) => {
        try {
            // Use Nominatim for reverse geocoding (free, no API key needed)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
                {
                    headers: {
                        "Accept-Language": "en",
                    },
                }
            );

            if (!response.ok) throw new Error("Geocoding failed");

            const data = await response.json();
            const address = data.address || {};

            console.log("Address data from Nominatim:", address); // For debugging

            // Parse address components with robust fallbacks
            const parsedAddress = {
                houseBuilding:
                    address.house_number
                        ? `${address.house_number} ${address.road || ""}`.trim()
                        : address.road || address.neighbourhood || address.suburb || "",

                town:
                    address.suburb ||
                    address.neighbourhood ||
                    address.village ||
                    address.hamlet ||
                    address.quarter ||
                    "",

                post:
                    address.postcode ||
                    "",

                city:
                    address.city ||
                    address.town ||
                    address.municipality ||
                    address.county ||
                    "",

                district:
                    address.county ||
                    address.state_district ||
                    address.region ||
                    "",

                state:
                    address.state ||
                    address.province ||
                    "",

                pincode:
                    address.postcode ||
                    "",
            };

            onLocationSelect(parsedAddress);

            // Show helpful message if some fields are missing
            const missingFields = Object.entries(parsedAddress)
                .filter(([key, value]) => !value)
                .map(([key]) => key);

            if (missingFields.length > 0) {
                toast.success("Location detected! Some fields may need manual entry.", {
                    description: "Please verify and complete the address details."
                });
            } else {
                toast.success("Location detected! All address fields filled.");
            }

        } catch (error) {
            console.error("Geocoding error:", error);
            toast.error("Failed to fetch address from location. Please enter address manually or try a different location.");
        }
    };

    const handleMapLocationSelect = (lat: number, lng: number) => {
        fetchAddressFromCoords(lat, lng);
        setIsMapOpen(false);
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCurrentLocation}
                    disabled={isLoadingLocation}
                    className="rounded-xl"
                >
                    <Navigation className="w-4 h-4 mr-2" />
                    {isLoadingLocation ? "Getting Location..." : "Use Current Location"}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMapOpen(true)}
                    className="rounded-xl"
                >
                    <MapPin className="w-4 h-4 mr-2" />
                    Pick on Map
                </Button>
            </div>

            <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Select Your Location</DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-4"
                            onClick={() => setIsMapOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Click or drag the marker to select your delivery location
                        </p>
                        <MapComponent onLocationSelect={handleMapLocationSelect} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
