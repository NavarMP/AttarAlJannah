/**
 * Courier Tracking Service
 * Integrates with TrackingMore API for automatic courier tracking.
 * Also provides manual tracking utilities.
 * 
 * Supported couriers: India Post, DTDC, Delhivery, BlueDart, Professional Couriers
 */

// Courier code mapping for TrackingMore API
export const COURIER_MAP: Record<string, { name: string; code: string; trackingUrl: (num: string) => string }> = {
    india_post: {
        name: "India Post",
        code: "india-post",
        trackingUrl: (num) => `https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?search=${num}`,
    },
    dtdc: {
        name: "DTDC",
        code: "dtdc",
        trackingUrl: (num) => `https://www.dtdc.in/tracking/tracking_results.asp?Ession_DocNo=${num}`,
    },
    delhivery: {
        name: "Delhivery",
        code: "delhivery",
        trackingUrl: (num) => `https://www.delhivery.com/track/package/${num}`,
    },
    bluedart: {
        name: "BlueDart",
        code: "bluedart",
        trackingUrl: (num) => `https://www.bluedart.com/tracking?tracknumbers=${num}`,
    },
    professional_couriers: {
        name: "Professional Couriers",
        code: "the-professional-couriers",
        trackingUrl: (num) => `https://www.tpcindia.com/track.aspx?id=${num}`,
    },
    other: {
        name: "Other",
        code: "other",
        trackingUrl: () => "",
    },
};

// Standard tracking statuses
export const TRACKING_STATUSES = [
    "order_placed",
    "payment_verified",
    "packed",
    "shipped",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "cant_reach",
    "returned",
    "cancelled",
] as const;

export type TrackingStatus = (typeof TRACKING_STATUSES)[number];

export interface TrackingEvent {
    id?: string;
    order_id: string;
    status: string;
    title: string;
    description?: string;
    updated_by?: string;
    location?: string;
    created_at?: string;
}

interface TrackingMoreCheckpoint {
    checkpoint_time: string;
    tracking_detail: string;
    location: string;
    checkpoint_delivery_status: string;
    checkpoint_delivery_substatus: string;
}

interface TrackingMoreResponse {
    meta: { code: number; message: string };
    data: {
        items: Array<{
            delivery_status: string;
            tracking_number: string;
            origin_info: {
                trackinfo: TrackingMoreCheckpoint[];
            };
        }>;
    };
}

/**
 * Map TrackingMore delivery substatus to our standard status
 */
function mapCourierStatus(substatus: string): string {
    const mapping: Record<string, string> = {
        // TrackingMore substatus → our status
        InfoReceived: "shipped",
        InTransit: "in_transit",
        OutForDelivery: "out_for_delivery",
        Delivered: "delivered",
        AvailableForPickup: "out_for_delivery",
        Exception: "cant_reach",
        AttemptFail: "cant_reach",
        Expired: "returned",
        Pending: "shipped",
    };
    return mapping[substatus] || "in_transit";
}

/**
 * Fetch tracking info from TrackingMore API
 */
export async function fetchCourierTracking(
    trackingNumber: string,
    courierCode: string
): Promise<TrackingEvent[]> {
    const apiKey = process.env.TRACKINGMORE_API_KEY;

    if (!apiKey) {
        console.warn("TRACKINGMORE_API_KEY not set, skipping courier tracking");
        return [];
    }

    const courierInfo = Object.values(COURIER_MAP).find(
        (c) => c.code === courierCode
    );
    if (!courierInfo) {
        console.warn(`Unknown courier code: ${courierCode}`);
        return [];
    }

    try {
        const response = await fetch(
            "https://api.trackingmore.com/v4/trackings/realtime",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Tracking-Api-Key": apiKey,
                },
                body: JSON.stringify({
                    tracking_number: trackingNumber,
                    courier_code: courierCode,
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("TrackingMore API error:", response.status, errorText);
            return [];
        }

        const result: TrackingMoreResponse = await response.json();

        if (result.meta.code !== 200 || !result.data?.items?.length) {
            console.warn("TrackingMore: No tracking data found");
            return [];
        }

        const item = result.data.items[0];
        const checkpoints = item.origin_info?.trackinfo || [];

        // Convert checkpoints to our tracking events
        return checkpoints.map((cp) => ({
            order_id: "", // Will be set by caller
            status: mapCourierStatus(cp.checkpoint_delivery_substatus),
            title: cp.tracking_detail,
            description: cp.tracking_detail,
            location: cp.location || undefined,
            updated_by: "courier_api",
            created_at: cp.checkpoint_time,
        }));
    } catch (error) {
        console.error("TrackingMore API error:", error);
        return [];
    }
}

/**
 * Generate tracking URL for a courier
 */
export function getTrackingUrl(
    courierName: string,
    trackingNumber: string
): string {
    const courier = COURIER_MAP[courierName];
    if (!courier) return "";
    return courier.trackingUrl(trackingNumber);
}

/**
 * Get human-readable courier name
 */
export function getCourierDisplayName(courierName: string): string {
    return COURIER_MAP[courierName]?.name || courierName;
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        order_placed: "Order Placed",
        payment_verified: "Payment Verified",
        packed: "Packed & Ready",
        shipped: "Shipped",
        in_transit: "In Transit",
        out_for_delivery: "Out for Delivery",
        delivered: "Delivered",
        cant_reach: "Delivery Attempted",
        returned: "Returned",
        cancelled: "Cancelled",
        volunteer_assigned: "Delivery Volunteer Assigned",
        picked_up: "Picked Up by Volunteer",
        on_the_way: "On the Way",
        arrived_at_area: "Arrived at Your Area",
        method_assigned: "Delivery Method Assigned",
        tracking_added: "Tracking Number Added",
        ready_for_pickup: "Ready for Pickup",
    };
    return labels[status] || status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
