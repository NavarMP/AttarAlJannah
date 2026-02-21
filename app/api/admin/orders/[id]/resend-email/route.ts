import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendCustomOrderConfirmation } from "@/lib/services/nodemailer-service";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();

        // 1. Fetch order details from database
        const { data: order, error } = await supabase
            .from("orders")
            .select(`
                *,
                customers:customers!customer_id(email)
            `)
            .eq("id", id)
            .single();

        if (error || !order) {
            console.error("Order fetch error or not found:", error);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const customerEmail = order.customers?.email || null;

        // 2. Validate email exists
        if (!customerEmail) {
            return NextResponse.json({ error: "This order does not have an associated email address." }, { status: 400 });
        }

        // 3. Trigger email sending
        const emailResult = await sendCustomOrderConfirmation({
            to: customerEmail,
            customerName: order.customer_name,
            orderId: order.id,
            productName: order.product_name || "عطر الجنّة (Attar Al Jannah)",
            quantity: order.quantity,
            totalPrice: order.total_price,
            customerAddress: order.customer_address,
            paymentMethod: order.payment_method
        });

        if (!emailResult.success) {
            console.error("Failed to resend confirmation email:", emailResult.error);
            return NextResponse.json({ error: "Failed to send email. Check SMTP configuration." }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Email confirmation resent successfully 🎉"
        });

    } catch (error: any) {
        console.error("Resend Email API error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred while resending the email" },
            { status: 500 }
        );
    }
}
