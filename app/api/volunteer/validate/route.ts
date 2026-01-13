import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const volunteerId = searchParams.get("volunteerId");

        if (!volunteerId) {
            return NextResponse.json(
                { valid: false, error: "Volunteer ID required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Query volunteer by volunteer_id with case-insensitive matching
        const { data: volunteer, error } = await supabase
            .from("users")
            .select("id, name, volunteer_id")
            .eq("user_role", "volunteer")
            .ilike("volunteer_id", volunteerId)
            .single();

        if (error || !volunteer) {
            console.log("Volunteer validation failed:", error?.message, "for ID:", volunteerId);
            return NextResponse.json({
                valid: false,
                volunteer: null,
            });
        }

        return NextResponse.json({
            valid: true,
            volunteer: {
                id: volunteer.id,
                name: volunteer.name,
                volunteerId: volunteer.volunteer_id,
            },
        });
    } catch (error) {
        console.error("Volunteer validation error:", error);
        return NextResponse.json(
            { valid: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
