import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - List all delivery zones
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get("active") === "true";

        const supabase = await createClient();

        let query = supabase
            .from("delivery_zones")
            .select("*, volunteer_delivery_zones(count)")
            .order("created_at", { ascending: false });

        if (activeOnly) {
            query = query.eq("is_active", true);
        }

        const { data: zones, error } = await query;

        if (error) {
            console.error("Zones fetch error:", error);
            throw error;
        }

        return NextResponse.json({ zones: zones || [] });
    } catch (error) {
        console.error("Delivery zones API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch delivery zones" },
            { status: 500 }
        );
    }
}

// POST - Create new delivery zone
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            description,
            district,
            state,
            pincodes,
            pincodeStart,
            pincodeEnd
        } = body;

        if (!name || !district || !state) {
            return NextResponse.json(
                { error: "Name, district, and state are required" },
                { status: 400 }
            );
        }

        if (!pincodes && (!pincodeStart || !pincodeEnd)) {
            return NextResponse.json(
                { error: "Either provide pincodes array or pincode range" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data: zone, error } = await supabase
            .from("delivery_zones")
            .insert({
                name,
                description,
                district,
                state,
                pincodes: pincodes || [],
                pincode_start: pincodeStart || null,
                pincode_end: pincodeEnd || null,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error("Zone creation error:", error);
            throw error;
        }

        return NextResponse.json({ zone, message: "Zone created successfully" });
    } catch (error) {
        console.error("Zone creation API error:", error);
        return NextResponse.json(
            { error: "Failed to create delivery zone" },
            { status: 500 }
        );
    }
}
