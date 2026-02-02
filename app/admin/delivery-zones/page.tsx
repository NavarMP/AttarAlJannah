"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    volunteer_delivery_zones: { count: number }[];
}

export default function AdminZonesPage() {
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        district: "",
        state: "Kerala",
        pincodes: "" as string,
        useRange: false,
        pincodeStart: "",
        pincodeEnd: ""
    });

    useEffect(() => {
        fetchZones();
    }, []);

    const fetchZones = async () => {
        try {
            const response = await fetch("/api/admin/delivery-zones");
            const data = await response.json();
            setZones(data.zones || []);
        } catch (error) {
            toast.error("Failed to load zones");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload: any = {
                name: formData.name,
                description: formData.description,
                district: formData.district,
                state: formData.state
            };

            if (formData.useRange) {
                payload.pincodeStart = formData.pincodeStart;
                payload.pincodeEnd = formData.pincodeEnd;
            } else {
                // Split pincodes by comma and trim
                payload.pincodes = formData.pincodes
                    .split(",")
                    .map(p => p.trim())
                    .filter(p => p.length > 0);
            }

            const response = await fetch("/api/admin/delivery-zones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Failed to create zone");

            toast.success("Zone created successfully");
            setShowForm(false);
            setFormData({
                name: "",
                description: "",
                district: "",
                state: "Kerala",
                pincodes: "",
                useRange: false,
                pincodeStart: "",
                pincodeEnd: ""
            });
            fetchZones();
        } catch (error) {
            toast.error("Failed to create zone");
        }
    };

    const deleteZone = async (id: string) => {
        if (!confirm("Are you sure you want to delete this zone?")) return;

        try {
            const response = await fetch(`/api/admin/delivery-zones/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) throw new Error("Failed to delete zone");

            toast.success("Zone deleted successfully");
            fetchZones();
        } catch (error) {
            toast.error("Failed to delete zone");
        }
    };

    return (
        <main className="min-h-screen p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard">
                            <Button variant="outline" className="rounded-2xl">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Delivery Zones</h1>
                            <p className="text-muted-foreground">Manage delivery zones and pincode assignments</p>
                        </div>
                    </div>
                    <Button onClick={() => setShowForm(true)} className="rounded-2xl">
                        <Plus className="w-4 h-4 mr-2" />
                        New Zone
                    </Button>
                </div>

                {/* Create Zone Form */}
                {showForm && (
                    <Card className="rounded-3xl border-primary/50">
                        <CardHeader>
                            <CardTitle>Create New Zone</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Zone Name</label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Kozhikode Central"
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">District</label>
                                        <Input
                                            value={formData.district}
                                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                            placeholder="e.g., Kozhikode"
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Description (Optional)</label>
                                    <Input
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of the zone"
                                        className="rounded-xl"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="useRange"
                                        checked={formData.useRange}
                                        onChange={(e) => setFormData({ ...formData, useRange: e.target.checked })}
                                    />
                                    <label htmlFor="useRange" className="text-sm">Use pincode range instead of list</label>
                                </div>

                                {formData.useRange ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">Start Pincode</label>
                                            <Input
                                                value={formData.pincodeStart}
                                                onChange={(e) => setFormData({ ...formData, pincodeStart: e.target.value })}
                                                placeholder="673001"
                                                className="rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">End Pincode</label>
                                            <Input
                                                value={formData.pincodeEnd}
                                                onChange={(e) => setFormData({ ...formData, pincodeEnd: e.target.value })}
                                                placeholder="673010"
                                                className="rounded-xl"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-sm font-medium">Pincodes (comma-separated)</label>
                                        <Input
                                            value={formData.pincodes}
                                            onChange={(e) => setFormData({ ...formData, pincodes: e.target.value })}
                                            placeholder="673001, 673002, 673003"
                                            className="rounded-xl"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Enter pincodes separated by commas
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button type="submit" className="rounded-2xl">Create Zone</Button>
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-2xl">
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Zones List */}
                <div className="grid gap-4">
                    {loading ? (
                        <p className="text-center text-muted-foreground">Loading zones...</p>
                    ) : zones.length === 0 ? (
                        <Card className="rounded-3xl">
                            <CardContent className="p-12 text-center">
                                <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-lg text-muted-foreground">No delivery zones yet</p>
                                <p className="text-sm text-muted-foreground">Create your first zone to get started</p>
                            </CardContent>
                        </Card>
                    ) : (
                        zones.map((zone) => (
                            <Card key={zone.id} className="rounded-3xl">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold">{zone.name}</h3>
                                                {zone.is_active ? (
                                                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Inactive</Badge>
                                                )}
                                            </div>

                                            {zone.description && (
                                                <p className="text-sm text-muted-foreground mb-3">{zone.description}</p>
                                            )}

                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">District:</span>{" "}
                                                    <span className="font-medium">{zone.district}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">State:</span>{" "}
                                                    <span className="font-medium">{zone.state}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {zone.volunteer_delivery_zones?.[0]?.count || 0}
                                                    </span>
                                                    <span className="text-muted-foreground">volunteers</span>
                                                </div>
                                            </div>

                                            <div className="mt-3">
                                                <p className="text-xs text-muted-foreground mb-1">Pincodes:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {zone.pincode_start && zone.pincode_end ? (
                                                        <Badge variant="outline" className="rounded-lg">
                                                            {zone.pincode_start} - {zone.pincode_end}
                                                        </Badge>
                                                    ) : (
                                                        zone.pincodes?.map((pincode) => (
                                                            <Badge key={pincode} variant="outline" className="rounded-lg">
                                                                {pincode}
                                                            </Badge>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteZone(zone.id)}
                                                className="rounded-xl"
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
