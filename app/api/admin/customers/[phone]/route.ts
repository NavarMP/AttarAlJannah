import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ phone: string }> }) {
    try {
        const { phone } = await params;
        const supabase = await createClient();

        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: customer, error: customerError } = await supabase
            .from("customers")
            .select("*")
            .eq("phone", phone)
            .is("deleted_at", null)
            .single();

        if (customerError || !customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        const { data: orders, error: ordersError } = await supabase
            .from("orders")
            .select(`
                id,
                customer_name,
                customer_phone,
                customer_address,
                whatsapp_number,
                quantity,
                total_price,
                payment_method,
                payment_status,
                order_status,
                delivery_method,
                volunteer_id,
                delivery_volunteer_id,
                is_delivery_duty,
                created_at,
                cash_received,
                volunteers:volunteer_id(name),
                delivery_volunteers:delivery_volunteer_id(name)
            `)
            .eq("customer_phone", phone)
            .is("deleted_at", null)
            .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;

        const totalOrders = orders?.length || 0;
        const totalBottles = orders?.reduce((sum, o) => sum + (o.quantity || 0), 0) || 0;
        const totalSpent = orders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;

        const returnCustomer = {
            id: customer.id,
            phone: customer.phone,
            name: customer.name,
            email: customer.email,
            whatsapp_number: customer.whatsapp_number,
            address: customer.address,
            created_at: customer.created_at,
            is_registered: true,
            total_orders: totalOrders,
            total_bottles: totalBottles,
            total_spent: totalSpent,
            orders: orders?.map(o => ({
                id: o.id,
                customer_name: o.customer_name,
                customer_phone: o.customer_phone,
                whatsapp_number: o.whatsapp_number,
                quantity: o.quantity,
                total_price: o.total_price,
                payment_method: o.payment_method,
                payment_status: o.payment_status,
                order_status: o.order_status,
                delivery_method: o.delivery_method,
                referred_volunteer_id: o.is_delivery_duty === false ? o.volunteer_id : null,
                referred_volunteer_name: o.is_delivery_duty === false ? (o.volunteers as any)?.name : null,
                delivery_volunteer_id: o.is_delivery_duty === true ? o.delivery_volunteer_id : null,
                delivery_volunteer_name: o.is_delivery_duty === true ? (o.delivery_volunteers as any)?.name : null,
                cash_received: o.cash_received,
                created_at: o.created_at,
            })) || [],
        };

        return NextResponse.json({ customer: returnCustomer });
    } catch (error) {
        console.error("Error fetching customer:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ phone: string }> }) {
    try {
        const { phone } = await params;
        const supabase = await createClient();

        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, address } = body;

        const { data: customer } = await supabase
            .from("customers")
            .select("id")
            .eq("phone", phone)
            .is("deleted_at", null)
            .single();

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        await supabase
            .from("customers")
            .update({
                name: name || null,
                email: email || null,
                address: address || null,
            })
            .eq("id", customer.id);

        if (name || address) {
            await supabase
                .from("orders")
                .update({
                    customer_name: name,
                    customer_address: address,
                })
                .eq("customer_phone", phone)
                .is("deleted_at", null);
        }

        return NextResponse.json({ success: true, message: "Customer updated successfully" });
    } catch (error) {
        console.error("Error updating customer:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ phone: string }> }) {
    try {
        const { phone } = await params;
        const supabase = await createClient();

        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: customer } = await supabase
            .from("customers")
            .select("id, name")
            .eq("phone", phone)
            .is("deleted_at", null)
            .single();

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        await supabase
            .from("customers")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", customer.id);

        return NextResponse.json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
        console.error("Error deleting customer:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
