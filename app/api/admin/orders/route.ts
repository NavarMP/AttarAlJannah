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
            // For search, we need to handle both text fields and UUID
            // Since Supabase doesn't support UUID::text casting in the query builder easily,
            // we'll search text fields in the query and filter UUIDs in memory
            const searchTerm = search.trim();
            query = query.or(
                `customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%,whatsapp_number.ilike.%${searchTerm}%`
            );
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let { data: orders, error, count } = await query.range(from, to);

        if (error) {
            console.error("Orders fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // If searching and no results, try searching by UUID prefix
        // We'll need to fetch without the text search and filter by UUID client-side
        if (search && (!orders || orders.length === 0)) {
            const searchTerm = search.trim().toLowerCase();

            // Reset query and search by UUID client-side
            let uuidQuery = supabase
                .from("orders")
                .select(`
                    *,
                    volunteer:users!orders_referred_by_fkey(name)
                `, { count: "exact" })
                .order("created_at", { ascending: false });

            if (status && status !== "all") {
                uuidQuery = uuidQuery.eq("order_status", status);
            }

            // Fetch more results to filter client-side (up to 100 for UUID search)
            const { data: allOrders, error: uuidError } = await uuidQuery.limit(100);

            if (!uuidError && allOrders) {
                // Filter by UUID prefix on client side
                const filteredOrders = allOrders.filter(order =>
                    order.id.toLowerCase().startsWith(searchTerm)
                );

                if (filteredOrders.length > 0) {
                    orders = filteredOrders.slice(from, to + 1);
                    count = filteredOrders.length;
                }
            }
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
