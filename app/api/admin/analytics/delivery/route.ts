import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Get delivery analytics
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        if (!start || !end) {
            return NextResponse.json(
                { error: "Start and end dates are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const startDate = new Date(start);
        const endDate = new Date(end);

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
            .eq("order_status", "confirmed");

        // Get completed deliveries in period
        const { data: completedOrders } = await supabase
            .from("orders")
            .select("*")
            .eq("is_delivery_duty", true)
            .eq("order_status", "delivered")
            .gte("updated_at", startDate.toISOString())
            .lte("updated_at", endDate.toISOString());

        const completedDeliveries = completedOrders?.length || 0;

        // Calculate average delivery time (hours between order and delivery)
        let avgDeliveryTime = 0;
        if (completedOrders && completedOrders.length > 0) {
            const totalTime = completedOrders.reduce((sum, order) => {
                const orderDate = new Date(order.created_at);
                const deliveryDate = new Date(order.updated_at);
                const hours = (deliveryDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
                return sum + hours;
            }, 0);
            avgDeliveryTime = Math.round(totalTime / completedOrders.length);
        }

        // Get all delivery orders for timeline
        const { data: allDeliveryOrders } = await supabase
            .from("orders")
            .select("created_at, order_status, zone_id, zones(zone_name)")
            .eq("is_delivery_duty", true)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())
            .order("created_at", { ascending: true });

        // Group by date for timeline
        const timelineMap: { [key: string]: { date: string; completedCount: number; successRate: number; totalOrders: number } } = {};
        allDeliveryOrders?.forEach(order => {
            const date = new Date(order.created_at).toISOString().split('T')[0];
            if (!timelineMap[date]) {
                timelineMap[date] = { date, completedCount: 0, successRate: 0, totalOrders: 0 };
            }
            timelineMap[date].totalOrders++;
            if (order.order_status === 'delivered') {
                timelineMap[date].completedCount++;
            }
        });

        // Calculate success rate for each day
        const timeline = Object.values(timelineMap).map(day => ({
            ...day,
            successRate: day.totalOrders > 0 ? Math.round((day.completedCount / day.totalOrders) * 100) : 0
        }));

        // Group deliveries by zone
        const zoneMap: { [key: string]: { zoneName: string; deliveries: number; completed: number } } = {};
        allDeliveryOrders?.forEach(order => {
            const zoneName = (order.zones as any)?.zone_name || 'Unknown';
            if (!zoneMap[zoneName]) {
                zoneMap[zoneName] = { zoneName, deliveries: 0, completed: 0 };
            }
            zoneMap[zoneName].deliveries++;
            if (order.order_status === 'delivered') {
                zoneMap[zoneName].completed++;
            }
        });

        const byZone = Object.values(zoneMap).map(zone => ({
            ...zone,
            successRate: zone.deliveries > 0 ? Math.round((zone.completed / zone.deliveries) * 100) : 0
        }));

        // Get top delivery volunteers
        const { data: volunteerOrders } = await supabase
            .from("orders")
            .select("volunteer_id, volunteers!orders_volunteer_id_fkey(name, volunteer_id), created_at, updated_at")
            .eq("is_delivery_duty", true)
            .eq("order_status", "delivered")
            .gte("updated_at", startDate.toISOString())
            .lte("updated_at", endDate.toISOString());

        // Count deliveries and calculate avg time per volunteer
        const volunteerStats: { [key: string]: any } = {};
        volunteerOrders?.forEach(order => {
            const vid = order.volunteer_id;
            if (!vid) return;
            if (!volunteerStats[vid]) {
                volunteerStats[vid] = {
                    name: (order.volunteers as any)?.name || 'Unknown',
                    id: vid,
                    deliveries: 0,
                    totalTime: 0
                };
            }
            volunteerStats[vid].deliveries++;

            const orderDate = new Date(order.created_at);
            const deliveryDate = new Date(order.updated_at);
            const hours = (deliveryDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
            volunteerStats[vid].totalTime += hours;
        });

        const topVolunteers = Object.values(volunteerStats)
            .map((v: any) => ({
                name: v.name,
                id: v.id,
                deliveries: v.deliveries,
                avgTime: Math.round(v.totalTime / v.deliveries)
            }))
            .sort((a: any, b: any) => b.deliveries - a.deliveries)
            .slice(0, 10);

        // Calculate overall success rate
        const totalScheduled = allDeliveryOrders?.length || 0;
        const successRate = totalScheduled > 0
            ? Math.round((completedDeliveries / totalScheduled) * 100)
            : 0;

        return NextResponse.json({
            metrics: {
                pendingRequests: pendingRequests || 0,
                activeDeliveries: activeDeliveries || 0,
                completedDeliveries,
                avgDeliveryTime,
                successRate
            },
            timeline,
            byZone,
            topVolunteers
        });
    } catch (error) {
        console.error("Delivery analytics API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch delivery analytics" },
            { status: 500 }
        );
    }
}
