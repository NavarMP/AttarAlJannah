import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const orderId = searchParams.get("orderId");
        const phone = searchParams.get("phone");

        if (!orderId || !phone) {
            return NextResponse.json({ error: "Order ID and identifier required" }, { status: 400 });
        }

        const supabase = await createClient();

        // Try to determine if this is a volunteer ID or customer phone
        // Check if it's a volunteer by looking up the volunteer_id
        const { data: volunteer } = await supabase
            .from("volunteers") // New Table
            .select("id")
            .ilike("volunteer_id", phone)
            // .eq("role", "volunteer")
            .maybeSingle();

        let order;
        let fetchError;

        if (volunteer) {
            // This is a volunteer - check referred_by
            const result = await supabase
                .from("orders")
                .select("*")
                .eq("id", orderId)
                .eq("volunteer_id", volunteer.id)
                .maybeSingle();

            order = result.data;
            fetchError = result.error;
        } else {
            // This is a customer - check customer_phone
            const phoneVariations = [
                phone,
                phone.replace('+91', ''),
                phone.replace(/\D/g, '').slice(-10)
            ];

            const result = await supabase
                .from("orders")
                .select("*")
                .eq("id", orderId)
                .in("customer_phone", phoneVariations)
                .maybeSingle();

            order = result.data;
            fetchError = result.error;
        }

        if (fetchError) {
            console.error("Order fetch error:", fetchError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        if (!order) {
            return NextResponse.json({ error: "Order not found or you don't have permission to delete it" }, { status: 404 });
        }

        // Only allow deletion of pending orders
        if (order.order_status !== "pending") {
            return NextResponse.json({ error: "Only pending orders can be deleted" }, { status: 403 });
        }

        // Delete the order
        const { error: deleteError } = await supabase
            .from("orders")
            .delete()
            .eq("id", orderId);

        if (deleteError) {
            console.error("Delete error:", deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
