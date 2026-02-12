"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { type Area } from "react-easy-crop";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, ZoomIn } from "lucide-react";

interface ImageCropDialogProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    onCropComplete: (croppedImageBlob: Blob) => void;
    aspectRatio?: number;
}

/**
 * Creates a cropped image from the original image and crop area
 */
async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area
): Promise<Blob> {
    const image = new Image();
    image.src = imageSrc;

    await new Promise((resolve) => {
        image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Could not get canvas context");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Canvas is empty"));
            }
        }, "image/jpeg", 0.95);
    });
}

export function ImageCropDialog({
    isOpen,
    onClose,
    imageUrl,
    onCropComplete,
    aspectRatio = 1, // Default to 1:1 (square) for profile photos
}: ImageCropDialogProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isCropping, setIsCropping] = useState(false);

    const onCropChange = useCallback((crop: { x: number; y: number }) => {
        setCrop(crop);
    }, []);

    const onZoomChange = useCallback((zoom: number) => {
        setZoom(zoom);
    }, []);

    const onCropCompleteCallback = useCallback(
        (_croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const handleCrop = async () => {
        if (!croppedAreaPixels) return;

        try {
            setIsCropping(true);
            const croppedImageBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
            onCropComplete(croppedImageBlob);
            onClose();
        } catch (error) {
            console.error("Crop error:", error);
        } finally {
            setIsCropping(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Crop Image</DialogTitle>
                    <DialogDescription>
                        Adjust the image position and zoom to crop your profile photo
                    </DialogDescription>
                </DialogHeader>

                <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
                    <Cropper
                        image={imageUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropCompleteCallback}
                        cropShape="round"
                        showGrid={false}
                    />
                </div>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4">
                        <ZoomIn className="w-4 h-4 text-muted-foreground" />
                        <Slider
                            value={[zoom]}
                            onValueChange={(value) => setZoom(value[0])}
                            min={1}
                            max={3}
                            step={0.1}
                            className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground min-w-[3rem] text-right">
                            {zoom.toFixed(1)}x
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isCropping}>
                        Cancel
                    </Button>
                    <Button onClick={handleCrop} disabled={isCropping}>
                        {isCropping ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cropping...
                            </>
                        ) : (
                            "Apply Crop"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
