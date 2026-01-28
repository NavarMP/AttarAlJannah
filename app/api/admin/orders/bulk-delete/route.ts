import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config/admin";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify admin authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin via email
        if (!isAdminEmail(user.email)) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        const { orderIds } = await request.json();

        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });
        }

        // Delete orders from database
        const { data, error } = await supabase
            .from("orders")
            .delete()
            .in("id", orderIds)
            .select();

        if (error) {
            console.error("Bulk delete error:", error);
            return NextResponse.json(
                { error: "Failed to delete orders", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            deletedCount: data?.length || 0,
            message: `Successfully deleted ${data?.length || 0} order(s) from database`,
        });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
