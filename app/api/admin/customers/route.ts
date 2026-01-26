import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search") || "";

        // Fetch all customers from customer_profiles table
        let query = supabase
            .from("customer_profiles")
            .select("*")
            .order("created_at", { ascending: false });

        // Apply search filter if provided
        if (search) {
            query = query.or(`phone.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data: customers, error } = await query;

        if (error) {
            console.error("Customers fetch error:", error);
            return NextResponse.json(
                { error: "Failed to fetch customers" },
                { status: 500 }
            );
        }

        return NextResponse.json({ customers: customers || [] });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
