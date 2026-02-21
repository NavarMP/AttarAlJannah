import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const supabase = await createClient();

        // Fetch distinct non-null payment_upi_ids
        // Since Supabase RPC/distinct query is limited out of the box without defining new functions, 
        // we can fetch a decent limit of non-null distinct ones locally
        const { data, error } = await supabase
            .from("orders")
            .select("payment_upi_id")
            .not("payment_upi_id", "is", null)
            .order("created_at", { ascending: false })
            .limit(1000); // 1000 is more than enough to gather all unique UPI IDs realistically used

        if (error) {
            console.error("Failed to fetch UPI IDs from orders:", error);
            return NextResponse.json({ error: "Failed to fetch UPI IDs" }, { status: 500 });
        }

        // Deduplicate locally
        const uniqueUpis = Array.from(new Set(data.map(o => o.payment_upi_id).filter(Boolean)));

        // Sort them alphabetically just to be clean
        uniqueUpis.sort();

        return NextResponse.json({ upiIds: uniqueUpis });
    } catch (error) {
        console.error("UPI IDs fallback error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
