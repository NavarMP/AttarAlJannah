import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

// POST - Create delivery request
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, volunteerId } = body;

        if (!orderId || !volunteerId) {
            return NextResponse.json(
                { error: "Order ID and Volunteer ID are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Look up volunteer UUID from volunteer_id string
        const { data: volunteer, error: volunteerError } = await supabase
            .from("volunteers")
            .select("id, name")
            .ilike("volunteer_id", volunteerId)
            .single();

        if (volunteerError || !volunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // Check order exists and is in 'ordered' status
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id, order_status, volunteer_id, is_delivery_duty, customer_name, quantity")
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        if (order.order_status !== "ordered") {
            return NextResponse.json(
                { error: "Only orders with 'ordered' status can have delivery requests" },
                { status: 400 }
            );
        }

        if (order.volunteer_id && order.is_delivery_duty) {
            return NextResponse.json(
                { error: "This order already has a delivery volunteer assigned" },
                { status: 400 }
            );
        }

        // Check for duplicate request
        const { data: existingRequest } = await supabase
            .from("delivery_requests")
            .select("id")
            .eq("order_id", orderId)
            .eq("volunteer_id", volunteer.id)
            .single();

        if (existingRequest) {
            return NextResponse.json(
                { error: "You have already requested delivery for this order" },
                { status: 400 }
            );
        }

        // Create delivery request
        const { data: deliveryRequest, error: createError } = await supabase
            .from("delivery_requests")
            .insert({
                order_id: orderId,
                volunteer_id: volunteer.id,
                status: "pending",
            })
            .select()
            .single();

        if (createError) {
            console.error("Error creating delivery request:", createError);
            return NextResponse.json(
                { error: "Failed to create delivery request" },
                { status: 500 }
            );
        }

        await logAuditEvent({
            actor: {
                id: volunteer.id,
                email: volunteerId,
                name: volunteer.name,
                role: "volunteer"
            },
            action: "create",
            entityType: "delivery_request",
            entityId: deliveryRequest.id,
            details: { order_id: orderId },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({
            success: true,
            deliveryRequest: {
                ...deliveryRequest,
                order: {
                    customer_name: order.customer_name,
                    quantity: order.quantity,
                },
            },
        });
    } catch (error) {
        console.error("Delivery request API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// GET - List volunteer's delivery requests
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const volunteerId = searchParams.get("volunteerId");
        const status = searchParams.get("status");

        if (!volunteerId) {
            return NextResponse.json(
                { error: "Volunteer ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Look up volunteer UUID
        const { data: volunteer, error: volunteerError } = await supabase
            .from("volunteers")
            .select("id")
            .ilike("volunteer_id", volunteerId)
            .single();

        if (volunteerError || !volunteer) {
            return NextResponse.json(
                { error: "Volunteer not found" },
                { status: 404 }
            );
        }

        // Build query
        let query = supabase
            .from("delivery_requests")
            .select(`
        *,
        order:orders(
          id,
          customer_name,
          customer_address,
          quantity,
          total_price,
          order_status
        )
      `)
            .eq("volunteer_id", volunteer.id)
            .order("requested_at", { ascending: false });

        if (status) {
            query = query.eq("status", status);
        }

        const { data: requests, error: requestsError } = await query;

        if (requestsError) {
            console.error("Error fetching delivery requests:", requestsError);
            return NextResponse.json(
                { error: "Failed to fetch delivery requests" },
                { status: 500 }
            );
        }

        return NextResponse.json({ requests: requests || [] });
    } catch (error) {
        console.error("Delivery request API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
