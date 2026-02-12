import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
            .select("quantity, total_price, status")
            .eq("volunteer_id", volunteer.id);

        const confirmedOrders = orders?.filter(o => o.status === "delivered") || [];
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

        // Update volunteer profile (excluding goal and profile_photo)
        const { data: updatedVolunteer, error: updateError } = await supabase
            .from("volunteers")
            .update({
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
            })
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
