import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

// GET: Fetch all site settings
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("site_settings")
            .select("key, value");

        if (error) {
            console.error("Settings fetch error:", error);
            return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
        }

        // Convert array of { key, value } to an object
        const settings: Record<string, string> = {};
        (data || []).forEach((row: { key: string; value: string }) => {
            settings[row.key] = row.value;
        });

        return NextResponse.json({ settings });
    } catch (error) {
        console.error("Settings API error:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

// PATCH: Update a setting
export async function PATCH(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const body = await request.json();
        const { key, value } = body;

        if (!key || !value) {
            return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
        }

        // Validate allowed keys
        const allowedKeys = ["payment_method", "upi_id", "merchant_name"];
        if (!allowedKeys.includes(key)) {
            return NextResponse.json({ error: "Invalid setting key" }, { status: 400 });
        }

        // Validate payment_method values
        if (key === "payment_method" && !["qr", "razorpay"].includes(value)) {
            return NextResponse.json({ error: "Payment method must be 'qr' or 'razorpay'" }, { status: 400 });
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from("site_settings")
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

        if (error) {
            console.error("Settings update error:", error);
            return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "update",
            entityType: "settings",
            entityId: key,
            details: { previous_value: 'unknown', new_value: value },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ success: true, key, value });
    } catch (error) {
        console.error("Settings API error:", error);
        return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
    }
}
