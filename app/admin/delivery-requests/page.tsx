"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Package } from "lucide-react";
import { toast } from "sonner";
import { DeliveryRequest } from "@/types";

export default function AdminDeliveryRequestsPage() {
    const [requests, setRequests] = useState<DeliveryRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("pending");
    const [processing, setProcessing] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/delivery-requests?status=${statusFilter}`);
            if (!response.ok) throw new Error("Failed to fetch requests");

            const data = await response.json();
            setRequests(data.requests || []);
        } catch (error) {
            console.error("Error fetching delivery requests:", error);
            toast.error("Failed to load delivery requests");
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApprove = async (requestId: string) => {
        try {
            setProcessing(requestId);
            const response = await fetch("/api/admin/delivery-requests", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, action: "approve" }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to approve request");
            }

            toast.success("Delivery request approved successfully!");
            fetchRequests(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || "Failed to approve request");
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (requestId: string, notes?: string) => {
        try {
            setProcessing(requestId);
            const response = await fetch("/api/admin/delivery-requests", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, action: "reject", notes }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to reject request");
            }

            toast.success("Delivery request rejected");
            fetchRequests(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || "Failed to reject request");
        } finally {
            setProcessing(null);
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Delivery Requests</h1>
                <p className="text-muted-foreground">Manage volunteer delivery duty requests</p>
            </div>

            {/* Filters */}
            <Card className="glass-strong rounded-2xl">
                <CardContent className="pt-6">
                    <div className="flex gap-2">
                        <Button
                            variant={statusFilter === "pending" ? "default" : "outline"}
                            onClick={() => setStatusFilter("pending")}
                            className="rounded-xl"
                        >
                            Pending
                        </Button>
                        <Button
                            variant={statusFilter === "approved" ? "default" : "outline"}
                            onClick={() => setStatusFilter("approved")}
                            className="rounded-xl"
                        >
                            Approved
                        </Button>
                        <Button
                            variant={statusFilter === "rejected" ? "default" : "outline"}
                            onClick={() => setStatusFilter("rejected")}
                            className="rounded-xl"
                        >
                            Rejected
                        </Button>
                        <Button
                            variant={statusFilter === "all" ? "default" : "outline"}
                            onClick={() => setStatusFilter("all")}
                            className="rounded-xl"
                        >
                            All
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Requests List */}
            <Card className="glass-strong rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Delivery Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">Loading requests...</div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No {statusFilter !== "all" ? statusFilter : ""} delivery requests found
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <div key={request.id} className="p-4 border rounded-lg bg-card/50 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">
                                                    {request.volunteers?.name || "Unknown Volunteer"}
                                                </p>
                                                <span className="text-sm text-muted-foreground">
                                                    ({request.volunteers?.volunteer_id})
                                                </span>
                                            </div>
                                            <p className="text-sm">
                                                Order: <span className="font-medium">{request.orders?.customer_name}</span> - {request.orders?.quantity} bottles
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Requested: {new Date(request.requested_at).toLocaleString()}
                                            </p>
                                            {request.notes && (
                                                <p className="text-xs text-muted-foreground italic">{request.notes}</p>
                                            )}
                                        </div>
                                        {getStatusBadge(request.status)}
                                    </div>

                                    {request.status === "pending" && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(request.id)}
                                                disabled={processing === request.id}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                {processing === request.id ? "Processing..." : "Approve"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleReject(request.id)}
                                                disabled={processing === request.id}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    )}

                                    {request.status !== "pending" && request.responded_at && (
                                        <p className="text-xs text-muted-foreground">
                                            Responded: {new Date(request.responded_at).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
