"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RatingInput } from "@/components/feedback/rating-input";
import { useCustomerAuth } from "@/lib/contexts/customer-auth-context";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle2, Camera, User, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CameraCapture } from "@/components/ui/camera-capture";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function CustomerFeedbackPage() {
    const router = useRouter();
    const { user, customerProfile, loading: authLoading } = useCustomerAuth();
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [trackingId, setTrackingId] = useState("");

    // Privacy
    const [isAnonymous, setIsAnonymous] = useState(false);

    // Ratings & Comments
    const [ratingPacking, setRatingPacking] = useState(0);
    const [commentPacking, setCommentPacking] = useState("");

    const [ratingDelivery, setRatingDelivery] = useState(0);
    const [commentDelivery, setCommentDelivery] = useState("");

    const [ratingOrdering, setRatingOrdering] = useState(0);
    const [commentOrdering, setCommentOrdering] = useState("");

    const [ratingOverall, setRatingOverall] = useState(0);
    const [commentOverall, setCommentOverall] = useState("");

    // Product photo
    const [productPhoto, setProductPhoto] = useState<File | null>(null);
    const [productPhotoUrl, setProductPhotoUrl] = useState("");
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ ratingOverall?: string; commentOverall?: string }>({});

    // Load saved data
    useEffect(() => {
        const savedData = localStorage.getItem("feedbackDraft");
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setRatingOverall(parsed.ratingOverall || 0);
                setCommentOverall(parsed.commentOverall || "");
                setRatingPacking(parsed.ratingPacking || 0);
                setCommentPacking(parsed.commentPacking || "");
                setRatingDelivery(parsed.ratingDelivery || 0);
                setCommentDelivery(parsed.commentDelivery || "");
                setRatingOrdering(parsed.ratingOrdering || 0);
                setCommentOrdering(parsed.commentOrdering || "");
                setIsAnonymous(parsed.isAnonymous || false);
            } catch (e) {
                console.error("Failed to load saved feedback", e);
            }
        }
    }, []);

    // Save data on change
    useEffect(() => {
        const data = {
            ratingOverall, commentOverall,
            ratingPacking, commentPacking,
            ratingDelivery, commentDelivery,
            ratingOrdering, commentOrdering,
            isAnonymous
        };
        localStorage.setItem("feedbackDraft", JSON.stringify(data));
    }, [ratingOverall, commentOverall, ratingPacking, commentPacking, ratingDelivery, commentDelivery, ratingOrdering, commentOrdering, isAnonymous]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            toast.error("Please login to submit feedback");
            router.push("/customer/login?returnUrl=/customer/feedback");
        }
    }, [user, authLoading, router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
        if (!validTypes.includes(file.type)) {
            setPhotoError("Please upload a valid image (JPG, PNG, WEBP, HEIC)");
            return;
        }

        // 10MB limit check (still good to have, but we resize anyway)
        if (file.size > 10 * 1024 * 1024) {
            setPhotoError("Image size must be less than 10MB");
            return;
        }

        setPhotoError(null);
        setProductPhoto(file);

        // Create preview URL
        const url = URL.createObjectURL(file);
        setProductPhotoUrl(url); // This is blob:
    };

    const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                const maxDim = 1200;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);
                // Compress to JPEG 0.7
                const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check required...
        const newErrors: typeof errors = {};
        if (!ratingOverall) newErrors.ratingOverall = "Overall rating is required";
        if (!commentOverall) newErrors.commentOverall = "Overall comment is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill in required fields");
            // Scroll...
            const element = document.getElementById("rating-overall");
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            return;
        }

        setSubmitting(true);

        try {
            let finalPhotoUrl = productPhotoUrl;

            // Compress/Resize image if strictly a file (blob) or huge data URL
            if (productPhoto) {
                try {
                    // Always resize uploaded files
                    finalPhotoUrl = await resizeImage(productPhoto);
                } catch (resizeError) {
                    console.error("Resize failed, falling back to original (may fail size limit)", resizeError);
                    // If resize fails, try reading original as base64
                    if (productPhotoUrl.startsWith('blob:')) {
                        const reader = new FileReader();
                        finalPhotoUrl = await new Promise((resolve) => {
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(productPhoto);
                        });
                    }
                }
            } else if (productPhotoUrl && productPhotoUrl.startsWith('data:')) {
                // Camera capture - existing data URL. Usually small enough, but could be huge.
                // We can optionally resize this too if needed, but assuming camera-capture component handles it reasonably.
            }

            // Construct detailed message from comments
            let combinedMessage = "";
            if (commentOverall) combinedMessage += `Overall Feedback: ${commentOverall}\n`;
            if (commentPacking) combinedMessage += `Packing Feedback: ${commentPacking}\n`;
            if (commentDelivery) combinedMessage += `Delivery Feedback: ${commentDelivery}\n`;
            if (commentOrdering) combinedMessage += `Ordering Feedback: ${commentOrdering}\n`;

            // Fallback message if all empty
            if (!combinedMessage) combinedMessage = "No written comments provided.";

            const response = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: isAnonymous ? "Anonymous" : (customerProfile?.name || "Customer"),
                    email: isAnonymous ? "anonymous@attar-aljannah.com" : (customerProfile?.email || user?.email || "customer@example.com"),
                    phone: isAnonymous ? "" : (customerProfile?.phone || user?.phone || ""),
                    category: "product_review",
                    subject: "Product Experience Rating",
                    message: combinedMessage,
                    rating_packing: ratingPacking || null,
                    rating_delivery: ratingDelivery || null,
                    rating_ordering: ratingOrdering || null,
                    rating_overall: ratingOverall,
                    product_photo_url: finalPhotoUrl || null,
                    page_url: window.location.href,
                    is_anonymous: isAnonymous,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to submit feedback");
            }

            const data = await response.json();
            setTrackingId(data.feedback.id);
            setSubmitted(true);
            localStorage.removeItem("feedbackDraft"); // Clear draft
            toast.success("Thank you for your feedback!");
        } catch (error: any) {
            console.error("Feedback submission error:", error);
            toast.error(error.message || "Failed to submit feedback");
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16">
                <Card className="glass-strong rounded-3xl text-center">
                    <CardContent className="pt-12 pb-12">
                        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
                        <p className="text-muted-foreground mb-2">
                            Your feedback has been submitted successfully{isAnonymous ? " anonymously" : ""}.
                        </p>
                        <p className="text-sm text-muted-foreground mb-8">
                            Tracking ID: <span className="font-mono font-semibold">{trackingId.slice(0, 8)}</span>
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={() => router.push("/customer/dashboard")}
                                className="bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl"
                            >
                                Go to Dashboard
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSubmitted(false);
                                    setRatingPacking(0);
                                    setRatingDelivery(0);
                                    setRatingOrdering(0);
                                    setRatingOverall(0);
                                    setCommentPacking("");
                                    setCommentDelivery("");
                                    setCommentOrdering("");
                                    setCommentOverall("");
                                    setProductPhoto(null);
                                    setProductPhotoUrl("");
                                }}
                                className="rounded-2xl"
                            >
                                Submit Another
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="space-y-6">
                {/* User Details Section */}
                <Card className="glass-strong rounded-3xl">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    Your Details
                                </CardTitle>
                                <CardDescription>This information will appear with your feedback</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-xl">
                                <Checkbox
                                    id="anonymous-mode"
                                    checked={isAnonymous}
                                    onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                                />
                                <Label htmlFor="anonymous-mode" className="cursor-pointer">Send Anonymously</Label>
                            </div>
                        </div>
                    </CardHeader>
                    {!isAnonymous && (
                        <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-background/50 border border-border/50">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{customerProfile?.name || "Customer"}</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-background/50 border border-border/50">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{user.phone}</span>
                            </div>
                            {customerProfile?.email && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-background/50 border border-border/50 md:col-span-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">{customerProfile.email}</span>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>

                <Card className="glass-strong rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-3xl">Rate Your Experience</CardTitle>
                        <CardDescription>
                            Help us improve by sharing your experience
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Overall Rating - Required */}
                            <div className="space-y-4 p-4 rounded-2xl bg-secondary/20 scroll-mt-24" id="rating-overall">
                                <RatingInput
                                    label="Overall Experience"
                                    value={ratingOverall}
                                    onChange={(val) => {
                                        setRatingOverall(val);
                                        if (val > 0) setErrors(prev => ({ ...prev, ratingOverall: undefined }));
                                    }}
                                    required
                                />
                                {errors.ratingOverall && <p className="text-destructive text-sm font-medium">{errors.ratingOverall}</p>}

                                <Textarea
                                    placeholder="Tell us about your overall experience... *"
                                    value={commentOverall}
                                    onChange={(e) => {
                                        setCommentOverall(e.target.value);
                                        if (e.target.value) setErrors(prev => ({ ...prev, commentOverall: undefined }));
                                    }}
                                    className={`bg-background/80 ${errors.commentOverall ? "border-destructive ring-destructive" : ""}`}
                                    required
                                />
                                {errors.commentOverall && <p className="text-destructive text-sm font-medium">{errors.commentOverall}</p>}
                            </div>

                            {/* Ordering Process */}
                            <div className="space-y-4">
                                <RatingInput
                                    label="Ordering Process"
                                    value={ratingOrdering}
                                    onChange={setRatingOrdering}
                                    description="(Optional)"
                                />
                                {ratingOrdering > 0 && (
                                    <Textarea
                                        placeholder="Any comments on the ordering process?"
                                        value={commentOrdering}
                                        onChange={(e) => setCommentOrdering(e.target.value)}
                                        className="bg-background/80"
                                    />
                                )}
                            </div>

                            {/* Delivery Experience */}
                            <div className="space-y-4">
                                <RatingInput
                                    label="Delivery Experience"
                                    value={ratingDelivery}
                                    onChange={setRatingDelivery}
                                    description="(Optional)"
                                />
                                {ratingDelivery > 0 && (
                                    <Textarea
                                        placeholder="How was the delivery?"
                                        value={commentDelivery}
                                        onChange={(e) => setCommentDelivery(e.target.value)}
                                        className="bg-background/80"
                                    />
                                )}
                            </div>

                            {/* Packing Quality */}
                            <div className="space-y-4">
                                <RatingInput
                                    label="Packing Quality"
                                    value={ratingPacking}
                                    onChange={setRatingPacking}
                                    description="(Optional)"
                                />
                                {ratingPacking > 0 && (
                                    <Textarea
                                        placeholder="Comments on packaging..."
                                        value={commentPacking}
                                        onChange={(e) => setCommentPacking(e.target.value)}
                                        className="bg-background/80"
                                    />
                                )}
                            </div>

                            {/* Product Photo */}
                            <div className="space-y-2 pt-4 border-t border-border">
                                <label className="text-lg font-semibold">
                                    Product Photo
                                    <span className="text-sm font-normal text-muted-foreground ml-2">(Optional)</span>
                                </label>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Upload from gallery or take a photo
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowCamera(true)}
                                        className="sm:w-auto w-full"
                                    >
                                        <Camera className="mr-2 h-4 w-4" />
                                        Take Photo
                                    </Button>
                                </div>

                                {photoError && (
                                    <p className="text-sm text-red-500 mt-2">{photoError}</p>
                                )}

                                {productPhotoUrl && (
                                    <div className="mt-4 space-y-3">
                                        <div className="relative w-full max-w-md aspect-video border-2 border-border rounded-xl overflow-hidden bg-black/5">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={productPhotoUrl}
                                                alt="Product"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => {
                                                setProductPhoto(null);
                                                setProductPhotoUrl("");
                                            }}
                                            size="sm"
                                            className="rounded-xl"
                                        >
                                            Remove Photo
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl text-lg py-6 shadow-xl shadow-primary/20"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-5 w-5" />
                                        Submit Feedback {isAnonymous ? "(Anonymously)" : ""}
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <CameraCapture
                    onCapture={(file, dataUrl) => {
                        setProductPhoto(file);
                        setProductPhotoUrl(dataUrl);
                        setShowCamera(false);
                    }}
                    onClose={() => setShowCamera(false)}
                />
            )}
        </div>
    );
}
