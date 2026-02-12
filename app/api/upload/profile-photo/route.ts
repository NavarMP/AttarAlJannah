import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get the authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized - please log in" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const volunteerId = formData.get("volunteerId") as string;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        if (!volunteerId) {
            return NextResponse.json(
                { error: "Volunteer ID is required" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: JPG, PNG, WEBP, HEIC" },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File size exceeds 5MB limit" },
                { status: 400 }
            );
        }

        // Create file path: profiles/volunteer-id-timestamp.ext
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${volunteerId}-${Date.now()}.${fileExt}`;
        const filePath = `profiles/${fileName}`;

        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("profile-photos") // Bucket name
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true, // Replace if exists
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return NextResponse.json(
                { error: `Failed to upload photo: ${uploadError.message}` },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from("profile-photos")
            .getPublicUrl(filePath);

        return NextResponse.json({
            success: true,
            photoUrl: publicUrl,
            path: filePath,
        });

    } catch (error) {
        console.error("Profile photo upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload photo" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get the authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get("path");

        if (!filePath) {
            return NextResponse.json(
                { error: "File path is required" },
                { status: 400 }
            );
        }

        // Delete from Supabase Storage
        const { error: deleteError } = await supabase.storage
            .from("profile-photos")
            .remove([filePath]);

        if (deleteError) {
            console.error("Delete error:", deleteError);
            return NextResponse.json(
                { error: `Failed to delete photo: ${deleteError.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Photo deleted successfully",
        });

    } catch (error) {
        console.error("Profile photo delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete photo" },
            { status: 500 }
        );
    }
}
