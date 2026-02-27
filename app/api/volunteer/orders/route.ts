import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const volunteerId = searchParams.get("volunteerId");
        const orderId = searchParams.get("orderId");
        const status = searchParams.get("status");
        const unassigned = searchParams.get("unassigned") === "true";
        const deliveryAssigned = searchParams.get("deliveryAssigned") === "true";

        if (!volunteerId) {
            return NextResponse.json(
                { error: "Volunteer ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Look up volunteer UUID from volunteer_id string
        const { data: volunteer, error: volunteerError } = await supabase
            .from("volunteers")
            .select("id")
            .ilike("volunteer_id", volunteerId)
            .single();

        if (volunteerError || !volunteer) {
            console.error("Volunteer lookup error:", volunteerError);
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // If specific order is requested, return that order
        if (orderId) {
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .select("*")
                .eq("id", orderId)
                .eq("volunteer_id", volunteer.id)
                .single();

            if (orderError || !order) {
                return NextResponse.json(
                    { error: "Order not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json({ order });
        }

        // Build query for listing orders
        let query = supabase.from("orders").select("*");

        // Filter out pending orders globally
        query = query.neq("order_status", "pending");

        if (deliveryAssigned) {
            // Orders where this volunteer is assigned as delivery volunteer
            query = query
                .eq("volunteer_id", volunteer.id)
                .eq("is_delivery_duty", true);
        } else if (unassigned) {
            // Orders available for delivery (no delivery volunteer assigned yet)
            // Must check both volunteer_id is null OR is_delivery_duty is false/null
            query = query.or("volunteer_id.is.null,is_delivery_duty.is.null,is_delivery_duty.eq.false");
            if (status) {
                query = query.eq("order_status", status);
            }
        } else {
            // Orders referred by this volunteer (not delivery duty)
            query = query
                .eq("volunteer_id", volunteer.id)
                .or("is_delivery_duty.is.null,is_delivery_duty.eq.false");
        }

        query = query.order("created_at", { ascending: false });

        const { data: orders, error: ordersError } = await query;

        if (ordersError) {
            console.error("Orders fetch error:", ordersError);
            return NextResponse.json({ error: ordersError.message }, { status: 500 });
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
