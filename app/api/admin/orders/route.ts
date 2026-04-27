import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin("viewer");
    if ("error" in auth) return auth.error;

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
        const deliveryVolunteer = searchParams.get("deliveryVolunteer");
        const deliveryMethod = searchParams.get("deliveryMethod");
        const paymentMethod = searchParams.get("paymentMethod");
        const cashReceived = searchParams.get("cashReceived");
        const zone = searchParams.get("zone");

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
                volunteer:volunteers!orders_volunteer_id_fkey(name),
                delivery_vol:volunteers!orders_delivery_volunteer_id_fkey(name)
            `, { count: "exact" })
            .is("deleted_at", null)
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
            query = query.eq("volunteer_id", referredBy);
        }

        // Delivery volunteer filter
        if (deliveryVolunteer && deliveryVolunteer !== "all") {
            query = query.eq("delivery_volunteer_id", deliveryVolunteer);
        }

        // Delivery method filter
        if (deliveryMethod && deliveryMethod !== "all") {
            query = query.eq("delivery_method", deliveryMethod);
        }

        // Payment method filter
        if (paymentMethod && paymentMethod !== "all") {
            query = query.eq("payment_method", paymentMethod);
        }

        // Cash received filter
        if (cashReceived && cashReceived !== "all") {
            const isReceived = cashReceived === "true";
            query = query.eq("cash_received", isReceived);
        }

        // Zone filter
        if (zone && zone !== "all") {
            query = query.eq("zone_id", zone);
        }

        // --- UNIVERSAL SEARCH: match across ALL order fields ---
        // Maps user-friendly search terms to database enum values
        const SEARCH_TERM_MAPPINGS: Record<string, { field: string; value: string }[]> = {
            // Payment methods
            "upi": [{ field: "payment_method", value: "qr" }],
            "razorpay": [{ field: "payment_method", value: "razorpay" }],
            "online": [{ field: "payment_method", value: "razorpay" }],
            "cod": [{ field: "payment_method", value: "cod" }],
            "cash on delivery": [{ field: "payment_method", value: "cod" }],
            "volunteer cash": [{ field: "payment_method", value: "volunteer_cash" }],
            "held by volunteer": [{ field: "payment_method", value: "volunteer_cash" }],
            "cash": [{ field: "payment_method", value: "cod" }, { field: "payment_method", value: "volunteer_cash" }],
            // Order statuses
            "pending": [{ field: "order_status", value: "pending" }],
            "confirmed": [{ field: "order_status", value: "confirmed" }],
            "delivered": [{ field: "order_status", value: "delivered" }],
            "cant reach": [{ field: "order_status", value: "cant_reach" }],
            "can't reach": [{ field: "order_status", value: "cant_reach" }],
            "cancelled": [{ field: "order_status", value: "cancelled" }],
            "canceled": [{ field: "order_status", value: "cancelled" }],
            // Delivery methods
            "pickup": [{ field: "delivery_method", value: "pickup" }],
            "self pickup": [{ field: "delivery_method", value: "pickup" }],
            "volunteer delivery": [{ field: "delivery_method", value: "volunteer" }],
            "courier": [{ field: "delivery_method", value: "courier" }],
            "by post": [{ field: "delivery_method", value: "post" }],
            "post": [{ field: "delivery_method", value: "post" }],
        };

        if (search) {
            const searchTerm = search.trim();
            const searchLower = searchTerm.toLowerCase();

            // Build the OR conditions for text columns
            const orConditions = [
                `customer_name.ilike.%${searchTerm}%`,
                `customer_phone.ilike.%${searchTerm}%`,
                `whatsapp_number.ilike.%${searchTerm}%`,
                `customer_address.ilike.%${searchTerm}%`,
                `product_name.ilike.%${searchTerm}%`,
                `admin_notes.ilike.%${searchTerm}%`,
                `payment_method.ilike.%${searchTerm}%`,
                `order_status.ilike.%${searchTerm}%`,
                `delivery_method.ilike.%${searchTerm}%`,
            ];

            // Check if search term matches any known friendly labels → add exact enum match
            for (const [term, mappings] of Object.entries(SEARCH_TERM_MAPPINGS)) {
                if (searchLower.includes(term) || term.includes(searchLower)) {
                    for (const mapping of mappings) {
                        orConditions.push(`${mapping.field}.eq.${mapping.value}`);
                    }
                }
            }

            // Check if search looks like a price/amount (numeric)
            const numericSearch = parseFloat(searchTerm.replace(/[₹,]/g, ""));
            if (!isNaN(numericSearch)) {
                orConditions.push(`total_price.eq.${numericSearch}`);
                orConditions.push(`quantity.eq.${numericSearch}`);
                orConditions.push(`delivery_fee.eq.${numericSearch}`);
            }

            // Deduplicate conditions
            const uniqueConditions = [...new Set(orConditions)];
            query = query.or(uniqueConditions.join(","));
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

        // If searching and no results from primary query, try extended search:
        // 1. Order ID prefix match
        // 2. Volunteer name match (requires join data)
        // 3. Date string match
        if (search && (!orders || orders.length === 0)) {
            const searchTerm = search.trim().toLowerCase();

            let extendedQuery = adminSupabase
                .from("orders")
                .select(`
                    *,
                    volunteer:volunteers!orders_volunteer_id_fkey(name),
                    delivery_vol:volunteers!orders_delivery_volunteer_id_fkey(name)
                `, { count: "exact" })
                .is("deleted_at", null)
                .order(safeSortBy, { ascending });

            if (status && status !== "all") {
                extendedQuery = extendedQuery.eq("order_status", status);
            }

            const { data: allOrders, error: extError } = await extendedQuery.limit(500);

            if (!extError && allOrders) {
                const filteredOrders = allOrders.filter(order => {
                    // Order ID prefix match
                    if (order.id.toLowerCase().startsWith(searchTerm)) return true;
                    if (order.id.toLowerCase().includes(searchTerm)) return true;

                    // Volunteer name match (referral volunteer)
                    const volName = order.volunteer?.name?.toLowerCase() || "";
                    if (volName.includes(searchTerm)) return true;

                    // Delivery volunteer name match
                    const deliveryVolName = order.delivery_vol?.name?.toLowerCase() || "";
                    if (deliveryVolName.includes(searchTerm)) return true;

                    // Date match (formatted date string)
                    try {
                        const dateStr = new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric"
                        }).toLowerCase();
                        if (dateStr.includes(searchTerm)) return true;

                        // Also try ISO date format
                        const isoDate = order.created_at?.slice(0, 10) || "";
                        if (isoDate.includes(searchTerm)) return true;
                    } catch {}

                    return false;
                });

                if (filteredOrders.length > 0) {
                    orders = filteredOrders.slice(from, to + 1);
                    count = filteredOrders.length;
                }
            }
        }

        // Transform the data to include volunteer_name and delivery_volunteer_name
        const transformedOrders = orders?.map(order => ({
            ...order,
            volunteer_name: order.volunteer?.name || null,
            delivery_volunteer_name: order.delivery_vol?.name || null,
            volunteer: undefined, // Remove the nested object
            delivery_vol: undefined, // Remove the nested object
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
