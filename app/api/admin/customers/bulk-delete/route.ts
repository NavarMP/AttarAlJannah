import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Verify admin
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { customerIds } = await request.json();

        if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
            return NextResponse.json({ error: "No customer IDs provided" }, { status: 400 });
        }

        const { error, count } = await supabase
            .from("customers")
            .delete()
            .in("id", customerIds);

        if (error) {
            console.error("Bulk customer delete error:", error);
            return NextResponse.json({ error: "Failed to delete customers" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Deleted ${count || customerIds.length} customer(s)`,
            deletedCount: count || customerIds.length,
        });
    } catch (error) {
        console.error("Bulk customer delete error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
