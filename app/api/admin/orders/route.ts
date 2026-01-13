import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = 20;

        const supabase = await createClient();

        let query = supabase
            .from("orders")
            .select(`
                *,
                volunteer:users!orders_referred_by_fkey(name)
            `, { count: "exact" })
            .order("created_at", { ascending: false });

        if (status && status !== "all") {
            query = query.eq("order_status", status);
        }

        if (search) {
            query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: orders, error, count } = await query.range(from, to);

        if (error) {
            console.error("Orders fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform the data to include volunteer_name
        const transformedOrders = orders?.map(order => ({
            ...order,
            volunteer_name: order.volunteer?.name || null,
            volunteer: undefined, // Remove the nested object
        }));

        return NextResponse.json({
            orders: transformedOrders || [],
            totalCount: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        });
    } catch (error) {
        console.error("Orders API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}
