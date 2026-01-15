import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error("Order fetch error:", error);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Order API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch order" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { order_status } = body;

        if (!order_status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        const supabase = await createClient();

        // First, get the current order to check previous status, volunteer info, and quantity
        const { data: currentOrder, error: fetchError } = await supabase
            .from("orders")
            .select("order_status, referred_by, quantity")
            .eq("id", id)
            .single();

        if (fetchError || !currentOrder) {
            console.error("Order fetch error:", fetchError);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const previousStatus = currentOrder.order_status;
        const volunteerId = currentOrder.referred_by;
        const orderQuantity = currentOrder.quantity;

        console.log("=== Order Status Update ===");
        console.log("Order ID:", id);
        console.log("Previous Status:", previousStatus);
        console.log("New Status:", order_status);
        console.log("Volunteer ID:", volunteerId);
        console.log("Order Quantity:", orderQuantity);

        // Update order status
        const { data, error } = await supabase
            .from("orders")
            .update({ order_status })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Order update error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log("✓ Order status updated successfully");

        // Update challenge_progress if status changed to confirmed or delivered
        // Count bottles (quantity) not orders
        if (volunteerId && (order_status === "confirmed" || order_status === "delivered")) {
            console.log("→ Volunteer order detected, checking if we should update progress...");

            // Only increment if previous status was pending
            if (previousStatus === "pending") {
                console.log(`→ Status changed from pending to ${order_status}`);
                console.log(`→ Adding ${orderQuantity} bottles to volunteer ${volunteerId}'s progress`);

                // Get current progress
                const { data: progress, error: progressFetchError } = await supabase
                    .from("challenge_progress")
                    .select("confirmed_orders, goal")
                    .eq("volunteer_id", volunteerId)
                    .single();

                if (progressFetchError) {
                    console.error("❌ Error fetching progress:", progressFetchError);
                } else if (progress) {
                    console.log(`→ Current bottles: ${progress.confirmed_orders}, Goal: ${progress.goal}`);
                    const newTotal = progress.confirmed_orders + orderQuantity;
                    console.log(`→ New total will be: ${newTotal}`);

                    // Add quantity (bottles) to confirmed_orders
                    const { error: updateError } = await supabase
                        .from("challenge_progress")
                        .update({
                            confirmed_orders: newTotal
                        })
                        .eq("volunteer_id", volunteerId);

                    if (updateError) {
                        console.error("❌ Failed to update challenge_progress:", updateError);
                    } else {
                        console.log(`✅ Successfully added ${orderQuantity} bottles! New total: ${newTotal}`);
                    }
                } else {
                    console.log("→ No progress record found, creating new one");
                    // Create progress record if it doesn't exist
                    const { error: insertError } = await supabase
                        .from("challenge_progress")
                        .insert({
                            volunteer_id: volunteerId,
                            confirmed_orders: orderQuantity,
                            goal: 20 // Default goal
                        });

                    if (insertError) {
                        console.error("❌ Failed to create challenge_progress:", insertError);
                    } else {
                        console.log(`✅ Created progress record with ${orderQuantity} bottles`);
                    }
                }
            } else {
                console.log(`⚠ Previous status was ${previousStatus}, not pending - no update needed`);
            }
        } else {
            if (!volunteerId) {
                console.log("⚠ No volunteer referral on this order");
            }
        }
        console.log("=== End Status Update ===\n");

        return NextResponse.json({ order: data });
    } catch (error) {
        console.error("Order API error:", error);
        return NextResponse.json(
            { error: "Failed to update order" },
            { status: 500 }
        );
    }
}
