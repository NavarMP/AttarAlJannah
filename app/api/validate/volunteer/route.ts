import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Validate volunteer ID in real-time
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const volunteerId = searchParams.get("id");

        if (!volunteerId || volunteerId.length < 3) {
            return NextResponse.json({
                valid: false,
                message: "Enter at least 3 characters"
            });
        }

        const supabase = await createClient();

        // Look up volunteer by volunteer_id (case-insensitive)
        const { data: volunteer, error: volunteerError } = await supabase
            .from("volunteers")
            .select("id, name, volunteer_id, phone")
            .ilike("volunteer_id", volunteerId)
            .single();

        if (volunteerError || !volunteer) {
            return NextResponse.json({
                valid: false,
                message: "Volunteer not found"
            });
        }

        return NextResponse.json({
            valid: true,
            volunteer: {
                uuid: volunteer.id,
                name: volunteer.name,
                id: volunteer.volunteer_id,
                phone: volunteer.phone
            }
        });
    } catch (error) {
        console.error("Volunteer validation API error:", error);
        return NextResponse.json(
            {
                valid: false,
                message: "Validation error"
            },
            { status: 500 }
        );
    }
}
