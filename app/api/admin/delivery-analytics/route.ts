import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Get delivery analytics
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "30"; // days

        const supabase = await createClient();

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Call analytics function
        const { data: analytics, error } = await supabase
            .rpc("get_delivery_analytics", {
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            })
            .single();

        if (error) {
            console.error("Analytics fetch error:", error);
            throw error;
        }

        // Get pending delivery requests count
        const { count: pendingRequests } = await supabase
            .from("delivery_requests")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending");

        // Get active deliveries (assigned but not delivered)
        const { count: activeDeliveries } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("is_delivery_duty", true)
            .eq("order_status", "ordered");

        // Get top delivery volunteers (last 30 days)
        const { data: topVolunteers } = await supabase
            .from("orders")
            .select("volunteer_id, volunteers!orders_volunteer_id_fkey(name, volunteer_id)")
            .eq("is_delivery_duty", true)
            .eq("order_status", "delivered")
            .gte("updated_at", startDate.toISOString())
            .limit(10);

        // Count deliveries per volunteer
        const volunteerCounts: { [key: string]: any } = {};
        topVolunteers?.forEach(order => {
            const vid = order.volunteer_id;
            if (!vid) return;
            if (!volunteerCounts[vid]) {
                volunteerCounts[vid] = {
                    volunteer: order.volunteers,
                    count: 0
                };
            }
            volunteerCounts[vid].count++;
        });

        const topDeliveryVolunteers = Object.values(volunteerCounts)
            .sort((a: any, b: any) => b.count - a.count)
            .slice(0, 5);

        return NextResponse.json({
            analytics: {
                ...(analytics || {}),
                pending_requests: pendingRequests || 0,
                active_deliveries: activeDeliveries || 0,
                period_days: parseInt(period)
            },
            top_volunteers: topDeliveryVolunteers
        });
    } catch (error) {
        console.error("Delivery analytics API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch delivery analytics" },
            { status: 500 }
        );
    }
}
