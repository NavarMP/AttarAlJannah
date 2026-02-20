import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const orderId = searchParams.get("orderId");
        const phone = searchParams.get("phone");

        if (!orderId || !phone) {
            return NextResponse.json({ error: "Order ID and identifier required" }, { status: 400 });
        }

        const supabase = await createClient();

        // Check if caller is authenticated (admin or volunteer/customer)
        const { data: { user } } = await supabase.auth.getUser();

        // Try to determine if this is a volunteer ID or customer phone
        const { data: volunteer } = await supabase
            .from("volunteers")
            .select("id")
            .ilike("volunteer_id", phone)
            .is("deleted_at", null)
            .maybeSingle();

        let order;
        let fetchError;

        if (volunteer) {
            const result = await supabase
                .from("orders")
                .select("*")
                .eq("id", orderId)
                .eq("volunteer_id", volunteer.id)
                .is("deleted_at", null)
                .maybeSingle();

            order = result.data;
            fetchError = result.error;
        } else {
            const phoneVariations = [
                phone,
                phone.replace('+91', ''),
                phone.replace(/\D/g, '').slice(-10)
            ];

            const result = await supabase
                .from("orders")
                .select("*")
                .eq("id", orderId)
                .in("customer_phone", phoneVariations)
                .is("deleted_at", null)
                .maybeSingle();

            order = result.data;
            fetchError = result.error;
        }

        if (fetchError) {
            console.error("Order fetch error:", fetchError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        if (!order) {
            return NextResponse.json({ error: "Order not found or you don't have permission to delete it" }, { status: 404 });
        }

        if (order.order_status !== "ordered") {
            return NextResponse.json({
                error: `Cannot delete ${order.order_status} orders. Only 'ordered' orders can be deleted.`
            }, { status: 403 });
        }

        // Soft-delete the order
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error: deleteError } = await adminSupabase
            .from("orders")
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: user?.email || phone,
            })
            .eq("id", orderId);

        if (deleteError) {
            console.error("Soft-delete error:", deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        // Log audit event if performed by an admin
        if (user) {
            try {
                const { data: adminUser } = await adminSupabase
                    .from("admin_users")
                    .select("*")
                    .eq("email", user.email)
                    .single();

                if (adminUser) {
                    await logAuditEvent({
                        admin: adminUser,
                        action: "delete",
                        entityType: "order",
                        entityId: orderId,
                        details: {
                            customer_name: order.customer_name,
                            quantity: order.quantity,
                            total_price: order.total_price,
                        },
                        ipAddress: getClientIP(request),
                    });
                }
            } catch {
                // Non-admin deletion, skip audit
            }
        }

        return NextResponse.json({
            success: true,
            message: "Order moved to trash. Can be restored within 30 days.",
        });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
