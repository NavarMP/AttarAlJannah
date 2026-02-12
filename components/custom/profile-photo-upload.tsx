"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CameraCapture } from "@/components/ui/camera-capture";
import { ImageCropDialog } from "@/components/custom/image-crop-dialog";
import { Camera, Upload, X, Loader2, Crop } from "lucide-react";
import { toast } from "sonner";
import { validateImageFile, convertHeicToJpeg, getInitials, compressImage } from "@/lib/utils/image-utils";

interface ProfilePhotoUploadProps {
    currentPhotoUrl?: string | null;
    volunteerName?: string;
    onPhotoChange: (file: File | null, preview: string | null) => void;
    size?: "sm" | "md" | "lg";
}

export function ProfilePhotoUpload({
    currentPhotoUrl,
    volunteerName = "User",
    onPhotoChange,
    size = "lg",
}: ProfilePhotoUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
    const [showCamera, setShowCamera] = useState(false);
    const [showCrop, setShowCrop] = useState(false);
    const [photoToCrop, setPhotoToCrop] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const sizeClasses = {
        sm: "w-16 h-16",
        md: "w-24 h-24",
        lg: "w-32 h-32",
    };

    const processFile = async (file: File) => {
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
        if (file) {
            processFile(file);
        }
        // Reset input to allow selecting same file again
        e.target.value = "";
    };

    const handleCameraCapture = (file: File, dataUrl: string) => {
        // Camera capture already handles 1:1, but we allow cropping to fine-tune
        setShowCamera(false);
        setPhotoToCrop(dataUrl);
        setShowCrop(true);
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        try {
            setIsProcessing(true);

            // Create a file from the blob
            const croppedFile = new File([croppedBlob], "profile-photo.jpg", {
                type: "image/jpeg",
            });

            // Compress the cropped file
            const compressedFile = await compressImage(croppedFile);

            // Create preview
            const previewUrl = URL.createObjectURL(compressedFile);
            setPreview(previewUrl);

            // Notify parent
            onPhotoChange(compressedFile, previewUrl);

            setShowCrop(false);
            setPhotoToCrop(null);
            toast.success("Photo updated successfully!");
        } catch (error) {
            console.error("Crop/compression error:", error);
            toast.error("Failed to process cropped image");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemovePhoto = () => {
        setPreview(null);
        onPhotoChange(null, null);
        toast.success("Photo removed");
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
                {/* Avatar Preview */}
                <Avatar className={`${sizeClasses[size]} border-4 border-border`}>
                    <AvatarImage src={preview || undefined} alt={volunteerName} className="object-cover" />
                    <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-primary to-gold-500 text-white">
                        {getInitials(volunteerName)}
                    </AvatarFallback>
                </Avatar>

                {/* Upload Controls */}
                <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
                    {/* File Upload Button */}
                    <label className="flex-1">
                        <Input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                            onChange={handleFileChange}
                            className="hidden"
                            id="photo-upload"
                            disabled={isProcessing}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById("photo-upload")?.click()}
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
                                    Upload Photo
                                </>
                            )}
                        </Button>
                    </label>

                    {/* Camera Capture Button */}
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowCamera(true)}
                        disabled={isProcessing}
                    >
                        <Camera className="mr-2 h-4 w-4" />
                        Take Photo
                    </Button>

                    {/* Remove Photo Button */}
                    {preview && (
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={handleRemovePhoto}
                            disabled={isProcessing}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Helper Text */}
                <p className="text-xs text-muted-foreground text-center max-w-md">
                    Upload JPG, PNG, WEBP, or HEIC images.
                    <br />
                    Images are automatically compressed and cropped.
                </p>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onClose={() => setShowCamera(false)}
                />
            )}

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
                    aspectRatio={1} // 1:1 for profile photos
                />
            )}
        </div>
    );
}
