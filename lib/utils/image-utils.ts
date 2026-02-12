import heic2any from "heic2any";
import imageCompression from "browser-image-compression";

/**
 * Validates image file for profile photo upload
 * @param file - File to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
    const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];

    if (!file) {
        return { isValid: false, error: "No file provided" };
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        return {
            isValid: false,
            error: "Invalid file type. Please upload JPG, PNG, WEBP, or HEIC images only.",
        };
    }

    // Size validation removed as we will automatically compress images

    return { isValid: true };
}

/**
 * Compresses an image file to reduce size
 * @param file - File to compress
 * @returns Compressed file
 */
export async function compressImage(file: File): Promise<File> {
    const options = {
        maxSizeMB: 1, // Max file size in MB
        maxWidthOrHeight: 1200, // Max dimension
        useWebWorker: true,
        fileType: "image/jpeg", // Convert to JPEG
    };

    try {
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error("Image compression error:", error);
        return file; // Return original if compression fails
    }
}

/**
 * Converts HEIC image to JPEG using heic2any library
 * @param file - HEIC file to convert
 * @returns Converted JPEG blob
 */
export async function convertHeicToJpeg(file: File): Promise<Blob> {
    try {
        // Dynamic import to avoid SSR issues
        const heic2any = (await import("heic2any")).default;

        const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8, // 80% quality
        });

        // heic2any can return array of blobs, take first one
        return Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    } catch (error) {
        console.error("HEIC conversion error:", error);
        throw new Error("Failed to convert HEIC image. Please try a different format.");
    }
}

/**
 * Resizes image to max dimensions while maintaining aspect ratio
 * @param file - Image file to resize
 * @param maxDimension - Maximum width or height (default: 1200px)
 * @returns Resized image as data URL
 */
export function resizeImage(file: File, maxDimension: number = 1200): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url); // Clean up

            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Failed to get canvas context"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Convert to JPEG with 80% quality
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            resolve(dataUrl);
        };

        img.onerror = (error) => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image"));
        };

        img.src = url;
    });
}

/**
 * Converts data URL to File object
 * @param dataUrl - Data URL string
 * @param fileName - Name for the file
 * @returns File object
 */
export function dataUrlToFile(dataUrl: string, fileName: string): File {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], fileName, { type: mime });
}

/**
 * Generates avatar initials from name
 * @param name - Full name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
    if (!name) return "?";

    const parts = name.trim().split(" ").filter(Boolean);

    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
