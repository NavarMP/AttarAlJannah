import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const phone = searchParams.get("phone");

        if (!phone) {
            return NextResponse.json({ error: "Phone number required" }, { status: 400 });
        }

        const supabase = await createClient();

        const { data: profile, error } = await supabase
            .from("customer_profiles")
            .select("*")
            .eq("phone", phone)
            .single();

        if (error) {
            // Profile doesn't exist yet
            if (error.code === "PGRST116") {
                return NextResponse.json(null);
            }
            console.error("Profile fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
