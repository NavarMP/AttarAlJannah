import { createClient } from "@/lib/supabase/server";

export interface OrderAddress {
    houseBuilding: string;
    town: string;
    post: string;
}

export interface Volunteer {
    id: string;
    name: string;
    volunteer_id: string;
    phone: string;
    house_building: string;
    town: string;
    post: string;
}

export interface AssignmentResult {
    assigned: boolean;
    volunteerId?: string;
    volunteerName?: string;
    matchCount: number;
    matches?: Volunteer[];
}

/**
 * Find volunteers whose address matches the order address
 * Matching criteria: house_building, town, AND post must all match (case-insensitive)
 */
export async function findMatchingVolunteers(orderAddress: OrderAddress): Promise<Volunteer[]> {
    const supabase = await createClient();

    // If any required field is missing, return no matches
    if (!orderAddress.houseBuilding || !orderAddress.town || !orderAddress.post) {
        return [];
    }

    // Query volunteers with matching address fields (case-insensitive)
    const { data: volunteers, error } = await supabase
        .from("volunteers")
        .select("id, name, volunteer_id, phone, house_building, town, post")
        .ilike("house_building", orderAddress.houseBuilding)
        .ilike("town", orderAddress.town)
        .ilike("post", orderAddress.post)
        .not("house_building", "is", null)
        .not("town", "is", null)
        .not("post", "is", null)
        .eq("status", "active"); // Only match active volunteers

    if (error) {
        console.error("Error finding matching volunteers:", error);
        return [];
    }

    return volunteers || [];
}

/**
 * Automatically assign a delivery volunteer to an order based on address matching
 * 
 * Logic:
 * - If exactly 1 match: auto-assign
 * - If multiple matches: return matches for admin to choose
 * - If no matches: return unassigned
 * 
 * @param orderId - The order ID to assign a volunteer to
 * @param orderAddress - The order's delivery address
 * @returns AssignmentResult with assignment status and match info
 */
export async function autoAssignDeliveryVolunteer(
    orderId: string,
    orderAddress: OrderAddress
): Promise<AssignmentResult> {
    const supabase = await createClient();

    try {
        // Find matching volunteers
        const matches = await findMatchingVolunteers(orderAddress);

        // No matches found
        if (matches.length === 0) {
            return {
                assigned: false,
                matchCount: 0,
            };
        }

        // Exactly one match - auto-assign
        if (matches.length === 1) {
            const volunteer = matches[0];

            const { error: updateError } = await supabase
                .from("orders")
                .update({
                    delivery_volunteer_id: volunteer.id,
                    delivery_status: "assigned"
                })
                .eq("id", orderId);

            if (updateError) {
                console.error("Error auto-assigning volunteer:", updateError);
                return {
                    assigned: false,
                    matchCount: 1,
                    matches,
                };
            }

            console.log(`✅ Auto-assigned order ${orderId} to volunteer ${volunteer.name}`);

            return {
                assigned: true,
                volunteerId: volunteer.id,
                volunteerName: volunteer.name,
                matchCount: 1,
            };
        }

        // Multiple matches - return for admin review
        console.log(`⚠️ Order ${orderId} has ${matches.length} matching volunteers - admin review needed`);
        return {
            assigned: false,
            matchCount: matches.length,
            matches,
        };

    } catch (error) {
        console.error("Error in auto-assignment logic:", error);
        return {
            assigned: false,
            matchCount: 0,
        };
    }
}

/**
 * Manually reassign an order to a different delivery volunteer (admin action)
 */
export async function reassignDeliveryVolunteer(
    orderId: string,
    newVolunteerId: string | null
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("orders")
        .update({
            delivery_volunteer_id: newVolunteerId,
            delivery_status: newVolunteerId ? "assigned" : "pending"
        })
        .eq("id", orderId);

    if (error) {
        console.error("Error reassigning volunteer:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}
