import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Get volunteer's assigned zones
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const volunteerId = searchParams.get("volunteerId");

        if (!volunteerId) {
            return NextResponse.json(
                { error: "Volunteer ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Look up volunteer UUID
        const { data: volunteer, error: volunteerError } = await supabase
            .from("volunteers")
            .select("id")
            .ilike("volunteer_id", volunteerId)
            .single();

        if (volunteerError || !volunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // Get assigned zones
        const { data: assignments, error } = await supabase
            .from("volunteer_delivery_zones")
            .select(`
                zone_id,
                assigned_at,
                delivery_zones(*)
            `)
            .eq("volunteer_id", volunteer.id);

        if (error) {
            console.error("Zone fetch error:", error);
            throw error;
        }

        return NextResponse.json({
            zones: assignments?.map(a => a.delivery_zones) || []
        });
    } catch (error) {
        console.error("Volunteer zones API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch zones" },
            { status: 500 }
        );
    }
}

// POST - Assign volunteer to zones
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { volunteerId, zoneIds } = body;

        if (!volunteerId || !zoneIds || !Array.isArray(zoneIds)) {
            return NextResponse.json(
                { error: "Volunteer ID and zone IDs array are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Look up volunteer UUID
        const { data: volunteer, error: volunteerError } = await supabase
            .from("volunteers")
            .select("id")
            .ilike("volunteer_id", volunteerId)
            .single();

        if (volunteerError || !volunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // Delete existing assignments
        await supabase
            .from("volunteer_delivery_zones")
            .delete()
            .eq("volunteer_id", volunteer.id);

        // Insert new assignments
        const assignments = zoneIds.map(zoneId => ({
            volunteer_id: volunteer.id,
            zone_id: zoneId
        }));

        const { error: insertError } = await supabase
            .from("volunteer_delivery_zones")
            .insert(assignments);

        if (insertError) {
            console.error("Zone assignment error:", insertError);
            throw insertError;
        }

        return NextResponse.json({
            message: "Zones assigned successfully",
            count: zoneIds.length
        });
    } catch (error) {
        console.error("Zone assignment API error:", error);
        return NextResponse.json(
            { error: "Failed to assign zones" },
            { status: 500 }
        );
    }
}
