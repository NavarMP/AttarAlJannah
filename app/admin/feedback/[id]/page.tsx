"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Star, Loader2, Mail, Phone, Calendar, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [feedback, setFeedback] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Admin fields
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [adminReply, setAdminReply] = useState("");

    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

    useEffect(() => {
        params.then((p) => {
            setResolvedParams(p);
        });
    }, [params]);

    const fetchFeedback = useCallback(async () => {
        if (!resolvedParams) return; // Keep this check as resolvedParams is still async

        try {
            const response = await fetch(`/api/feedback/${resolvedParams.id}`);
            if (!response.ok) throw new Error("Failed to fetch feedback");
            const data = await response.json();
            setFeedback(data.feedback);
            setStatus(data.feedback.status);
            setPriority(data.feedback.priority);
            setAdminNotes(data.feedback.admin_notes || "");
            setAdminReply(data.feedback.admin_reply || "");
        } catch (error: any) { // Changed error type to any for consistency with snippet
            console.error("Error fetching feedback:", error);
            toast.error(error.message || "Failed to load feedback"); // Changed error message handling
            router.push("/admin/feedback"); // Added from snippet
        } finally {
            setLoading(false);
        }
    }, [resolvedParams, router]); // Dependencies updated to include resolvedParams and router

    useEffect(() => {
        if (resolvedParams) { // Keep this check to ensure resolvedParams is available
            fetchFeedback();
        }
    }, [fetchFeedback, resolvedParams]); // Dependency on fetchFeedback and resolvedParams

    const handleUpdate = async () => {
        if (!resolvedParams) return;

        setUpdating(true);
        try {
            const response = await fetch(`/api/feedback/${resolvedParams.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status,
                    priority,
                    admin_notes: adminNotes,
                    admin_reply: adminReply,
                }),
            });

            if (!response.ok) throw new Error("Failed to update feedback");
            toast.success("Feedback updated successfully");
            fetchFeedback();
        } catch (error: any) {
            console.error("Error updating feedback:", error);
            toast.error(error.message || "Failed to update feedback");
        } finally {
            setUpdating(false);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-5 w-5 ${star <= rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-muted-foreground"
                            }`}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!feedback) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Feedback not found</p>
                <Link href="/admin/feedback">
                    <Button variant="outline" className="mt-4 rounded-xl">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/feedback">
                    <Button variant="outline" size="icon" className="rounded-xl">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Feedback Details</h1>
                    <p className="text-muted-foreground">ID: {feedback.id.slice(0, 8)}...</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Feedback Information */}
                    <Card className="glass-strong rounded-2xl">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <CardTitle>{feedback.name}</CardTitle>
                                {/* <Badge className="capitalize">
                                    {feedback.category.replace("_", " ")}
                                </Badge> */}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    {feedback.name === "Anonymous" ? <span className="italic text-xs">Hidden</span> : feedback.email}
                                </div>
                                {feedback.phone && (
                                    <div className="flex items-center gap-1">
                                        <Phone className="h-4 w-4" />
                                        {feedback.name === "Anonymous" ? <span className="italic text-xs">Hidden</span> : feedback.phone}
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(feedback.created_at).toLocaleString()}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-medium mb-2">Message</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback.message}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ratings */}
                    <Card className="glass-strong rounded-2xl">
                        <CardHeader>
                            <CardTitle>Customer Ratings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Overall Experience</span>
                                {renderStars(feedback.rating_overall)}
                                <span className="text-lg font-bold">{feedback.rating_overall}/5</span>
                            </div>

                            {feedback.rating_packing && (
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Packing Quality</span>
                                    {renderStars(feedback.rating_packing)}
                                    <span className="text-lg font-bold">{feedback.rating_packing}/5</span>
                                </div>
                            )}

                            {feedback.rating_delivery && (
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Delivery Experience</span>
                                    {renderStars(feedback.rating_delivery)}
                                    <span className="text-lg font-bold">{feedback.rating_delivery}/5</span>
                                </div>
                            )}

                            {feedback.rating_ordering && (
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Ordering Process</span>
                                    {renderStars(feedback.rating_ordering)}
                                    <span className="text-lg font-bold">{feedback.rating_ordering}/5</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Product Photo */}
                    {feedback.product_photo_url && (
                        <Card className="glass-strong rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5" />
                                    Product Photo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-4">
                                    <p className="text-sm font-medium mb-2">Product Photo:</p>
                                    <div className="relative w-full max-w-md aspect-video">
                                        <Image
                                            src={feedback.product_photo_url}
                                            alt="Product"
                                            fill
                                            className="rounded-xl border-2 border-border object-contain"
                                            unoptimized
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Admin Actions */}
                <div className="space-y-6">
                    <Card className="glass-strong rounded-2xl">
                        <CardHeader>
                            <CardTitle>Admin Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="new">New</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Admin Notes (Internal)</label>
                                <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Internal notes for team..."
                                    className="rounded-xl min-h-[100px]"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Reply to Customer</label>
                                <Textarea
                                    value={adminReply}
                                    onChange={(e) => setAdminReply(e.target.value)}
                                    placeholder="This will be sent to the customer via notification..."
                                    className="rounded-xl min-h-[100px]"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Customer will receive a notification when you add/update a reply
                                </p>
                            </div>

                            <Button
                                onClick={handleUpdate}
                                disabled={updating}
                                className="w-full rounded-xl"
                            >
                                {updating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
