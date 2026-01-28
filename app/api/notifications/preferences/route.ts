import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/notifications/preferences - Get user notification preferences
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get preferences
        const { data: preferences, error } = await supabase
            .from("notification_preferences")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
            console.error("Error fetching preferences:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // If no preferences exist, return defaults
        if (!preferences) {
            return NextResponse.json({
                preferences: {
                    email_notifications: true,
                    push_notifications: true,
                    notification_types: {
                        order_update: true,
                        payment_verified: true,
                        challenge_milestone: true,
                        admin_action: true,
                        system_announcement: true,
                    },
                },
            });
        }

        return NextResponse.json({ preferences });
    } catch (error: any) {
        console.error("Preferences fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/notifications/preferences - Update user notification preferences
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { email_notifications, push_notifications, notification_types } = body;

        // Upsert preferences
        const { data: preferences, error } = await supabase
            .from("notification_preferences")
            .upsert(
                {
                    user_id: user.id,
                    email_notifications,
                    push_notifications,
                    notification_types,
                },
                { onConflict: "user_id" }
            )
            .select()
            .single();

        if (error) {
            console.error("Error updating preferences:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ preferences });
    } catch (error: any) {
        console.error("Preferences update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
