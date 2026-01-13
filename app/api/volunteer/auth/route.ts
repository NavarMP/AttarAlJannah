import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const { identifier } = await request.json();
        const supabase = await createClient();

        // Try to find volunteer by phone or ID
        const { data: volunteer, error } = await supabase
            .from("users")
            .select("*")
            .eq("role", "volunteer")
            .or(`phone.eq.${identifier},id.eq.${identifier}`)
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
