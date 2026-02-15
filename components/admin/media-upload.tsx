"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageCropDialog } from "@/components/custom/image-crop-dialog";
import { Upload, X, Loader2, FileVideo, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { validateImageFile, convertHeicToJpeg, compressImage } from "@/lib/utils/image-utils";
import Image from "next/image";

interface MediaUploadProps {
    currentUrl?: string | null;
    currentType?: 'image' | 'video';
    onMediaChange: (file: File | null, preview: string | null, type: 'image' | 'video') => void;
    aspectRatio?: number; // 16/9, 9/16, 1, 4/5
    type: 'image' | 'video';
}

export function MediaUpload({
    currentUrl,
    currentType,
    onMediaChange,
    aspectRatio = 16 / 9,
    type
}: MediaUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentUrl || null);
    const [previewType, setPreviewType] = useState<'image' | 'video'>(currentType || type);
    const [showCrop, setShowCrop] = useState(false);
    const [photoToCrop, setPhotoToCrop] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Update preview when props change (for edit mode)
    useEffect(() => {
        if (currentUrl) {
            setPreview(currentUrl);
            setPreviewType(currentType || 'image');
        }
    }, [currentUrl, currentType]);

    const processImageFile = async (file: File) => {
        setIsProcessing(true);

        try {
            // Validate file
            const validation = validateImageFile(file);
            if (!validation.isValid) {
                toast.error(validation.error);
                setIsProcessing(false);
                return;
            }

            let fileToProcess = file;

            // Convert HEIC to JPEG if needed
            if (file.type === "image/heic") {
                toast.info("Converting HEIC image...");
                try {
                    const convertedBlob = await convertHeicToJpeg(file);
                    fileToProcess = new File(
                        [convertedBlob],
                        file.name.replace(/\.heic$/i, ".jpg"),
                        { type: "image/jpeg" }
                    );
                } catch (error) {
                    console.error("HEIC conversion error:", error);
                    toast.error("Failed to convert HEIC image.");
                    setIsProcessing(false);
                    return;
                }
            }

            // Create URL for cropping
            const cropUrl = URL.createObjectURL(fileToProcess);
            setPhotoToCrop(cropUrl);
            setShowCrop(true);

        } catch (error) {
            console.error("File processing error:", error);
            toast.error("Failed to process image");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'video') {
            if (!file.type.startsWith('video/')) {
                toast.error("Please upload a valid video file");
                return;
            }
            // For video, just set preview and pass file
            const url = URL.createObjectURL(file);
            setPreview(url);
            setPreviewType('video');
            onMediaChange(file, url, 'video');
        } else {
            processImageFile(file);
        }

        // Reset input
        e.target.value = "";
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        try {
            setIsProcessing(true);

            const croppedFile = new File([croppedBlob], "promo-image.jpg", {
                type: "image/jpeg",
            });

            const compressedFile = await compressImage(croppedFile);
            const previewUrl = URL.createObjectURL(compressedFile);

            setPreview(previewUrl);
            setPreviewType('image');
            onMediaChange(compressedFile, previewUrl, 'image');

            setShowCrop(false);
            setPhotoToCrop(null);
            toast.success("Image processed successfully!");
        } catch (error) {
            console.error("Crop/compression error:", error);
            toast.error("Failed to process cropped image");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onMediaChange(null, null, type);
        toast.success("Media removed");
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                {/* Preview Area */}
                <div
                    className="relative w-full bg-muted rounded-xl overflow-hidden border border-border flex items-center justify-center"
                    style={{ aspectRatio }}
                >
                    {preview ? (
                        previewType === 'video' ? (
                            <video
                                src={preview}
                                className="w-full h-full object-cover"
                                controls
                            />
                        ) : (
                            <Image
                                src={preview}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                        )
                    ) : (
                        <div className="text-muted-foreground flex flex-col items-center gap-2">
                            {type === 'video' ? <FileVideo className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                            <span className="text-sm">No {type} selected</span>
                        </div>
                    )}
                </div>

                {/* Upload Controls */}
                <div className="flex gap-2">
                    <label className="flex-1">
                        <Input
                            type="file"
                            accept={type === 'video' ? "video/*" : "image/jpeg,image/jpg,image/png,image/webp,image/heic"}
                            onChange={handleFileChange}
                            className="hidden"
                            id={`media-upload-${type}`}
                            disabled={isProcessing}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById(`media-upload-${type}`)?.click()}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload {type === 'video' ? 'Video' : 'Image'}
                                </>
                            )}
                        </Button>
                    </label>

                    {preview && (
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={handleRemove}
                            disabled={isProcessing}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">
                    {type === 'video'
                        ? "Supported formats: MP4, WebM. Max size: 50MB."
                        : "Supported formats: JPG, PNG, WebP, HEIC. Images will be cropped to selected ratio."}
                </p>
            </div>

            {/* Crop Modal */}
            {showCrop && photoToCrop && (
                <ImageCropDialog
                    isOpen={showCrop}
                    onClose={() => {
                        setShowCrop(false);
                        setPhotoToCrop(null);
                    }}
                    imageUrl={photoToCrop}
                    onCropComplete={handleCropComplete}
                    aspectRatio={aspectRatio}
                />
            )}
        </div>
    );
}
