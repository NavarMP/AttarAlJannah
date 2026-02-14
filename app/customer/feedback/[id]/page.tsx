"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/lib/contexts/customer-auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Star, ImageIcon, CheckCircle, AlertCircle, Mail, Phone, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CustomerFeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { user, loading: authLoading } = useCustomerAuth();
    const router = useRouter();
    const [feedback, setFeedback] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

    useEffect(() => {
        params.then(setResolvedParams);
    }, [params]);

    const fetchFeedback = useCallback(async () => {
        if (!user || !resolvedParams) return;

        try {
            // Retrieve phone number to authorize the request if needed (though API handles it via session + phone param logic now)
            // But we are hitting `api/feedback/[id]`. 
            // WAIT - `api/feedback/[id]` is ADMIN ONLY currently!
            // I need to update `api/feedback/[id]` to allow OWNER access too.
            // Or create a new endpoint?
            // Actually, I should update `api/feedback/[id]/route.ts` to allow if user_id matches or phone matches!

            // For now, let's assume I will fix the API.
            const phoneParam = user.phone ? `?phone=${encodeURIComponent(user.phone)}` : "";
            const response = await fetch(`/api/feedback/${resolvedParams.id}${phoneParam}`);
            if (!response.ok) {
                if (response.status === 403 || response.status === 401) {
                    throw new Error("You don't have permission to view this feedback");
                }
                throw new Error("Failed to fetch feedback");
            }
            const data = await response.json();
            setFeedback(data.feedback);
        } catch (error: any) {
            console.error("Error fetching feedback:", error);
            toast.error(error.message);
            router.push("/customer/dashboard");
        } finally {
            setLoading(false);
        }
    }, [user, resolvedParams, router]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/customer/login");
        } else if (user && resolvedParams) {
            fetchFeedback();
        }
    }, [user, authLoading, resolvedParams, fetchFeedback, router]);

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-5 w-5 ${star <= rating ? "fill-yellow-400 stroke-yellow-400" : "stroke-muted-foreground"}`}
                    />
                ))}
            </div>
        );
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!feedback) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-gold-500/10 p-4 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/customer/dashboard">
                        <Button variant="outline" size="icon" className="rounded-xl glass-strong">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Feedback Details</h1>
                        <p className="text-muted-foreground">ID: {feedback.id.slice(0, 8)}...</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <Card className="glass-strong rounded-3xl border-primary/20">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    {/* <Badge variant="outline" className="capitalize px-3 py-1 mb-2 w-fit">
                                        {feedback.category?.replace("_", " ")}
                                    </Badge> */}
                                    <CardTitle className="text-xl">{feedback.name}</CardTitle>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Mail className="h-4 w-4" />
                                                {feedback.email}
                                            </div>
                                            {feedback.phone && (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="h-4 w-4" />
                                                    {feedback.phone}
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
                                </div>
                                <div className={`px-4 py-2 rounded-xl border ${feedback.status === 'resolved' ? 'bg-green-100 border-green-200 text-green-700' :
                                    feedback.status === 'new' ? 'bg-blue-100 border-blue-200 text-blue-700' :
                                        'bg-gray-100 border-gray-200 text-gray-700'
                                    }`}>
                                    <div className="flex items-center gap-2 font-medium capitalize">
                                        {feedback.status === 'resolved' ? <CheckCircle className="w-4 h-4" /> :
                                            feedback.status === 'new' ? <AlertCircle className="w-4 h-4" /> : null}
                                        {feedback.status.replace("_", " ")}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {feedback.admin_reply && (
                                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                    <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                                        <Image src="/typography.svg" width={20} height={20} alt="Admin" className="w-5 h-5" />
                                        Admin Response
                                    </h3>
                                    <p className="text-foreground/90">{feedback.admin_reply}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Ratings */}
                    <Card className="glass-strong rounded-2xl">
                        <CardHeader>
                            <CardTitle>Your Ratings</CardTitle>
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

                    {feedback.product_photo_url && (
                        <Card className="glass-strong rounded-3xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5" />
                                    Attached Photo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative w-full aspect-video md:aspect-[2/1] rounded-2xl overflow-hidden border border-border">
                                    <Image
                                        src={feedback.product_photo_url}
                                        alt="Feedback attachment"
                                        fill
                                        className="object-contain bg-black/5"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
