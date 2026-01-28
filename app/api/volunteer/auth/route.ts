import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const volunteerId = searchParams.get("volunteerId");

        if (!volunteerId) {
            return NextResponse.json(
                { error: "Volunteer ID required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Find volunteer by volunteer_id (readable ID like VOL001)
        const { data: volunteer, error } = await supabase
            .from("volunteers") // New Table
            .select("id, volunteer_id, name")
            .ilike("volunteer_id", volunteerId) // Case insensitive
            // .eq("role", "volunteer")
            .single();

        if (error || !volunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            uuid: volunteer.id,
            volunteerId: volunteer.volunteer_id,
            name: volunteer.name,
        });
    } catch (error) {
        console.error("Volunteer auth GET error:", error);
        return NextResponse.json(
            { error: "Failed to fetch volunteer" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { identifier } = await request.json();
        const supabase = await createClient();

        // Try to find volunteer by phone or ID
        const { data: volunteer, error } = await supabase
            .from("volunteers")
            .select("*")
            // .eq("role", "volunteer")
            .or(`phone.eq.${identifier},volunteer_id.eq.${identifier}`) // Volunteers only have id (UUID), phone, volunteer_id
            .single();

        if (error || !volunteer) {
            return NextResponse.json(
                { success: false, message: "Volunteer not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            volunteerId: volunteer.id,
            volunteerName: volunteer.name,
            totalSales: volunteer.total_sales,
        });
    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json(
            { success: false, message: "Authentication failed" },
            { status: 500 }
        );
    }
}
