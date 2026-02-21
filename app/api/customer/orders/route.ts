import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const phone = searchParams.get("phone");
        const orderId = searchParams.get("orderId");

        if (!phone) {
            return NextResponse.json({ error: "Phone number required" }, { status: 400 });
        }

        const supabase = await createClient();

        console.log("Fetching orders for phone:", phone);

        // Normalize phone number - try multiple formats
        const basePhone = phone.replace(/\D/g, '').slice(-10); // Last 10 digits only
        const phoneVariations = [
            phone,                              // As provided
            basePhone,                          // Without country code
            `+91${basePhone}`                   // With country code
        ];

        console.log("Trying phone variations:", phoneVariations);

        // If orderId is provided, fetch single order
        if (orderId) {
            const { data: order, error } = await supabase
                .from("orders")
                .select("*, volunteers!orders_volunteer_id_fkey(name)")
                .eq("id", orderId)
                .in("customer_phone", phoneVariations)
                .single();

            if (error) {
                console.error("Order fetch error:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ order });
        }

        // Otherwise fetch all orders for the customer
        const { data: orders, error } = await supabase
            .from("orders")
            .select("*, volunteers!orders_volunteer_id_fkey(name)")
            .in("customer_phone", phoneVariations)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Orders fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`Found ${orders?.length || 0} orders`);

        return NextResponse.json({ orders: orders || [] });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
