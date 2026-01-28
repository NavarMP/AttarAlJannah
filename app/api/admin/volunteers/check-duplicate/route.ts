import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const name = searchParams.get("name");
        const volunteerId = searchParams.get("volunteerId");
        const excludeId = searchParams.get("excludeId"); // For edit mode - this is the UUID

        const supabase = await createClient();

        const result: {
            nameExists: boolean;
            volunteerIdExists: boolean;
            nameAvailable?: boolean;
            volunteerIdAvailable?: boolean;
        } = {
            nameExists: false,
            volunteerIdExists: false,
        };

        // Check if name exists (case-insensitive)
        if (name && name.length >= 2) {
            let nameQuery = supabase
                .from("volunteers") // New Table
                .select("id, name")
                // .eq("role", "volunteer")
                .ilike("name", name);

            // Exclude current volunteer in edit mode
            if (excludeId) {
                nameQuery = nameQuery.neq("id", excludeId);
            }

            const { data: nameData, error: nameError } = await nameQuery;

            if (nameError) {
                console.error("Name check error:", nameError);
            }

            result.nameExists = (nameData && nameData.length > 0) || false;
            result.nameAvailable = !result.nameExists;
        }

        // Check if volunteer_id exists (case-insensitive)
        if (volunteerId && volunteerId.trim() !== "") {
            let volunteerIdQuery = supabase
                .from("volunteers") // New Table
                .select("id, volunteer_id")
                // .eq("role", "volunteer")
                .ilike("volunteer_id", volunteerId);

            // Exclude current volunteer in edit mode
            if (excludeId) {
                volunteerIdQuery = volunteerIdQuery.neq("id", excludeId);
            }

            const { data: volunteerData, error: volunteerError } = await volunteerIdQuery;

            if (volunteerError) {
                console.error("Volunteer ID check error:", volunteerError);
            }

            result.volunteerIdExists = (volunteerData && volunteerData.length > 0) || false;
            result.volunteerIdAvailable = !result.volunteerIdExists;
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error checking duplicates:", error);
        return NextResponse.json(
            {
                error: "Failed to check duplicates",
                details: error instanceof Error ? error.message : "Unknown error",
                nameExists: false,
                volunteerIdExists: false,
            },
            { status: 500 }
        );
    }
}
