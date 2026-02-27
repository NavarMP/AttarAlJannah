import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { calculateReferralCommission } from "@/lib/utils/commission-calculator";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Verify webhook signature
        const webhookSignature = request.headers.get("x-razorpay-signature");
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error("❌ Webhook secret not configured");
            return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
        }

        if (!webhookSignature) {
            console.error("❌ Missing webhook signature");
            return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
        }

        // Verify signature
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(JSON.stringify(body))
            .digest("hex");

        if (expectedSignature !== webhookSignature) {
            console.error("❌ Invalid webhook signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        console.log("✅ Webhook signature verified");

        const event = body.event;
        const payload = body.payload.payment.entity;

        console.log("📨 Razorpay webhook event:", event);

        const supabase = await createClient();

        // Handle different webhook events
        switch (event) {
            case "payment.captured":
            case "payment.authorized": {
                // Payment successful - update order
                const razorpayOrderId = payload.order_id;
                const razorpayPaymentId = payload.id;

                console.log("💳 Payment successful:", razorpayPaymentId);

                // Find order by razorpay_order_id
                const { data: order, error: findError } = await supabase
                    .from("orders")
                    .select("*")
                    .eq("razorpay_order_id", razorpayOrderId)
                    .single();

                if (findError || !order) {
                    console.error("❌ Order not found for razorpay_order_id:", razorpayOrderId);
                    return NextResponse.json({ received: true });
                }

                // Update payment status
                const { error: updateError } = await supabase
                    .from("orders")
                    .update({
                        razorpay_payment_id: razorpayPaymentId,
                        payment_status: "paid",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", order.id);

                if (updateError) {
                    console.error("❌ Failed to update order:", updateError);
                } else {
                    console.log("✅ Order payment status updated via webhook");

                    // Update referral commission
                    if (order.volunteer_id) {
                        const { data: volunteerOrders } = await supabase
                            .from("orders")
                            .select("quantity")
                            .eq("volunteer_id", order.volunteer_id)
                            .in("order_status", ["confirmed", "delivered"]);

                        const totalBottles = volunteerOrders?.reduce((sum, o) => sum + o.quantity, 0) || 0;
                        const newCommission = calculateReferralCommission(totalBottles);

                        await supabase
                            .from("volunteers")
                            .update({ total_referral_commission: newCommission })
                            .eq("id", order.volunteer_id);

                        console.log("✅ Referral commission updated via webhook");
                    }
                }
                break;
            }

            case "payment.failed": {
                // Payment failed - optionally update order
                const razorpayOrderId = payload.order_id;
                console.log("❌ Payment failed for order:", razorpayOrderId);

                // Find and update order
                await supabase
                    .from("orders")
                    .update({
                        payment_status: "pending",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("razorpay_order_id", razorpayOrderId);

                break;
            }

            default:
                console.log("ℹ️ Unhandled webhook event:", event);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("❌ Webhook processing error:", error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}
