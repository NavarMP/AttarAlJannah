import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Get volunteer notification preferences
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get volunteer profile with preferences
        const { data: volunteer, error } = await supabase
            .from("volunteers")
            .select("id, name, phone, email, volunteer_id, notification_preferences")
            .eq("id", user.id)
            .single();

        if (error || !volunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // Default preferences if not set
        const defaultPreferences = {
            channels: {
                push: true,
                email: true,
                sms: false,
            },
            categories: {
                referral_updates: true,
                delivery_assignments: true,
                commission_updates: true,
                challenge_updates: true,
                zone_updates: true,
                system_alerts: true,
            },
        };

        const preferences = volunteer.notification_preferences || defaultPreferences;

        return NextResponse.json({
            volunteer: {
                id: volunteer.id,
                name: volunteer.name,
                phone: volunteer.phone,
                email: volunteer.email,
                volunteer_id: volunteer.volunteer_id,
            },
            preferences,
        });
    } catch (error) {
        console.error("Get volunteer preferences error:", error);
        return NextResponse.json(
            { error: "Failed to get preferences" },
            { status: 500 }
        );
    }
}

// PATCH - Update volunteer notification preferences
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { preferences } = body;

        if (!preferences) {
            return NextResponse.json(
                { error: "Preferences are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Update preferences
        const { data: volunteer, error } = await supabase
            .from("volunteers")
            .update({ notification_preferences: preferences })
            .eq("id", user.id)
            .select()
            .single();

        if (error) {
            console.error("Update volunteer preferences error:", error);
            return NextResponse.json(
                { error: "Failed to update preferences" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            preferences: volunteer.notification_preferences,
            message: "Preferences updated successfully",
        });
    } catch (error) {
        console.error("Update volunteer preferences error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
