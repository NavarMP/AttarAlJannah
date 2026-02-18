import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Public endpoint to fetch the active payment method and UPI settings
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("site_settings")
            .select("key, value")
            .in("key", ["payment_method", "upi_id", "merchant_name"]);

        if (error || !data) {
            return NextResponse.json({
                paymentMethod: "qr",
                upiId: "",
                merchantName: "Attar Al Jannah",
            });
        }

        const settings: Record<string, string> = {};
        data.forEach((row: { key: string; value: string }) => {
            settings[row.key] = row.value;
        });

        return NextResponse.json({
            paymentMethod: settings.payment_method || "qr",
            upiId: settings.upi_id || "",
            merchantName: settings.merchant_name || "Attar Al Jannah",
        });
    } catch (error) {
        console.error("Payment method fetch error:", error);
        return NextResponse.json({
            paymentMethod: "qr",
            upiId: "",
            merchantName: "Attar Al Jannah",
        });
    }
}
