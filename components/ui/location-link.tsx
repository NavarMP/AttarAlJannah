"use client";

import { useState } from "react";
import { MapPin, Navigation, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { toast } from "sonner";

interface LocationLinkProps {
    value: string;
    onChange: (link: string) => void;
}

export function LocationLink({ value, onChange }: LocationLinkProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const getCurrentLocationLink = async () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsGenerating(true);
        toast.info("Getting your current location...");

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
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
                        enableHighAccuracy: true,
                        timeout: 8000,
                        maximumAge: 0,
                    }
                );
            });

            const { latitude, longitude } = position.coords;
            const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

            onChange(googleMapsLink);
            toast.success("Location link generated!");
        } catch (error: any) {
            let errorMessage = "Unable to retrieve your location";

            if (error?.code === 1 || error?.message === "PERMISSION_DENIED") {
                errorMessage = "Location permission denied. Please enable location access in your browser settings.";
            } else if (error?.code === 2 || error?.message === "POSITION_UNAVAILABLE") {
                errorMessage = "Location unavailable. Your device may not have GPS.";
            } else if (error?.code === 3 || error?.message === "TIMEOUT") {
                errorMessage = "Location request timed out.";
            }

            toast.error(errorMessage);
            console.error("Geolocation error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const openMapPicker = () => {
        toast.info("Opening Google Maps...");
        window.open("https://www.google.com/maps", "_blank");
        toast.success("Copy the location link from Google Maps and paste it below", {
            duration: 5000,
            description: "Right-click on a location → 'Copy link to share'"
        });
    };

    return (
        <div className="space-y-3">
            <Label htmlFor="locationLink">
                Delivery Location (Optional)
            </Label>
            <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocationLink}
                        disabled={isGenerating}
                        className="rounded-xl"
                    >
                        <Navigation className="w-4 h-4 mr-2" />
                        {isGenerating ? "Getting Location..." : "Use Current Location"}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openMapPicker}
                        className="rounded-xl"
                    >
                        <MapPin className="w-4 h-4 mr-2" />
                        Pick on Map
                    </Button>
                </div>

                <div className="flex gap-2">
                    <div className="flex items-center justify-center px-3 border border-border rounded-xl bg-muted">
                        <LinkIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <Input
                        id="locationLink"
                        type="url"
                        placeholder="Paste Google Maps link here (optional)"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="flex-1"
                    />
                    {value && (
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(value, "_blank")}
                            className="rounded-xl shrink-0"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">
                    Share your exact delivery location using Google Maps link. This helps us deliver faster and more accurately.
                </p>
            </div>
        </div>
    );
}
