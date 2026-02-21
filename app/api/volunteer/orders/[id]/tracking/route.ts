import { NextRequest, NextResponse } from "next/server";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

// POST - Volunteer adds a delivery tracking update
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;
        const { volunteerId, status, title, description, location } = await request.json();

        if (!volunteerId || !status || !title) {
            return NextResponse.json(
                { error: "volunteerId, status, and title are required" },
                { status: 400 }
            );
        }

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verify the volunteer is the assigned delivery volunteer
        const { data: volunteer } = await supabase
            .from("volunteers")
            .select("id, name")
            .eq("volunteer_id", volunteerId)
            .single();

        if (!volunteer) {
            return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
        }

        const { data: order } = await supabase
            .from("orders")
            .select("delivery_volunteer_id, is_delivery_duty")
            .eq("id", orderId)
            .single();

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Check if this volunteer is the assigned delivery volunteer
        if (order.delivery_volunteer_id !== volunteer.id) {
            return NextResponse.json(
                { error: "You are not assigned to deliver this order" },
                { status: 403 }
            );
        }

        // Insert tracking event
        const { data, error } = await supabase
            .from("delivery_tracking_events")
            .insert({
                order_id: orderId,
                status,
                title,
                description: description || null,
                location: location || null,
                updated_by: volunteer.name,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logAuditEvent({
            actor: {
                id: volunteer.id,
                email: volunteerId,
                name: volunteer.name,
                role: "volunteer"
            },
            action: "create",
            entityType: "tracking_event",
            entityId: data.id,
            details: { order_id: orderId, status, title },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ event: data }, { status: 201 });
    } catch (error) {
        console.error("Volunteer tracking update error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// GET - Get tracking events for an order (volunteer view)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;
        const volunteerId = request.nextUrl.searchParams.get("volunteerId");

        if (!volunteerId) {
            return NextResponse.json({ error: "volunteerId required" }, { status: 400 });
        }

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: events, error } = await supabase
            .from("delivery_tracking_events")
            .select("*")
            .eq("order_id", orderId)
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ events: events || [] });
    } catch (error) {
        console.error("Volunteer tracking fetch error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
