import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config/admin";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { orderIds, status } = await request.json();

        // Verify user is admin
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!isAdminEmail(user.email)) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ error: "Invalid order IDs" }, { status: 400 });
        }

        if (!status || !["pending", "confirmed", "delivered"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Update orders
        const { error, count } = await supabase
            .from("orders")
            .update({ order_status: status })
            .in("id", orderIds);

        if (error) {
            console.error("Error bulk updating orders:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Updated status to ${status} for ${orderIds.length} order(s)`
        });

    } catch (error: any) {
        console.error("Bulk update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
