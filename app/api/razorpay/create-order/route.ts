import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, currency = "INR", orderId, customerInfo } = body;

        // Validate required fields
        if (!amount || !orderId) {
            return NextResponse.json(
                { error: "Missing required fields: amount, orderId" },
                { status: 400 }
            );
        }

        // Validate Razorpay configuration
        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error("❌ Razorpay not configured");
            return NextResponse.json(
                { error: "Payment gateway not configured" },
                { status: 500 }
            );
        }

        console.log("💳 Creating Razorpay order:", { amount, orderId });

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Amount in paise
            currency,
            receipt: orderId, // Our internal order ID
            notes: {
                order_id: orderId,
                customer_name: customerInfo?.name || "",
                customer_phone: customerInfo?.phone || "",
            },
        });

        console.log("✅ Razorpay order created:", razorpayOrder.id);

        return NextResponse.json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error("❌ Razorpay order creation error:", error);
        return NextResponse.json(
            {
                error: "Failed to create payment order",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
