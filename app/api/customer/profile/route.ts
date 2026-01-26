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

        // Fetch user from users table
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("phone", phone)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return NextResponse.json(null);
            }
            throw error;
        }

        // Fetch order stats
        const { count, error: countError } = await supabase
            .from("orders")
            .select("*", { count: 'exact', head: true })
            .eq("customer_phone", phone);

        // Fetch last order date
        const { data: lastOrder } = await supabase
            .from("orders")
            .select("created_at")
            .eq("customer_phone", phone)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        const profile = {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: null,
            default_address: user.address,
            total_orders: count || 0,
            last_order_at: lastOrder?.created_at || null
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

        // Upsert user in users table
        const { data: user, error } = await supabase
            .from("users")
            .upsert({
                phone,
                name: name || "Customer",
                user_role: "customer"
            }, { onConflict: "phone" })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            id: user.id,
            phone: user.phone,
            name: user.name,
            total_orders: 0,
            last_order_at: null
        });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
