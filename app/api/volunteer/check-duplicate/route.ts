import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const volunteerId = searchParams.get("volunteerId");
        const phone = searchParams.get("phone");

        if (!volunteerId && !phone) {
            return NextResponse.json(
                { error: "Either volunteerId or phone parameter is required" },
                { status: 400 }
            );
        }

        const { createClient } = require("@supabase/supabase-js");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const response: any = {
            volunteerIdExists: false,
            phoneExists: false
        };

        // Check volunteer ID
        if (volunteerId) {
            const { data } = await supabase
                .from("volunteers")
                .select("id")
                .ilike("volunteer_id", volunteerId)
                .single();

            response.volunteerIdExists = !!data;
        }

        // Check phone
        if (phone) {
            const { data } = await supabase
                .from("volunteers")
                .select("id")
                .eq("phone", phone)
                .single();

            response.phoneExists = !!data;
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error("Error checking duplicates:", error);
        return NextResponse.json(
            { error: "Failed to check duplicates" },
            { status: 500 }
        );
    }
}
