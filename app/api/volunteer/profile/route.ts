import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated volunteer
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized - please log in" },
                { status: 401 }
            );
        }

        // Fetch volunteer profile
        const { data: volunteer, error: volunteerError } = await supabase
            .from("volunteers")
            .select("*")
            .eq("auth_id", user.id)
            .single();

        if (volunteerError || !volunteer) {
            return NextResponse.json(
                { error: "Volunteer profile not found" },
                { status: 404 }
            );
        }

        // Calculate performance metrics
        const { data: orders } = await supabase
            .from("orders")
            .select("quantity, total_price, order_status")
            .eq("volunteer_id", volunteer.id);

        const confirmedOrders = orders?.filter(o => o.order_status === "confirmed" || o.order_status === "delivered") || [];
        const totalBottles = confirmedOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);
        const totalRevenue = confirmedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);

        // Calculate commission (20% of revenue)
        const commission = totalRevenue * 0.20;

        // Get goal from challenge_progress
        const { data: challengeProgress } = await supabase
            .from("challenge_progress")
            .select("goal")
            .eq("volunteer_id", volunteer.id)
            .single();

        const goal = challengeProgress?.goal || 20;
        const goalProgress = goal > 0 ? Math.round((totalBottles / goal) * 100) : 0;

        return NextResponse.json({
            volunteer: {
                id: volunteer.id,
                volunteer_id: volunteer.volunteer_id,
                name: volunteer.name,
                email: volunteer.email,
                phone: volunteer.phone,
                profile_photo: volunteer.profile_photo,
                status: volunteer.status,
                created_at: volunteer.created_at,
                // Address fields
                house_building: volunteer.house_building,
                town: volunteer.town,
                pincode: volunteer.pincode,
                post: volunteer.post,
                city: volunteer.city,
                district: volunteer.district,
                state: volunteer.state,
                location_link: volunteer.location_link,
            },
            stats: {
                totalBottles,
                goal,
                goalProgress,
                commission,
                totalOrders: orders?.length || 0,
                deliveredOrders: confirmedOrders.length,
            }
        });

    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated volunteer
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            name,
            email,
            phone,
            volunteer_id,
            // Address fields
            house_building,
            town,
            pincode,
            post,
            city,
            district,
            state,
            location_link,
        } = body;

        // If volunteer_id is being changed, check uniqueness
        if (volunteer_id) {
            const { data: currentVol } = await supabase
                .from("volunteers")
                .select("volunteer_id")
                .eq("auth_id", user.id)
                .single();

            if (currentVol && volunteer_id !== currentVol.volunteer_id) {
                const { data: existing } = await supabase
                    .from("volunteers")
                    .select("id")
                    .ilike("volunteer_id", volunteer_id)
                    .neq("auth_id", user.id)
                    .maybeSingle();

                if (existing) {
                    return NextResponse.json(
                        { error: "This volunteer ID is already in use" },
                        { status: 409 }
                    );
                }
            }
        }

        // Build update payload
        const updatePayload: Record<string, any> = {
            name,
            email: email || null,
            phone,
            house_building: house_building || null,
            town: town || null,
            pincode: pincode || null,
            post: post || null,
            city: city || null,
            district: district || null,
            state: state || null,
            location_link: location_link || null,
        };

        if (volunteer_id) {
            updatePayload.volunteer_id = volunteer_id;
        }

        // Update volunteer profile (excluding goal and profile_photo)
        const { data: updatedVolunteer, error: updateError } = await supabase
            .from("volunteers")
            .update(updatePayload)
            .eq("auth_id", user.id)
            .select()
            .single();

        if (updateError) {
            console.error("Update error:", updateError);
            return NextResponse.json(
                { error: "Failed to update profile" },
                { status: 500 }
            );
        }

        await logAuditEvent({
            actor: {
                id: user.id,
                email: user.email || updatedVolunteer.email,
                name: updatedVolunteer.name,
                role: "volunteer"
            },
            action: "update",
            entityType: "volunteer_profile",
            entityId: updatedVolunteer.id,
            details: { changes: Object.keys(body) },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({
            success: true,
            volunteer: updatedVolunteer,
        });

    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
