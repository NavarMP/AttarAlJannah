import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { calculateReferralCommission } from "@/lib/utils/commission-calculator";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            order_id, // Our internal order ID
        } = body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
            return NextResponse.json(
                { error: "Missing required payment verification fields" },
                { status: 400 }
            );
        }

        // Verify Razorpay signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            console.error("❌ Invalid payment signature");
            return NextResponse.json(
                { error: "Payment verification failed" },
                { status: 400 }
            );
        }

        console.log("✅ Payment signature verified for order:", order_id);

        const supabase = await createClient();

        // Update order with payment details AND change status to 'ordered'
        const { data: order, error: updateError } = await supabase
            .from("orders")
            .update({
                razorpay_order_id,
                razorpay_payment_id,
                payment_status: "paid",
                order_status: "ordered", // Promote from 'payment_pending' to 'ordered'
                updated_at: new Date().toISOString(),
            })
            .eq("id", order_id)
            .select("*, volunteers!orders_volunteer_id_fkey(*)")
            .single();

        if (updateError) {
            console.error("❌ Failed to update order:", updateError);
            return NextResponse.json(
                { error: "Failed to update order status" },
                { status: 500 }
            );
        }

        console.log("✅ Order payment status updated:", order_id);

        // Calculate and update referral commission if there's a referral volunteer
        if (order.volunteer_id) {
            console.log("💰 Calculating referral commission for volunteer:", order.volunteer_id);

            // Get all 'ordered' and 'delivered' orders for this volunteer to calculate cumulative bottles
            const { data: volunteerOrders } = await supabase
                .from("orders")
                .select("quantity")
                .eq("volunteer_id", order.volunteer_id)
                .in("order_status", ["ordered", "delivered"]);

            const totalBottles = volunteerOrders?.reduce((sum, o) => sum + o.quantity, 0) || 0;
            const newCommission = calculateReferralCommission(totalBottles);

            console.log(`📊 Total bottles for volunteer: ${totalBottles}, New commission: ₹${newCommission}`);

            // Update volunteer's referral commission
            await supabase
                .from("volunteers")
                .update({
                    total_referral_commission: newCommission,
                })
                .eq("id", order.volunteer_id);

            console.log("✅ Referral commission updated");
        }

        return NextResponse.json({
            success: true,
            message: "Payment verified successfully",
            order,
        });
    } catch (error) {
        console.error("❌ Payment verification error:", error);
        return NextResponse.json(
            {
                error: "Payment verification failed",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
