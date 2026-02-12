import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated volunteer
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { photoUrl } = body;

        if (!photoUrl) {
            return NextResponse.json(
                { error: "Photo URL is required" },
                { status: 400 }
            );
        }

        // Update volunteer's profile photo
        const { data: updatedVolunteer, error: updateError } = await supabase
            .from("volunteers")
            .update({ profile_photo: photoUrl })
            .eq("auth_id", user.id)
            .select()
            .single();

        if (updateError) {
            console.error("Photo update error:", updateError);
            return NextResponse.json(
                { error: "Failed to update profile photo" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            photoUrl: updatedVolunteer.profile_photo,
        });

    } catch (error) {
        console.error("Profile photo update error:", error);
        return NextResponse.json(
            { error: "Failed to update photo" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated volunteer
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get current photo path to delete from storage
        const { data: volunteer } = await supabase
            .from("volunteers")
            .select("profile_photo")
            .eq("auth_id", user.id)
            .single();

        // Remove profile photo from database
        const { error: updateError } = await supabase
            .from("volunteers")
            .update({ profile_photo: null })
            .eq("auth_id", user.id);

        if (updateError) {
            console.error("Photo removal error:", updateError);
            return NextResponse.json(
                { error: "Failed to remove profile photo" },
                { status: 500 }
            );
        }

        // Optionally delete from storage if it exists
        if (volunteer?.profile_photo) {
            // Extract path from URL if it's a Supabase Storage URL
            const pathMatch = volunteer.profile_photo.match(/profiles\/(.+)$/);
            if (pathMatch) {
                await supabase.storage
                    .from("profile-photos")
                    .remove([`profiles/${pathMatch[1]}`]);
            }
        }

        return NextResponse.json({
            success: true,
            message: "Profile photo removed successfully",
        });

    } catch (error) {
        console.error("Profile photo deletion error:", error);
        return NextResponse.json(
            { error: "Failed to remove photo" },
            { status: 500 }
        );
    }
}
