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
                volunteers:volunteers!volunteer_id(name, volunteer_id),
                customers:customers!customer_id(email)
            `)
            .eq("id", id)
            .single();

        if (error) {
            console.error("Order fetch error:", error);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Flatten the volunteer and customer data for easier access
        const orderWithVolunteerId = {
            ...data,
            delivery_volunteer_id: data.volunteers?.volunteer_id || null,
            customer_email: data.customers?.email || null
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
        const {
            order_status, delivery_method, volunteer_id,
            is_delivery_duty, created_at, payment_upi_id,
            customer_name, customer_phone, whatsapp_number, customer_email,
            customer_address, product_name, quantity, total_price,
            whatsapp_sent, email_sent, admin_notes, payment_screenshot_url, cash_received,
            payment_method
        } = body;

        // Allow updates if at least one meaningful field is present
        if (!order_status && !delivery_method && !volunteer_id && is_delivery_duty === undefined && !created_at && payment_upi_id === undefined && !customer_name && !customer_phone && !whatsapp_number && customer_email === undefined && !customer_address && !product_name && quantity === undefined && total_price === undefined && whatsapp_sent === undefined && email_sent === undefined && admin_notes === undefined && payment_screenshot_url === undefined && cash_received === undefined && payment_method === undefined) {
            return NextResponse.json({ error: "No fields to update provided" }, { status: 400 });
        }

        const supabase = await createClient();

        // First, get the current order to check previous status, volunteer info, quantity, and screenshot
        const { data: currentOrder, error: fetchError } = await supabase
            .from("orders")
            .select("order_status, volunteer_id, quantity, customer_id, id, payment_screenshot_url")
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
        if (created_at) updateData.created_at = created_at;
        if (payment_upi_id !== undefined) updateData.payment_upi_id = payment_upi_id;

        // Deep properties
        if (customer_name !== undefined) updateData.customer_name = customer_name;
        if (customer_phone !== undefined) updateData.customer_phone = customer_phone;
        if (whatsapp_number !== undefined) updateData.whatsapp_number = whatsapp_number;
        if (customer_address !== undefined) updateData.customer_address = customer_address;
        if (product_name !== undefined) updateData.product_name = product_name;
        if (quantity !== undefined) updateData.quantity = quantity;
        if (total_price !== undefined) updateData.total_price = total_price;
        if (whatsapp_sent !== undefined) updateData.whatsapp_sent = whatsapp_sent;
        if (email_sent !== undefined) updateData.email_sent = email_sent;
        if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
        if (payment_screenshot_url !== undefined) updateData.payment_screenshot_url = payment_screenshot_url;
        if (cash_received !== undefined) updateData.cash_received = cash_received;
        if (payment_method !== undefined) updateData.payment_method = payment_method;

        // Handle screenshot deletion if it's being removed or replaced
        if (payment_screenshot_url !== undefined && currentOrder.payment_screenshot_url && payment_screenshot_url !== currentOrder.payment_screenshot_url) {
            try {
                // Extract the path after the bucket name
                const urlParts = currentOrder.payment_screenshot_url.split('/payment-screenshots/');
                if (urlParts.length > 1) {
                    const filePath = urlParts[1];
                    console.log(`🗑️ Deleting old screenshot from storage: ${filePath}`);
                    const { error: deleteError } = await supabase.storage
                        .from("payment-screenshots")
                        .remove([filePath]);

                    if (deleteError) {
                        console.error("⚠️ Failed to delete old payment screenshot:", deleteError);
                    } else {
                        console.log("✅ Successfully deleted old payment screenshot");
                    }
                }
            } catch (err) {
                console.error("⚠️ Error parsing old payment screenshot URL for deletion:", err);
            }
        }

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

        // Parallel update: if we received deep properties, update the underlying customers table directly 
        // to maintain synchronicity (specifically for email which is only structurally bound to customers)
        if (currentOrder.customer_id && (customer_email !== undefined || customer_name !== undefined || customer_phone !== undefined)) {
            const customerPatch: any = {};
            if (customer_email !== undefined) customerPatch.email = customer_email;
            if (customer_name !== undefined) customerPatch.name = customer_name;
            if (customer_phone !== undefined) customerPatch.phone = customer_phone;

            if (Object.keys(customerPatch).length > 0) {
                const { error: customerError } = await supabase
                    .from("customers")
                    .update(customerPatch)
                    .eq("id", currentOrder.customer_id);

                if (customerError) {
                    console.error("Failed to sync customer changes for order update:", customerError);
                }
            }
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
            // NEW STATUS LOGIC: 'pending', 'confirmed', and 'delivered' count toward commission
            const activeStatuses = ["pending", "confirmed", "delivered"];
            const inactiveStatuses = ["cant_reach", "cancelled"];

            if (targetVolunteerId) {
                const wasActive = activeStatuses.includes(previousStatus);
                const isNowActive = activeStatuses.includes(order_status);
                const wasInactive = inactiveStatuses.includes(previousStatus);
                const isNowInactive = inactiveStatuses.includes(order_status);

                console.log("→ Volunteer order detected, checking progress update...");

                // If moving from inactive to active -> increment
                if ((wasInactive || !previousStatus) && isNowActive) {
                    console.log(`→ Status changed to ${order_status} - adding ${orderQuantity} bottles to commission`);
                    const { data: progress } = await supabase
                        .from("challenge_progress")
                        .select("confirmed_orders")
                        .eq("volunteer_id", targetVolunteerId)
                        .single();

                    if (progress) {
                        const newTotal = (progress.confirmed_orders || 0) + orderQuantity;
                        await supabase
                            .from("challenge_progress")
                            .update({ confirmed_orders: newTotal })
                            .eq("volunteer_id", targetVolunteerId);
                        console.log(`✅ Successfully added ${orderQuantity} bottles. New total: ${newTotal}`);
                    } else {
                        await supabase
                            .from("challenge_progress")
                            .insert({
                                volunteer_id: targetVolunteerId,
                                confirmed_orders: orderQuantity,
                                goal: 20
                            });
                        console.log(`✅ Created progress record with ${orderQuantity} bottles`);
                    }
                }
                // If moving from active to inactive -> decrement
                else if (wasActive && isNowInactive) {
                    console.log(`→ Order moved to ${order_status}, removing ${orderQuantity} bottles from progress`);
                    const { data: progress } = await supabase
                        .from("challenge_progress")
                        .select("confirmed_orders")
                        .eq("volunteer_id", targetVolunteerId)
                        .single();

                    if (progress) {
                        const newTotal = Math.max(0, (progress.confirmed_orders || 0) - orderQuantity);
                        await supabase
                            .from("challenge_progress")
                            .update({ confirmed_orders: newTotal })
                            .eq("volunteer_id", targetVolunteerId);
                        console.log(`✅ Removed ${orderQuantity} bottles. New total: ${newTotal}`);
                    }
                } else {
                    console.log(`⚠ Status change (${previousStatus} -> ${order_status}) doesn't affect active count - no update needed`);
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

        try {
            const { logAuditEvent, getClientIP } = await import("@/lib/services/audit");
            await logAuditEvent({
                actor: {
                    id: "system-or-admin-id", // Note: A real implementation would pull from session/auth context
                    email: "admin@system",
                    role: "admin",
                },
                action: "UPDATE_ORDER",
                entityType: "order",
                entityId: id,
                details: { changes: updateData },
                ipAddress: getClientIP(request),
            });
        } catch (auditError) {
            console.error("Audit log error:", auditError);
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
