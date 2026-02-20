import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";
import { getTrackingUrl } from "@/lib/services/courier-tracking";

// GET - Fetch tracking events for an order
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin("viewer");
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch tracking events
        const { data: events, error: eventsError } = await supabase
            .from("delivery_tracking_events")
            .select("*")
            .eq("order_id", id)
            .order("created_at", { ascending: true });

        if (eventsError) {
            return NextResponse.json({ error: eventsError.message }, { status: 500 });
        }

        // Fetch order courier info
        const { data: order } = await supabase
            .from("orders")
            .select("tracking_number, courier_name, tracking_url, delivery_method, last_tracking_sync")
            .eq("id", id)
            .single();

        return NextResponse.json({
            events: events || [],
            courierInfo: order
                ? {
                    tracking_number: order.tracking_number,
                    courier_name: order.courier_name,
                    tracking_url: order.tracking_url,
                    delivery_method: order.delivery_method,
                    last_tracking_sync: order.last_tracking_sync,
                }
                : null,
        });
    } catch (error) {
        console.error("Tracking fetch error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST - Add a manual tracking event
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const { status, title, description, location } = await request.json();

        if (!status || !title) {
            return NextResponse.json(
                { error: "Status and title are required" },
                { status: 400 }
            );
        }

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
            .from("delivery_tracking_events")
            .insert({
                order_id: id,
                status,
                title,
                description: description || null,
                location: location || null,
                updated_by: auth.admin.name || auth.admin.email,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logAuditEvent({
            admin: auth.admin,
            action: "create",
            entityType: "tracking_event",
            entityId: id,
            details: { status, title },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ event: data }, { status: 201 });
    } catch (error) {
        console.error("Tracking event create error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// PUT - Update tracking number & courier info on the order
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const { tracking_number, courier_name } = await request.json();

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Generate tracking URL
        const tracking_url = tracking_number && courier_name
            ? getTrackingUrl(courier_name, tracking_number)
            : null;

        const updateData: Record<string, unknown> = {};
        if (tracking_number !== undefined) updateData.tracking_number = tracking_number;
        if (courier_name !== undefined) updateData.courier_name = courier_name;
        if (tracking_url !== undefined) updateData.tracking_url = tracking_url;

        const { error } = await supabase
            .from("orders")
            .update(updateData)
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Auto-insert a tracking event for the tracking number being added
        if (tracking_number) {
            await supabase.from("delivery_tracking_events").insert({
                order_id: id,
                status: "tracking_added",
                title: "Tracking Number Added",
                description: `Tracking: ${tracking_number} via ${courier_name || "courier"}`,
                updated_by: auth.admin.name || auth.admin.email,
            });
        }

        await logAuditEvent({
            admin: auth.admin,
            action: "update",
            entityType: "order",
            entityId: id,
            details: { tracking_number, courier_name },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ success: true, tracking_url });
    } catch (error) {
        console.error("Tracking info update error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
