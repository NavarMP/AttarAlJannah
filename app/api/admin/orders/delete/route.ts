import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json(
                { error: "Order ID is required" },
                { status: 400 }
            );
        }

        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if order exists
        const { data: order, error: fetchError } = await adminSupabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

        if (fetchError || !order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Soft delete the order (admin can delete any order regardless of status)
        const { error: deleteError } = await adminSupabase
            .from("orders")
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: auth.admin.email,
            })
            .eq("id", orderId);

        if (deleteError) {
            console.error("Delete error:", deleteError);
            return NextResponse.json(
                { error: "Failed to delete order" },
                { status: 500 }
            );
        }

        // Clean up the customer record if this was their last active order
        if (order.customer_id) {
            const { count: remainingOrders, error: countError } = await adminSupabase
                .from("orders")
                .select("*", { count: "exact", head: true })
                .eq("customer_id", order.customer_id)
                .is("deleted_at", null);

            if (!countError && remainingOrders === 0) {
                console.log(`🧹 Cascading soft-delete to customer: ${order.customer_id}`);
                await adminSupabase
                    .from("customers")
                    .update({
                        deleted_at: new Date().toISOString(),
                        deleted_by: auth.admin.email,
                    })
                    .eq("id", order.customer_id);
            }
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "delete",
            entityType: "order",
            entityId: orderId,
            details: {
                customer_name: order.customer_name,
                quantity: order.quantity,
                total_price: order.total_price
            },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json(
            { message: "Order moved to trash successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting order:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
