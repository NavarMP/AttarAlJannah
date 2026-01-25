"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

interface ThankYouPosterProps {
    customerName: string;
    templateImagePath?: string; // Path to poster template image
}

export function ThankYouPoster({
    customerName,
    templateImagePath = "/assets/thank-you-poster-template.png"
}: ThankYouPosterProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isGenerating, setIsGenerating] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);

    const generatePoster = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        const width = 1200;
        const height = 630;
        canvas.width = width;
        canvas.height = height;

        // Load the template image
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            // Draw the template image as background
            ctx.drawImage(img, 0, 0, width, height);

            // Configure text styling for customer name
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Add text shadow for better readability
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // Draw customer name
            // Adjust font size based on name length
            const fontSize = customerName.length > 20 ? 48 : customerName.length > 15 ? 56 : 64;
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = "#ffffff";

            // Draw name at center-ish position (you can adjust Y position)
            // Assuming name goes in the middle-lower area
            ctx.fillText(customerName, width / 2, height / 2 + 50);

            setImageLoaded(true);
            setIsGenerating(false);
        };

        img.onerror = () => {
            console.error("Failed to load poster template");
            // Fallback: Create a simple poster if template doesn't load
            createFallbackPoster(ctx, width, height, customerName);
            setIsGenerating(false);
        };

        img.src = templateImagePath;
    }, [customerName, templateImagePath]);

    useEffect(() => {
        generatePoster();
    }, [generatePoster]);

    const createFallbackPoster = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        name: string
    ) => {
        // Simple fallback design if template image doesn't load
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#1a472a");
        gradient.addColorStop(0.5, "#2d5f3d");
        gradient.addColorStop(1, "#1a472a");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Border
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 8;
        ctx.strokeRect(30, 30, width - 60, height - 60);

        // Text
        ctx.fillStyle = "#d4af37";
        ctx.font = "bold 72px serif";
        ctx.textAlign = "center";
        ctx.fillText("Thank You", width / 2, 200);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 56px sans-serif";
        ctx.fillText(name, width / 2, 340);

        ctx.fillStyle = "#d4af37";
        ctx.font = "bold 36px Arial";
        ctx.fillText("عطر الجنّة", width / 2, 450);

        setImageLoaded(true);
    };

    const downloadPoster = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            canvas.toBlob((blob) => {
                if (!blob) return;

                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.download = `thank-you-${customerName.replace(/\s+/g, "-").toLowerCase()}.png`;
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

    return (
        <Card className="glass-strong rounded-3xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
                {!imageLoaded && (
                    <div className="text-center p-4 text-sm text-muted-foreground">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p>Place your poster template at:</p>
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                            /public/assets/thank-you-poster-template.png
                        </code>
                        <p className="mt-2 text-xs">
                            The customer name will be overlaid on the template.
                        </p>
                    </div>
                )}

                <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-auto"
                        style={{ display: "block" }}
                    />
                </div>

                <Button
                    onClick={downloadPoster}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Thank You Poster
                </Button>

                {/* <p className="text-xs text-center text-muted-foreground">
                    💡 Tip: You can customize the poster template by placing your own design at the path above
                </p> */}
            </CardContent>
        </Card>
    );
}
