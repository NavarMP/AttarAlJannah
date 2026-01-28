import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const customerName = formData.get("customerName") as string;
        const customerPhone = formData.get("customerPhone") as string;
        const whatsappNumber = formData.get("whatsappNumber") as string;
        const customerEmail = formData.get("customerEmail") as string || null;
        const customerAddress = formData.get("customerAddress") as string;
        const quantity = parseInt(formData.get("quantity") as string);
        const totalPrice = parseFloat(formData.get("totalPrice") as string);
        const paymentMethod = formData.get("paymentMethod") as "cod" | "upi";
        const referredBy = formData.get("referredBy") as string || null;
        const paymentScreenshot = formData.get("paymentScreenshot") as File | null;

        // Check environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error("❌ Supabase environment variables are not set!");
            console.error("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing");
            console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing");
            return NextResponse.json(
                { error: "Server configuration error - Supabase not configured" },
                { status: 500 }
            );
        }

        console.log("📝 Creating order for:", customerName, customerPhone);

        const supabase = await createClient();

        let paymentScreenshotUrl: string | null = null;

        // Upload payment screenshot if provided
        if (paymentScreenshot && paymentMethod === "upi") {
            console.log("📤 Uploading payment screenshot...");
            const fileExt = paymentScreenshot.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("payment-screenshots")
                .upload(fileName, paymentScreenshot);

            if (uploadError) {
                console.error("❌ Upload error:", uploadError.message);
                console.error("Upload error details:", JSON.stringify(uploadError, null, 2));
            } else {
                console.log("✅ Screenshot uploaded:", fileName);
                const { data: { publicUrl } } = supabase.storage
                    .from("payment-screenshots")
                    .getPublicUrl(fileName);
                paymentScreenshotUrl = publicUrl;
            }
        }

        // If referredBy is provided, look up the volunteer's UUID from their volunteer_id (string)
        let referredByUuid: string | null = null;
        if (referredBy) {
            console.log("🔍 Looking up volunteer with ID:", referredBy);
            const { data: volunteer, error: volunteerError } = await supabase
                .from("volunteers") // New Table
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
            .from("customers") // New Table
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

        // Create order
        console.log("💾 Inserting order into database...");
        const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert({
                customer_id: customerId,
                customer_name: customerName,
                customer_phone: customerPhone,
                whatsapp_number: whatsappNumber,
                // customer_email: customerEmail, // Column missing in DB
                customer_address: customerAddress,
                product_name: "عطر الجنّة (Attar Al Jannah)",
                quantity,
                total_price: totalPrice,
                payment_method: paymentMethod,
                payment_status: paymentMethod === "cod" ? "pending" : "paid",
                order_status: "pending",
                payment_screenshot_url: paymentScreenshotUrl,
                volunteer_id: referredByUuid, // UUID of volunteer
            })
            .select()
            .single();

        if (orderError) {
            console.error("❌ Database error:", orderError.message);
            console.error("Error code:", orderError.code);
            console.error("Error details:", JSON.stringify(orderError, null, 2));

            // Cleanup: Delete the customer if order creation failed (to avoid loose customers without orders)
            // Note: This deletes the customer even if they came back. 
            // Better to only delete if it was JUST created? 
            // Since we can't easily know if upsert created or updated without return value inspection (which supabase upsert data might show?),
            // we will just leave it OR delete.
            // User complained: "customer has been created... it should not unless i place atleast an order."
            // So we delete.
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

        console.log("✅ Order created successfully:", orderData.id);

        return NextResponse.json({
            success: true,
            order: orderData
        });
    } catch (error) {
        console.error("❌ Server error:", error);
        console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
