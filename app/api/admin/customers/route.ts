import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search")?.toLowerCase() || "";

        // 1. Fetch all customers from customers table to also keep track of deleted ones
        const { data: allCustomersData, error: customersError } = await supabase
            .from("customers")
            .select("*")
            .order("created_at", { ascending: false });

        if (customersError) throw customersError;

        // 2. Fetch all orders to calculate stats and get details
        const { data: orders, error: ordersError } = await supabase
            .from("orders")
            .select("id, customer_phone, customer_name, whatsapp_number, quantity, created_at, order_status, delivery_method, payment_method, volunteer_id, is_delivery_duty, zone_id")
            .is("deleted_at", null);

        if (ordersError) throw ordersError;

        // Fetch volunteers for volunteer info
        const { data: volunteersData } = await supabase
            .from("volunteers")
            .select("id, name");

        const volunteerMap = new Map<string, string>();
        volunteersData?.forEach(v => volunteerMap.set(v.id, v.name));

        // 3. Aggregate stats and Find Guest Customers
        // Split customers into active and deleted
        const customers = allCustomersData?.filter(c => !c.deleted_at) || [];
        const deletedPhoneSet = new Set((allCustomersData || []).filter(c => c.deleted_at).map(c => c.phone));

        // Create a map of existing active customers by phone for easy lookup
        const customerMap = new Map();
        customers.forEach(c => customerMap.set(c.phone, c));

        // Group orders by phone
        const ordersByPhone = new Map<string, any[]>();
        orders?.forEach((o: any) => {
            if (!o.customer_phone) return;
            const phone = o.customer_phone;
            if (!ordersByPhone.has(phone)) {
                ordersByPhone.set(phone, []);
            }
            ordersByPhone.get(phone)?.push(o);
        });

        const allCustomers: any[] = [];

        // A. Process Registered Customers
        if (customers) {
            for (const customer of customers) {
                const userOrders = ordersByPhone.get(customer.phone) || [];

                // Calculate stats
                // Trust the total_orders in table or recalculate?
                // Table might be more efficient if triggered update.
                // But recalculating ensures consistency with current orders fetch.
                const totalOrders = userOrders.length;
                const lastOrder = userOrders.length > 0
                    ? userOrders.reduce((latest, current) =>
                        new Date(current.created_at) > new Date(latest) ? current.created_at : latest
                        , userOrders[0].created_at)
                    : customer.last_order_at;

                // Get email from customer profile and WhatsApp from orders
                const sortedOrders = [...userOrders].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                const email = customer.email || null;
                const whatsapp_number = sortedOrders.find(o => o.whatsapp_number)?.whatsapp_number || null;
                const totalBottles = userOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);

                const orderStatuses = [...new Set(userOrders.map(o => o.order_status))];
                const deliveryMethods = [...new Set(userOrders.map(o => o.delivery_method).filter(Boolean))];
                const paymentMethods = [...new Set(userOrders.map(o => o.payment_method).filter(Boolean))];
                const referredVolunteers = [...new Set(userOrders.map(o => o.is_delivery_duty === false ? o.volunteer_id : null).filter(Boolean))];
                const deliveryVolunteers = [...new Set(userOrders.map(o => o.is_delivery_duty === true ? o.volunteer_id : null).filter(Boolean))];
                const zoneIds = [...new Set(userOrders.map(o => o.zone_id).filter(Boolean))];

                allCustomers.push({
                    id: customer.id,
                    phone: customer.phone,
                    name: customer.name,
                    email: email,
                    address: customer.address,
                    whatsapp_number,
                    total_orders: totalOrders,
                    total_bottles: totalBottles,
                    last_order_at: lastOrder,
                    created_at: customer.created_at,
                    order_statuses: orderStatuses,
                    delivery_methods: deliveryMethods,
                    payment_methods: paymentMethods,
                    referred_volunteers: referredVolunteers,
                    delivery_volunteers: deliveryVolunteers,
                    zone_ids: zoneIds,
                });
            }
        }

        // B. Process Guest Customers (in Orders but not in Users)
        for (const [phone, userOrders] of ordersByPhone.entries()) {
            if (!customerMap.has(phone) && !deletedPhoneSet.has(phone)) {
                // This is a guest
                const totalOrders = userOrders.length;
                const totalBottles = userOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);
                // Get latest order for details
                const sortedOrders = [...userOrders].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                const latestOrder = sortedOrders[0];

                const orderStatuses = [...new Set(userOrders.map(o => o.order_status))];
                const deliveryMethods = [...new Set(userOrders.map(o => o.delivery_method).filter(Boolean))];
                const paymentMethods = [...new Set(userOrders.map(o => o.payment_method).filter(Boolean))];
                const referredVolunteers = [...new Set(userOrders.map(o => o.is_delivery_duty === false ? o.volunteer_id : null).filter(Boolean))];
                const deliveryVolunteers = [...new Set(userOrders.map(o => o.is_delivery_duty === true ? o.volunteer_id : null).filter(Boolean))];
                const zoneIds = [...new Set(userOrders.map(o => o.zone_id).filter(Boolean))];

                allCustomers.push({
                    id: `guest-${phone}`, // Generate simple ID
                    phone: phone,
                    name: latestOrder.customer_name || "Guest Customer",
                    email: null,
                    whatsapp_number: latestOrder.whatsapp_number || null,
                    total_orders: totalOrders,
                    total_bottles: totalBottles,
                    last_order_at: latestOrder.created_at,
                    created_at: sortedOrders[sortedOrders.length - 1].created_at,
                    order_statuses: orderStatuses,
                    delivery_methods: deliveryMethods,
                    payment_methods: paymentMethods,
                    referred_volunteers: referredVolunteers,
                    delivery_volunteers: deliveryVolunteers,
                    zone_ids: zoneIds,
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
