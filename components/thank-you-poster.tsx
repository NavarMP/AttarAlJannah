"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Upload, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ThankYouPosterProps {
    customerName: string;
}

export function ThankYouPoster({
    customerName,
}: ThankYouPosterProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<"idle" | "configuring" | "generating" | "completed">("idle");
    const [language, setLanguage] = useState<"en" | "ml">("en");
    const [imageLoaded, setImageLoaded] = useState(false);

    const generatePoster = useCallback(() => {
        if (status !== "generating") return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        const width = 1080;
        const height = 1350;
        canvas.width = width;
        canvas.height = height;

        // Load the template image
        const img = new Image();
        img.crossOrigin = "anonymous";

        // Select asset based on language
        const templatePath = language === "en" ? "/assets/thankYou_En.svg" : "/assets/thankYou_Ml.svg";

        img.onload = () => {
            // Draw the template image as background
            ctx.drawImage(img, 0, 0, width, height);

            // Configure text styling for customer name
            ctx.textAlign = "center"; // Alignment relative to placement point
            ctx.textBaseline = "middle";

            // User Requirement: X=600, Y=60 (approx), Size=40pt
            // 40pt is approx 53.33px. Let's use 54px.
            const x = 600;
            const y = 60;
            const fontSize = 40;

            // Font settings
            // If Malayalam, we might want a font that supports it well, but system fonts usually handle it.
            // Using a bold sans-serif is safe.
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = "#ffffff"; // Assuming white text

            // Draw customer name
            ctx.fillText(customerName, x, y);

            setImageLoaded(true);
            setStatus("completed");
        };

        img.onerror = () => {
            console.error("Failed to load poster template:", templatePath);
            toast.error(`Failed to load ${language === "en" ? "English" : "Malayalam"} template`);
            setStatus("configuring"); // Go back
        };

        img.src = templatePath;
    }, [customerName, language, status]);

    useEffect(() => {
        if (status === "generating") {
            generatePoster();
        }
    }, [status, generatePoster]);

    const downloadPoster = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            canvas.toBlob((blob) => {
                if (!blob) return;

                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.download = `thank-you-${language}-${customerName.replace(/\s+/g, "-").toLowerCase()}.png`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
                toast.success("Poster downloaded successfully!");
            }, "image/png");
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Failed to download poster");
        }
    };

    const handleGenerateClick = () => {
        setStatus("generating");
    };

    const reset = () => {
        setStatus("idle");
        setImageLoaded(false);
    };

    if (status === "idle") {
        return (
            <Button
                onClick={() => setStatus("configuring")}
                className="w-full bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl"
            >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Thank You Poster
            </Button>
        );
    }

    if (status === "configuring") {
        return (
            <Card className="glass-strong rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label>Select Language</Label>
                        <Select
                            value={language}
                            onValueChange={(v) => setLanguage(v as "en" | "ml")}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ml">Malayalam</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={reset} className="flex-1">
                            Cancel
                        </Button>
                        <Button onClick={handleGenerateClick} className="flex-1">
                            Generate
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-strong rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <CardContent className="p-6 space-y-4">
                <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 bg-black/5">
                    {/* Preview could be scaled down since 1080x1350 is huge */}
                    <canvas
                        ref={canvasRef}
                        className="w-full h-auto"
                        style={{ display: "block" }}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Button
                        onClick={downloadPoster}
                        className="w-full bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download Poster
                    </Button>
                    <Button variant="ghost" onClick={() => setStatus("configuring")} className="text-muted-foreground">
                        Change Language
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
