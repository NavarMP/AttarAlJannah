import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { autoAssignDeliveryVolunteer } from "@/lib/services/volunteer-assignment";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const customerName = formData.get("customerName") as string;
        const customerPhone = formData.get("customerPhone") as string;
        const whatsappNumber = formData.get("whatsappNumber") as string;
        const customerEmail = formData.get("customerEmail") as string || null;
        const customerAddress = formData.get("customerAddress") as string;
        const productName = formData.get("productName") as string || "عطر الجنّة (Attar Al Jannah)";
        const quantity = parseInt(formData.get("quantity") as string);
        const totalPrice = parseFloat(formData.get("totalPrice") as string);
        const referredBy = formData.get("referredBy") as string || null;

        // Get individual address fields for structured storage
        const houseBuilding = formData.get("houseBuilding") as string;
        const town = formData.get("town") as string;
        const post = formData.get("post") as string;
        const city = formData.get("city") as string;
        const district = formData.get("district") as string;
        const state = formData.get("state") as string;
        const pincode = formData.get("pincode") as string;
        const locationLink = formData.get("locationLink") as string || null;

        // Check environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error("❌ Supabase environment variables are not set!");
            return NextResponse.json(
                { error: "Server configuration error - Supabase not configured" },
                { status: 500 }
            );
        }

        console.log("📝 Creating order for:", customerName, customerPhone);

        const supabase = await createClient();

        // If referredBy is provided, look up the volunteer's UUID from their volunteer_id (string)
        let referredByUuid: string | null = null;
        if (referredBy) {
            console.log("🔍 Looking up volunteer with ID:", referredBy);
            const { data: volunteer, error: volunteerError } = await supabase
                .from("volunteers")
                .select("id")
                .ilike("volunteer_id", referredBy) // Case insensitive lookup
                .single();

            if (volunteerError) {
                console.error("⚠️ Volunteer lookup error:", volunteerError.message);
                // Continue without referral if volunteer not found
            } else if (volunteer) {
                referredByUuid = volunteer.id;
                console.log("✅ Found volunteer UUID:", referredByUuid);
            }
        }

        // Create or update customer
        console.log("👤 Creating/Updating customer...");
        const { data: customerData, error: customerError } = await supabase
            .from("customers")
            .upsert({
                phone: customerPhone,
                name: customerName,
                address: customerAddress // Update address on new order
            }, { onConflict: "phone" })
            .select()
            .single();

        if (customerError) {
            console.error("⚠️ Customer creation warning:", customerError.message);
        }

        const customerId = customerData?.id || null;

        // Create order - NO payment_method or payment_screenshot_url
        // All orders use Razorpay, status starts as 'ordered'
        console.log("💾 Inserting order into database...");
        const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert({
                customer_id: customerId,
                customer_name: customerName,
                customer_phone: customerPhone,
                whatsapp_number: whatsappNumber,
                customer_address: customerAddress,
                product_name: productName,
                quantity,
                total_price: totalPrice,
                payment_status: "pending", // Will be updated after Razorpay payment
                order_status: "payment_pending", // Will change to 'ordered' after payment verification
                volunteer_id: referredByUuid, // Referral volunteer UUID
                // Razorpay fields will be updated after payment
                razorpay_order_id: null,
                razorpay_payment_id: null,
                // Address fields for delivery assignment
                house_name: houseBuilding,
                town: town,
                post_office: post,
                city: city,
                district: district,
                state: state,
                pincode: pincode,
            })
            .select()
            .single();

        if (orderError) {
            console.error("❌ Database error:", orderError.message);
            console.error("Error code:", orderError.code);
            console.error("Error details:", JSON.stringify(orderError, null, 2));

            // Cleanup: Delete the customer if order creation failed
            if (customerId) {
                console.log("🧹 Cleaning up customer record due to order failure:", customerId);
                await supabase.from("customers").delete().eq("id", customerId);
            }

            return NextResponse.json(
                {
                    error: "Failed to create order",
                    details: orderError.message,
                    hint: orderError.hint
                },
                { status: 500 }
            );
        }

        if (!orderData) {
            console.error("❌ Order data is null");
            return NextResponse.json(
                { error: "Order creation failed - no data returned" },
                { status: 500 }
            );
        }

        console.log("✅ Order created successfully:", orderData.id);

        // Trigger notification for order creation
        try {
            const { NotificationService } = await import("@/lib/services/notification-service");
            await NotificationService.notifyOrderCreated(orderData.id);
            console.log("📧 Order creation notifications sent");
        } catch (notifError) {
            console.error("⚠️ Notification error (non-blocking):", notifError);
            // Don't fail the order creation if notification fails
        }

        // Auto-assign delivery volunteer based on address (if address provided)
        let assignmentResult = null;
        if (houseBuilding && town && post) {
            try {
                console.log("🔍 Attempting auto-assignment for order:", orderData.id);
                assignmentResult = await autoAssignDeliveryVolunteer(orderData.id, {
                    houseBuilding,
                    town,
                    post,
                });

                if (assignmentResult.assigned) {
                    console.log(`✅ Auto-assigned to volunteer: ${assignmentResult.volunteerName}`);
                } else if (assignmentResult.matchCount > 1) {
                    console.log(`⚠️ Multiple volunteers (${assignmentResult.matchCount}) matched - admin review needed`);
                } else {
                    console.log("ℹ️ No matching volunteers found for auto-assignment");
                }
            } catch (assignmentError) {
                console.error("⚠️ Auto-assignment error (non-blocking):", assignmentError);
                // Don't fail order creation if auto-assignment fails
            }
        }

        // Return order data including ID for Razorpay payment processing
        return NextResponse.json({
            success: true,
            order: orderData,
            message: "Order created successfully",
            // Frontend will use this to create Razorpay order
            needsPayment: true,
        });
    } catch (error: any) {
        console.error("❌ Unexpected error in order creation:", error);
        return NextResponse.json(
            {
                error: "An unexpected error occurred",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
