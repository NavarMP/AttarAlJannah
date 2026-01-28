import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, volunteerId, phone } = body;

        console.log("Assigning volunteer:", { orderId, volunteerId, phone });

        if (!orderId || !volunteerId || !phone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Verify the order belongs to this customer (by phone)
        const phoneVariations = [
            phone,
            phone.replace('+91', ''),
            phone.replace(/\D/g, '').slice(-10)
        ];

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id, volunteer_id, order_status")
            .eq("id", orderId)
            .in("customer_phone", phoneVariations)
            .single();

        if (orderError || !order) {
            console.error("Order verification failed:", orderError);
            return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
        }

        if (order.volunteer_id) {
            return NextResponse.json({ error: "This order is already assigned to a volunteer" }, { status: 400 });
        }

        // 2. Find the volunteer by ID (case insensitive)
        const { data: volunteer, error: volunteerError } = await supabase
            .from("volunteers")
            .select("id, name")
            .ilike("volunteer_id", volunteerId)
            .single();

        if (volunteerError || !volunteer) {
            return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
        }

        // 3. Update the order
        const { error: updateError } = await supabase
            .from("orders")
            .update({ volunteer_id: volunteer.id })
            .eq("id", orderId);

        if (updateError) {
            console.error("Update failed:", updateError);
            return NextResponse.json({ error: "Failed to assign volunteer" }, { status: 500 });
        }

        // 4. (Optional) Update challenge progress if order is already confirmed/delivered?
        // Logic in admin/orders/[id]/route.ts PATCH handles status changes.
        // If we assign a volunteer to a CONFIRMED order, we should probably update their stats too.
        // However, this is an edge case. Usually customers assign immediately.
        // For robustness, let's just update the link. If stats are needed, admin can re-save status or we can add logic later.
        // Given complexity, let's stick to just linking for now, as stats update is complex (requires checking if already counted etc).
        // Actually, if order is CONFIRMED, the volunteer deserves credit immediately.

        if (order.order_status === 'confirmed' || order.order_status === 'delivered') {
            // Fetch order quantity to be accurate
            const { data: fullOrder } = await supabase.from("orders").select("quantity").eq("id", orderId).single();
            const quantity = fullOrder?.quantity || 0;

            // Update challenge progress
            const { data: progress } = await supabase
                .from("challenge_progress")
                .select("*")
                .eq("volunteer_id", volunteer.id)
                .single();

            if (progress) {
                await supabase
                    .from("challenge_progress")
                    .update({ confirmed_orders: progress.confirmed_orders + quantity })
                    .eq("volunteer_id", volunteer.id);
            } else {
                await supabase
                    .from("challenge_progress")
                    .insert({
                        volunteer_id: volunteer.id,
                        confirmed_orders: quantity,
                        goal: 20
                    });
            }
        }

        return NextResponse.json({ success: true, volunteerName: volunteer.name });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
