import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search")?.toLowerCase() || "";

        // 1. Fetch all customers from users table
        const { data: users, error: usersError } = await supabase
            .from("users")
            .select("*")
            .eq("user_role", "customer")
            .order("created_at", { ascending: false });

        if (usersError) throw usersError;

        // 2. Fetch all orders to calculate stats and get details
        const { data: orders, error: ordersError } = await supabase
            .from("orders")
            .select("customer_phone, customer_email, customer_name, created_at");

        if (ordersError) throw ordersError;

        // 3. Aggregate stats and Find Guest Customers
        // Create a map of existing users by phone for easy lookup
        const userMap = new Map();
        users?.forEach(u => userMap.set(u.phone, u));

        // Group orders by phone
        const ordersByPhone = new Map<string, any[]>();
        orders?.forEach(o => {
            const phone = o.customer_phone;
            if (!ordersByPhone.has(phone)) {
                ordersByPhone.set(phone, []);
            }
            ordersByPhone.get(phone)?.push(o);
        });

        const allCustomers: any[] = [];

        // A. Process Registered Users
        if (users) {
            for (const user of users) {
                const userOrders = ordersByPhone.get(user.phone) || [];

                // Calculate stats
                const totalOrders = userOrders.length;
                const lastOrder = userOrders.length > 0
                    ? userOrders.reduce((latest, current) =>
                        new Date(current.created_at) > new Date(latest) ? current.created_at : latest
                        , userOrders[0].created_at)
                    : null;

                // Get email from latest order
                const sortedOrders = [...userOrders].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                const email = sortedOrders.find(o => o.customer_email)?.customer_email || null;

                allCustomers.push({
                    id: user.id,
                    phone: user.phone,
                    name: user.name,
                    email: email,
                    total_orders: totalOrders,
                    last_order_at: lastOrder,
                    created_at: user.created_at
                });
            }
        }

        // B. Process Guest Customers (in Orders but not in Users)
        for (const [phone, userOrders] of ordersByPhone.entries()) {
            if (!userMap.has(phone)) {
                // This is a guest
                const totalOrders = userOrders.length;
                // Get latest order for details
                const sortedOrders = [...userOrders].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                const latestOrder = sortedOrders[0];

                allCustomers.push({
                    id: `guest-${phone}`, // Generate simple ID
                    phone: phone,
                    name: latestOrder.customer_name || "Guest Customer",
                    email: latestOrder.customer_email || null,
                    total_orders: totalOrders,
                    last_order_at: latestOrder.created_at,
                    created_at: sortedOrders[sortedOrders.length - 1].created_at // Use first order date as created_at
                });
            }
        }

        // Sort by created_at desc
        allCustomers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // 4. Filter by search
        const filteredCustomers = allCustomers.filter(c =>
            !search ||
            (c.name?.toLowerCase().includes(search)) ||
            (c.phone?.includes(search)) ||
            (c.email?.toLowerCase().includes(search))
        );

        return NextResponse.json({ customers: filteredCustomers });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
