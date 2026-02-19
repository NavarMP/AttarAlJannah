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
            .select(`
                *,
                volunteers:volunteers!volunteer_id(name, volunteer_id)
            `)
            .eq("id", id)
            .single();

        if (error) {
            console.error("Order fetch error:", error);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Flatten the volunteer data for easier access
        const orderWithVolunteerId = {
            ...data,
            delivery_volunteer_id: data.volunteers?.volunteer_id || null
        };

        return NextResponse.json(orderWithVolunteerId);
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
        const { order_status, delivery_method, volunteer_id, is_delivery_duty } = body;

        // Allow updates if at least one meaningful field is present
        if (!order_status && !delivery_method && !volunteer_id && is_delivery_duty === undefined) {
            return NextResponse.json({ error: "No fields to update provided" }, { status: 400 });
        }

        const supabase = await createClient();

        // First, get the current order to check previous status, volunteer info, and quantity
        const { data: currentOrder, error: fetchError } = await supabase
            .from("orders")
            .select("order_status, volunteer_id, quantity, customer_id, id")
            .eq("id", id)
            .single();

        if (fetchError || !currentOrder) {
            console.error("Order fetch error:", fetchError);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const updateData: any = {};
        if (order_status) updateData.order_status = order_status;
        if (delivery_method) updateData.delivery_method = delivery_method;
        if (volunteer_id) updateData.volunteer_id = volunteer_id;
        if (is_delivery_duty !== undefined) updateData.is_delivery_duty = is_delivery_duty;

        console.log("=== Order Update ===");
        console.log("Order ID:", id);
        console.log("Update Payload:", updateData);

        // Update order
        const { data, error } = await supabase
            .from("orders")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Order update error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log("✓ Order updated successfully");

        // Only run status-specific logic (commission, notifications) if status actually changed
        if (order_status && order_status !== currentOrder.order_status) {
            const previousStatus = currentOrder.order_status;
            // Use the volunteer_id from the update if present, otherwise fall back to current order's volunteer
            // Note: For commission logic, we generally track the *referral* volunteer.
            // If volunteer_id is being updated here (e.g. for delivery), we should be careful.
            // However, the original logic used `currentOrder.volunteer_id`.
            // If we are assigning a delivery volunteer, `volunteer_id` might change to the delivery person.
            // This is a potential existing edge case in the data model (single volunteer_id for both referral and delivery?),
            // but for now we follow the existing pattern using the ID from the record (or the new one if updated).
            const targetVolunteerId = volunteer_id || currentOrder.volunteer_id;
            const orderQuantity = currentOrder.quantity;

            console.log("→ Status changed from", previousStatus, "to", order_status);

            // Update challenge_progress for volunteer orders
            // NEW STATUS LOGIC: 'ordered' and 'delivered' count toward commission
            if (targetVolunteerId && (order_status === "ordered" || order_status === "delivered")) {
                console.log("→ Volunteer order detected, checking progress update...");

                // Increment bottles if this is a new qualifying order or reactivated from cancelled/cant_reach
                const shouldIncrement = previousStatus === "cant_reach" || previousStatus === "cancelled" ||
                    (!previousStatus || (previousStatus !== "ordered" && previousStatus !== "delivered"));

                if (shouldIncrement) {
                    console.log(`→ Status changed to ${order_status} - adding to commission`);
                    console.log(`→ Adding ${orderQuantity} bottles to volunteer ${targetVolunteerId}'s progress`);

                    // Get current progress
                    const { data: progress, error: progressFetchError } = await supabase
                        .from("challenge_progress")
                        .select("confirmed_orders, goal")
                        .eq("volunteer_id", targetVolunteerId)
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
                            .eq("volunteer_id", targetVolunteerId);

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
                                volunteer_id: targetVolunteerId,
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
                    console.log(`⚠ Status was already ${previousStatus} - no update needed`);
                }
            } else if (targetVolunteerId && (order_status === "cant_reach" || order_status === "cancelled")) {
                // If order is cancelled/cant_reach, subtract from progress if it was previously counted
                if (previousStatus === "ordered" || previousStatus === "delivered") {
                    console.log(`→ Order moved to ${order_status}, removing ${orderQuantity} bottles from progress`);

                    const { data: progress } = await supabase
                        .from("challenge_progress")
                        .select("confirmed_orders")
                        .eq("volunteer_id", targetVolunteerId)
                        .single();

                    if (progress) {
                        const newTotal = Math.max(0, progress.confirmed_orders - orderQuantity);
                        await supabase
                            .from("challenge_progress")
                            .update({ confirmed_orders: newTotal })
                            .eq("volunteer_id", targetVolunteerId);
                        console.log(`✅ Removed ${orderQuantity} bottles. New total: ${newTotal}`);
                    }
                }
            }

            console.log("✓ Progress updated successfully\n");

            // Trigger notification for status change
            try {
                const { NotificationService } = await import("@/lib/services/notification-service");
                await NotificationService.notifyOrderStatusChange({
                    orderId: id,
                    newStatus: order_status,
                    customerId: currentOrder.customer_id,
                    volunteerId: targetVolunteerId,
                });
                console.log("📧 Status change notification sent");
            } catch (notifError) {
                console.error("⚠️ Notification error (non-blocking):", notifError);
            }
        }

        return NextResponse.json({
            success: true,
            data,
            message: "Order updated successfully"
        });
    } catch (error) {
        console.error("Order update error:", error);
        return NextResponse.json(
            { error: "Failed to update order" },
            { status: 500 }
        );
    }
}
