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

        // Fetch user from customers table
        const { data: customer, error } = await supabase
            .from("customers")
            .select("*")
            .eq("phone", phone)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return NextResponse.json(null);
            }
            throw error;
        }

        const profile = {
            id: customer.id,
            phone: customer.phone,
            name: customer.name,
            email: null,
            default_address: customer.address,
            total_orders: customer.total_orders || 0,
            last_order_at: customer.last_order_at || null
        };

        return NextResponse.json(profile);
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, name } = body;

        if (!phone) {
            return NextResponse.json({ error: "Phone required" }, { status: 400 });
        }

        const supabase = await createClient();

        // Upsert customer in customers table
        const { data: customer, error } = await supabase
            .from("customers")
            .upsert({
                phone,
                name: name || "Customer",
                // Address is required in schema but might be missing in initial login?
                // We'll set a default or handle it. New Schema says address can be null? 
                // Wait, "address TEXT, -- Customers MUST have address" comment says MUST.
                // But typically initial login is just phone.
                // Let's check schema I wrote. "address TEXT" (nullable).
            }, { onConflict: "phone" })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            id: customer.id,
            phone: customer.phone,
            name: customer.name,
            total_orders: customer.total_orders || 0,
            last_order_at: customer.last_order_at || null
        });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
