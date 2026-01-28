import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const volunteerId = searchParams.get("volunteerId");
        const orderId = searchParams.get("orderId");

        if (!volunteerId) {
            return NextResponse.json(
                { error: "Volunteer ID required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // First, get the volunteer's UUID from their volunteer_id
        const { data: volunteer, error: volunteerError } = await supabase
            .from("volunteers") // New Table
            .select("id")
            .eq("volunteer_id", volunteerId)
            // .eq("role", "volunteer")
            .single();

        if (volunteerError || !volunteer) {
            console.error("Volunteer lookup error:", volunteerError);
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // If orderId is provided, fetch single order
        if (orderId) {
            const { data: order, error } = await supabase
                .from("orders")
                .select("*")
                .eq("id", orderId)
                .eq("referred_by", volunteer.id)
                .single();

            if (error) {
                console.error("Order fetch error:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            if (!order) {
                return NextResponse.json({ error: "Order not found" }, { status: 404 });
            }

            return NextResponse.json({ order });
        }

        // Otherwise fetch all orders referred by this volunteer
        const { data: orders, error } = await supabase
            .from("orders")
            .select("*")
            .eq("referred_by", volunteer.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Orders fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ orders: orders || [] });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
