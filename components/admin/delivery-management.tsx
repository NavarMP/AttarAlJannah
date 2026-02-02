"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface DeliveryManagementProps {
    orderId: string;
    volunteerId?: string;
    isDeliveryDuty?: boolean;
    deliveryMethod?: string;
    deliveryFee?: number;
    onRefresh: () => void;
}

interface ValidationState {
    valid: boolean;
    message?: string;
    volunteer?: {
        uuid: string;
        name: string;
        id: string;
        phone: string;
    };
}

export function DeliveryManagement({
    orderId,
    volunteerId,
    isDeliveryDuty,
    deliveryMethod,
    deliveryFee,
    onRefresh
}: DeliveryManagementProps) {
    const [deliveryRequests, setDeliveryRequests] = useState<any[]>([]);
    const [volunteerIdInput, setVolunteerIdInput] = useState("");
    const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState("volunteer");
    const [assigning, setAssigning] = useState(false);
    const [loading, setLoading] = useState(true);

    // Real-time validation state
    const [validationState, setValidationState] = useState<ValidationState>({ valid: false });
    const [validating, setValidating] = useState(false);



    // Debounced real-time validation
    useEffect(() => {
        if (selectedDeliveryMethod !== "volunteer") {
            setValidationState({ valid: false });
            return;
        }

        if (volunteerIdInput.length < 3) {
            setValidationState({
                valid: false,
                message: volunteerIdInput.length > 0 ? "Enter at least 3 characters" : undefined
            });
            return;
        }

        const timer = setTimeout(async () => {
            setValidating(true);
            try {
                const response = await fetch(`/api/validate/volunteer?id=${encodeURIComponent(volunteerIdInput)}`);
                const data = await response.json();
                setValidationState(data);
            } catch (error) {
                setValidationState({ valid: false, message: "Validation error" });
            } finally {
                setValidating(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [volunteerIdInput, selectedDeliveryMethod]);

    const fetchDeliveryRequests = useCallback(async () => {
        try {
            const response = await fetch(`/api/admin/delivery-requests?orderId=${orderId}`);
            if (response.ok) {
                const data = await response.json();
                setDeliveryRequests(data.requests || []);
            }
        } catch (error) {
            console.error("Failed to fetch delivery requests:", error);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchDeliveryRequests();
    }, [fetchDeliveryRequests]);

    const handleAssign = async () => {
        if (selectedDeliveryMethod === "volunteer" && !validationState.valid) {
            toast.error("Please enter a valid volunteer ID");
            return;
        }

        setAssigning(true);
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/assign-delivery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    volunteerId: selectedDeliveryMethod === "volunteer" ? volunteerIdInput : null,
                    deliveryMethod: selectedDeliveryMethod,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to assign");
            }

            const data = await response.json();
            toast.success(
                selectedDeliveryMethod === "volunteer"
                    ? `Delivery assigned to ${data.volunteer.name}`
                    : `Delivery method set to ${selectedDeliveryMethod}`
            );
            setVolunteerIdInput("");
            setValidationState({ valid: false });
            onRefresh();
            fetchDeliveryRequests();
        } catch (error: any) {
            toast.error(error.message || "Failed to assign delivery");
        } finally {
            setAssigning(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
            case "approved":
                return <Badge variant="outline" className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
            case "rejected":
                return <Badge variant="outline" className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const hasDeliveryVolunteer = volunteerId && isDeliveryDuty;

    return (
        <div className="space-y-6">
            {/* Current Delivery Info */}
            <Card className="rounded-3xl">
                <CardHeader>
                    <CardTitle>Delivery Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {hasDeliveryVolunteer ? (
                        <>
                            <div>
                                <p className="text-sm text-muted-foreground">Delivery Method</p>
                                <p className="font-medium capitalize">{deliveryMethod || "volunteer"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Delivery Volunteer ID</p>
                                <p className="font-medium">{volunteerId}</p>
                            </div>
                            {deliveryFee && deliveryFee > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Delivery Fee</p>
                                    <p className="font-medium">₹{deliveryFee}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-muted-foreground">No delivery volunteer assigned yet</p>
                    )}
                </CardContent>
            </Card>

            {/* Manual Assignment */}
            {!hasDeliveryVolunteer && (
                <Card className="rounded-3xl border-primary/50">
                    <CardHeader>
                        <CardTitle>Assign Delivery Volunteer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="deliveryMethodSelect" className="text-sm font-medium">Delivery Method</label>
                            <select
                                id="deliveryMethodSelect"
                                value={selectedDeliveryMethod}
                                onChange={(e) => setSelectedDeliveryMethod(e.target.value)}
                                className="w-full px-3 py-2 border rounded-xl bg-background"
                            >
                                <option value="volunteer">Volunteer Delivery</option>
                                <option value="courier">Courier</option>
                                <option value="post">Post</option>
                                <option value="pickup">Pickup</option>
                            </select>
                        </div>

                        {/* Conditional Volunteer ID Field */}
                        {selectedDeliveryMethod === "volunteer" && (
                            <div className="space-y-2">
                                <label htmlFor="volunteerIdInput" className="text-sm font-medium">Volunteer ID</label>
                                <div className="relative">
                                    <input
                                        id="volunteerIdInput"
                                        type="text"
                                        placeholder="Enter volunteer ID (e.g., VOL001)"
                                        value={volunteerIdInput}
                                        onChange={(e) => setVolunteerIdInput(e.target.value)}
                                        className="w-full px-3 py-2 pr-10 border rounded-xl bg-background"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {validating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                                        {!validating && validationState.valid && <Check className="w-4 h-4 text-green-600" />}
                                        {!validating && !validationState.valid && volunteerIdInput.length >= 3 && (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                        )}
                                    </div>
                                </div>

                                {/* Validation Feedback */}
                                {validationState.valid && validationState.volunteer && (
                                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-green-900">
                                                    {validationState.volunteer.name}
                                                </p>
                                                <p className="text-xs text-green-700">
                                                    {validationState.volunteer.id} • {validationState.volunteer.phone}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {!validationState.valid && validationState.message && (
                                    <p className="text-xs text-red-600">{validationState.message}</p>
                                )}
                            </div>
                        )}

                        <Button
                            onClick={handleAssign}
                            disabled={
                                assigning ||
                                (selectedDeliveryMethod === "volunteer" && !validationState.valid)
                            }
                            className="w-full rounded-2xl"
                        >
                            {assigning ? "Assigning..." : "Assign Delivery"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Delivery Requests */}
            {deliveryRequests.length > 0 && (
                <Card className="rounded-3xl">
                    <CardHeader>
                        <CardTitle>Delivery Requests for this Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-muted-foreground">Loading...</p>
                        ) : (
                            <div className="space-y-3">
                                {deliveryRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="p-3 border rounded-lg bg-card/50 flex justify-between items-center"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {request.volunteers?.name || "Unknown"} ({request.volunteers?.volunteer_id})
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Requested: {new Date(request.requested_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {getStatusBadge(request.status)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
