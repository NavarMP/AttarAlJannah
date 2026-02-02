"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface DeliveryZone {
    id: string;
    name: string;
    description?: string;
    district: string;
    state: string;
    pincodes: string[];
    pincode_start?: string;
    pincode_end?: string;
    is_active: boolean;
}

export default function VolunteerZonesPage() {
    const [allZones, setAllZones] = useState<DeliveryZone[]>([]);
    const [myZones, setMyZones] = useState<DeliveryZone[]>([]);
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [volunteerId, setVolunteerId] = useState("");

    useEffect(() => {
        // Get volunteer ID from localStorage
        const storedId = localStorage.getItem("volunteerId");
        if (storedId) {
            setVolunteerId(storedId);
            fetchZones(storedId);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchZones = async (volId: string) => {
        try {
            // Fetch all active zones
            const zonesResponse = await fetch("/api/admin/delivery-zones?active=true");
            const zonesData = await zonesResponse.json();
            setAllZones(zonesData.zones || []);

            // Fetch volunteer's assigned zones
            const myZonesResponse = await fetch(`/api/volunteer/zones?volunteerId=${volId}`);
            const myZonesData = await myZonesResponse.json();
            setMyZones(myZonesData.zones || []);
            setSelectedZones(myZonesData.zones?.map((z: DeliveryZone) => z.id) || []);
        } catch (error) {
            toast.error("Failed to load zones");
        } finally {
            setLoading(false);
        }
    };

    const toggleZone = (zoneId: string) => {
        setSelectedZones((prev) =>
            prev.includes(zoneId)
                ? prev.filter((id) => id !== zoneId)
                : [...prev, zoneId]
        );
    };

    const saveZones = async () => {
        try {
            const response = await fetch("/api/volunteer/zones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    volunteerId,
                    zoneIds: selectedZones
                })
            });

            if (!response.ok) throw new Error("Failed to save zones");

            toast.success("Delivery zones updated successfully!");
            fetchZones(volunteerId);
        } catch (error) {
            toast.error("Failed to save zones");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading zones...</p>
            </div>
        );
    }

    if (!volunteerId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="rounded-3xl max-w-md">
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">Please log in to manage your delivery zones</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">My Delivery Zones</h1>
                    <p className="text-muted-foreground">Select the areas where you can deliver</p>
                </div>

                <div className="grid gap-4">
                    {allZones.length === 0 ? (
                        <Card className="rounded-3xl">
                            <CardContent className="p-12 text-center">
                                <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-lg text-muted-foreground">No delivery zones available</p>
                                <p className="text-sm text-muted-foreground">Contact admin to set up delivery zones</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {allZones.map((zone) => {
                                const isSelected = selectedZones.includes(zone.id);
                                return (
                                    <Card
                                        key={zone.id}
                                        className={`rounded-3xl cursor-pointer transition-all ${isSelected
                                                ? "border-primary bg-primary/5"
                                                : "hover:border-primary/50"
                                            }`}
                                        onClick={() => toggleZone(zone.id)}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="text-lg font-semibold">{zone.name}</h3>
                                                        {isSelected && (
                                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                                        )}
                                                    </div>

                                                    {zone.description && (
                                                        <p className="text-sm text-muted-foreground mb-3">
                                                            {zone.description}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-wrap gap-4 text-sm mb-3">
                                                        <div>
                                                            <span className="text-muted-foreground">District:</span>{" "}
                                                            <span className="font-medium">{zone.district}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">State:</span>{" "}
                                                            <span className="font-medium">{zone.state}</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">Pincodes:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {zone.pincode_start && zone.pincode_end ? (
                                                                <Badge variant="outline" className="rounded-lg">
                                                                    {zone.pincode_start} - {zone.pincode_end}
                                                                </Badge>
                                                            ) : (
                                                                zone.pincodes?.slice(0, 5).map((pincode) => (
                                                                    <Badge
                                                                        key={pincode}
                                                                        variant="outline"
                                                                        className="rounded-lg"
                                                                    >
                                                                        {pincode}
                                                                    </Badge>
                                                                ))
                                                            )}
                                                            {zone.pincodes?.length > 5 && (
                                                                <Badge variant="outline" className="rounded-lg">
                                                                    +{zone.pincodes.length - 5} more
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            <div className="flex justify-center pt-4">
                                <Button onClick={saveZones} size="lg" className="rounded-2xl">
                                    Save Delivery Zones
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
