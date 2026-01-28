"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";

interface CameraCaptureProps {
    onCapture: (file: File, dataUrl: string) => void;
    onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Start camera on mount
    useEffect(() => {
        let mediaStream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Request camera access with back camera preference for mobile
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "environment", // Use back camera on mobile
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    },
                });

                setStream(mediaStream);

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }

                setIsLoading(false);
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError(
                    "Unable to access camera. Please ensure you've granted camera permissions or use the file upload option."
                );
                setIsLoading(false);
                toast.error("Camera access denied or unavailable");
            }
        };

        startCamera();

        // Cleanup function - stop camera when component unmounts
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []); // Empty dependency array - only run once

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        const context = canvas.getContext("2d");
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas to blob and then to file
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const imageUrl = URL.createObjectURL(blob);
                        setCapturedImage(imageUrl);
                        stopCamera(); // Stop camera after capture
                    }
                },
                "image/jpeg",
                0.95
            );
        }
    };

    const confirmPhoto = () => {
        if (!canvasRef.current || !capturedImage) return;

        canvasRef.current.toBlob(
            (blob) => {
                if (blob) {
                    const file = new File([blob], `payment-screenshot-${Date.now()}.jpg`, {
                        type: "image/jpeg",
                    });
                    // Pass both file and data URL
                    onCapture(file, capturedImage);
                    toast.success("Photo captured successfully!");
                    onClose();
                }
            },
            "image/jpeg",
            0.95
        );
    };

    const retakePhoto = async () => {
        setCapturedImage(null);
        setIsLoading(true);

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            setIsLoading(false);
        } catch (err) {
            console.error("Error restarting camera:", err);
            toast.error("Failed to restart camera");
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        stopCamera();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl glass-strong rounded-3xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Camera className="w-6 h-6" />
                            Capture Payment Screenshot
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error ? (
                        <div className="text-center py-12 space-y-4">
                            <p className="text-destructive">{error}</p>
                            <Button onClick={handleClose} variant="outline">
                                Close
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Camera Preview or Captured Image */}
                            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
                                {isLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-white text-center">
                                            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p>Accessing camera...</p>
                                        </div>
                                    </div>
                                )}

                                {!capturedImage ? (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={capturedImage}
                                            alt="Captured screenshot"
                                            fill
                                            className="object-contain"
                                            unoptimized
                                        />
                                    </div>
                                )}

                                <canvas ref={canvasRef} className="hidden" />
                            </div>

                            {/* Instructions */}
                            {!capturedImage && !isLoading && (
                                <p className="text-sm text-muted-foreground text-center">
                                    Position your payment confirmation screen in the frame and click
                                    capture
                                </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-center">
                                {!capturedImage ? (
                                    <Button
                                        size="lg"
                                        onClick={capturePhoto}
                                        disabled={isLoading || !!error}
                                        className="bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl min-w-[200px]"
                                    >
                                        <Camera className="mr-2 h-5 w-5" />
                                        Capture Photo
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            onClick={retakePhoto}
                                            className="rounded-2xl"
                                        >
                                            <RotateCcw className="mr-2 h-5 w-5" />
                                            Retake
                                        </Button>
                                        <Button
                                            size="lg"
                                            onClick={confirmPhoto}
                                            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 rounded-2xl"
                                        >
                                            <Check className="mr-2 h-5 w-5" />
                                            Use This Photo
                                        </Button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
