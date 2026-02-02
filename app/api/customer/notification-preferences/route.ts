import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Get customer notification preferences
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get customer profile with preferences
        const { data: customer, error } = await supabase
            .from("customers")
            .select("id, name, phone, email, notification_preferences")
            .eq("id", user.id)
            .single();

        if (error || !customer) {
            return NextResponse.json(
                { error: "Customer not found" },
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
                order_updates: true,
                payment_updates: true,
                delivery_updates: true,
                promotional: true,
                system_alerts: true,
            },
        };

        const preferences = customer.notification_preferences || defaultPreferences;

        return NextResponse.json({
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
            },
            preferences,
        });
    } catch (error) {
        console.error("Get preferences error:", error);
        return NextResponse.json(
            { error: "Failed to get preferences" },
            { status: 500 }
        );
    }
}

// PATCH - Update customer notification preferences
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
        const { data: customer, error } = await supabase
            .from("customers")
            .update({ notification_preferences: preferences })
            .eq("id", user.id)
            .select()
            .single();

        if (error) {
            console.error("Update preferences error:", error);
            return NextResponse.json(
                { error: "Failed to update preferences" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            preferences: customer.notification_preferences,
            message: "Preferences updated successfully",
        });
    } catch (error) {
        console.error("Update preferences error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
