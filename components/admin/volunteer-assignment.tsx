"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, AlertCircle, CheckCircle, Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface Volunteer {
    id: string;
    name: string;
    volunteer_id: string;
    phone: string;
}

interface VolunteerAssignmentProps {
    orderId: string;
    currentVolunteerId?: string | null;
    onAssignmentChange?: () => void;
}

export function VolunteerAssignment({ orderId, currentVolunteerId, onAssignmentChange }: VolunteerAssignmentProps) {
    const [matchingVolunteers, setMatchingVolunteers] = useState<Volunteer[]>([]);
    const [allVolunteers, setAllVolunteers] = useState<Volunteer[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>(currentVolunteerId || "");

    const fetchVolunteers = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch matching volunteers
            const matchingRes = await fetch(`/api/admin/orders/${orderId}/matching-volunteers`);
            if (matchingRes.ok) {
                const matchingData = await matchingRes.json();
                setMatchingVolunteers(matchingData.matches || []);
            }

            // Fetch all active volunteers for manual selection
            const allRes = await fetch("/api/admin/volunteers?limit=1000");
            if (allRes.ok) {
                const allData = await allRes.json();
                setAllVolunteers(allData.volunteers || []);
            }
        } catch (error) {
            console.error("Failed to fetch volunteers:", error);
            toast.error("Failed to load volunteers");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchVolunteers();
    }, [fetchVolunteers]);

    const handleAssignVolunteer = async () => {
        if (!selectedVolunteerId) {
            toast.error("Please select a volunteer");
            return;
        }

        setAssigning(true);
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/reassign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ volunteerId: selectedVolunteerId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to assign volunteer");
            }

            const selectedVolunteer = allVolunteers.find(v => v.id === selectedVolunteerId);
            toast.success(`Assigned to ${selectedVolunteer?.name || "volunteer"}`);

            if (onAssignmentChange) {
                onAssignmentChange();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to assign volunteer");
        } finally {
            setAssigning(false);
        }
    };

    const handleRemoveVolunteer = async () => {
        setAssigning(true);
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/reassign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ volunteerId: null }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to remove volunteer");
            }

            toast.success("Volunteer assignment removed");
            setSelectedVolunteerId("");

            if (onAssignmentChange) {
                onAssignmentChange();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to remove volunteer");
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <Card className="rounded-3xl">
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-3xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Delivery Volunteer Assignment
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Auto-Assignment Status */}
                {matchingVolunteers.length > 0 && (
                    <div className={`p-4 rounded-xl border-2 ${matchingVolunteers.length === 1
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-amber-500/10 border-amber-500/30"
                        }`}>
                        <div className="flex items-start gap-3">
                            {matchingVolunteers.length === 1 ? (
                                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <p className="font-semibold text-sm">
                                    {matchingVolunteers.length === 1
                                        ? "✓ Single Match Found (Auto-Assigned)"
                                        : `⚠️ ${matchingVolunteers.length} Matching Volunteers Found`
                                    }
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {matchingVolunteers.length === 1
                                        ? "This order was automatically assigned to the matching volunteer."
                                        : "Multiple volunteers match this delivery address. Please select one manually."
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Display Matching Volunteers */}
                        <div className="mt-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Matching Volunteers:</p>
                            {matchingVolunteers.map((volunteer) => (
                                <div
                                    key={volunteer.id}
                                    className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                                >
                                    <div>
                                        <p className="font-medium text-sm">{volunteer.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {volunteer.volunteer_id} • {volunteer.phone}
                                        </p>
                                    </div>
                                    {currentVolunteerId === volunteer.id && (
                                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                            Currently Assigned
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {matchingVolunteers.length === 0 && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/30">
                        <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                                <p className="font-semibold text-sm">No Matching Volunteers</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    No volunteers found with matching delivery address. Assign manually below.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manual Assignment */}
                <div className="space-y-3 pt-2">
                    <Label htmlFor="volunteer-select">
                        {currentVolunteerId ? "Reassign Volunteer" : "Assign Volunteer"}
                    </Label>
                    <Select
                        value={selectedVolunteerId}
                        onValueChange={setSelectedVolunteerId}
                    >
                        <SelectTrigger id="volunteer-select">
                            <SelectValue placeholder="Select a volunteer" />
                        </SelectTrigger>
                        <SelectContent>
                            {allVolunteers
                                .filter(v => v.id !== currentVolunteerId) // Don't show currently assigned volunteer
                                .map((volunteer) => (
                                    <SelectItem key={volunteer.id} value={volunteer.id}>
                                        {volunteer.name} ({volunteer.volunteer_id})
                                    </SelectItem>
                                ))
                            }
                        </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleAssignVolunteer}
                            disabled={assigning || !selectedVolunteerId}
                            className="flex-1 bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl"
                        >
                            {assigning ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                currentVolunteerId ? "Reassign Volunteer" : "Assign Volunteer"
                            )}
                        </Button>

                        {currentVolunteerId && (
                            <Button
                                onClick={handleRemoveVolunteer}
                                disabled={assigning}
                                variant="outline"
                                className="rounded-2xl"
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                </div>

                {currentVolunteerId && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">
                            💡 Tip: Removing the volunteer will unassign this delivery. You can then assign a different volunteer.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
