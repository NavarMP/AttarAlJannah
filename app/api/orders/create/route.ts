import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const customerName = formData.get("customerName") as string;
        const customerPhone = formData.get("customerPhone") as string;
        const customerEmail = formData.get("customerEmail") as string || null;
        const customerAddress = formData.get("customerAddress") as string;
        const quantity = parseInt(formData.get("quantity") as string);
        const totalPrice = parseFloat(formData.get("totalPrice") as string);
        const paymentMethod = formData.get("paymentMethod") as "cod" | "upi";
        const referredBy = formData.get("referredBy") as string || null;
        const paymentScreenshot = formData.get("paymentScreenshot") as File | null;

        const supabase = await createClient();

        let paymentScreenshotUrl: string | null = null;

        // Upload payment screenshot if provided
        if (paymentScreenshot && paymentMethod === "upi") {
            const fileExt = paymentScreenshot.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("payment-screenshots")
                .upload(fileName, paymentScreenshot);

            if (uploadError) {
                console.error("Upload error:", uploadError);
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from("payment-screenshots")
                    .getPublicUrl(fileName);
                paymentScreenshotUrl = publicUrl;
            }
        }

        // Create order
        const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert({
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: customerEmail,
                customer_address: customerAddress,
                product_name: "عطر الجنّة (Attar Al Jannah)",
                quantity,
                total_price: totalPrice,
                payment_method: paymentMethod,
                payment_status: paymentMethod === "cod" ? "pending" : "paid",
                order_status: "pending",
                payment_screenshot_url: paymentScreenshotUrl,
                referred_by: referredBy,
            })
            .select()
            .single();

        if (orderError) {
            console.error("Order error:", orderError);
            return NextResponse.json(
                { error: "Failed to create order" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            order: orderData
        });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
