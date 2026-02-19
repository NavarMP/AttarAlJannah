import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config/admin";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = 20;

        // New: sorting params
        const sortBy = searchParams.get("sortBy") || "created_at";
        const sortOrder = searchParams.get("sortOrder") || "desc";

        // New: additional filters
        const referredBy = searchParams.get("referredBy");
        const deliveryMethod = searchParams.get("deliveryMethod");

        const supabase = await createClient();

        // Verify user is admin
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!isAdminEmail(user.email)) {
            return NextResponse.json({
                error: `Forbidden - Admin access required`
            }, { status: 403 });
        }

        // Use service role client to bypass RLS for admin queries
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Validate sort field to prevent injection
        const allowedSortFields = ["created_at", "quantity", "customer_name", "total_price"];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "created_at";
        const ascending = sortOrder === "asc";

        let query = adminSupabase
            .from("orders")
            .select(`
                *,
                volunteer:volunteers!orders_volunteer_id_fkey(name)
            `, { count: "exact" })
            .order(safeSortBy, { ascending });

        // Status filter
        if (status && status !== "all") {
            query = query.eq("order_status", status);
        }

        // Date filters — use IST-aware boundaries
        if (startDate) {
            // startDate is YYYY-MM-DD, treat as local IST start of day
            // IST = UTC+5:30, so start of day in IST = previous day 18:30 UTC
            const startIST = new Date(`${startDate}T00:00:00+05:30`);
            query = query.gte("created_at", startIST.toISOString());
        }

        if (endDate) {
            // End of the day in IST
            const endIST = new Date(`${endDate}T23:59:59.999+05:30`);
            query = query.lte("created_at", endIST.toISOString());
        }

        // Referred volunteer filter
        if (referredBy && referredBy !== "all") {
            query = query.eq("referred_by", referredBy);
        }

        // Delivery method filter
        if (deliveryMethod && deliveryMethod !== "all") {
            query = query.eq("delivery_method", deliveryMethod);
        }

        if (search) {
            // For search, we need to handle both text fields and UUID
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

        console.log(`Admin Orders Fetch: Found ${count} orders (returning ${orders?.length})`);

        // DEBUG: If 0 orders found, verify if ANY orders exist in the table to rule out Join issues
        if ((!count || count === 0) && !search && status === "all") {
            const { count: totalRaw, error: rawError } = await adminSupabase.from("orders").select("*", { count: "exact", head: true });
            console.log(`DEBUG: Total Raw Orders in DB: ${totalRaw}. Error: ${rawError?.message}`);

            if (totalRaw && totalRaw > 0) {
                console.log("Attempting fallback fetch without join...");
                const { data: fallbackOrders, error: fallbackError } = await adminSupabase
                    .from("orders")
                    .select("*")
                    .order(safeSortBy, { ascending })
                    .range(from, to);

                if (!fallbackError && fallbackOrders) {
                    orders = fallbackOrders;
                    count = totalRaw;
                }
            }
        }

        // If searching and no results, try searching by UUID prefix
        if (search && (!orders || orders.length === 0)) {
            const searchTerm = search.trim().toLowerCase();

            let uuidQuery = adminSupabase
                .from("orders")
                .select(`
                    *,
                    volunteer:volunteers!orders_volunteer_id_fkey(name)
                `, { count: "exact" })
                .order(safeSortBy, { ascending });

            if (status && status !== "all") {
                uuidQuery = uuidQuery.eq("order_status", status);
            }

            const { data: allOrders, error: uuidError } = await uuidQuery.limit(100);

            if (!uuidError && allOrders) {
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
