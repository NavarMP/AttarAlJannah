import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reassignDeliveryVolunteer } from "@/lib/services/volunteer-assignment";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const supabase = await createClient();
        const body = await request.json();
        const { volunteerId } = body;

        // Verify user is admin
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: volunteer, error: volError } = await supabase
            .from("volunteers")
            .select("role")
            .eq("auth_id", user.id)
            .single();

        if (volError || volunteer?.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        // Reassign the order
        const result = await reassignDeliveryVolunteer(params.id, volunteerId || null);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to reassign volunteer" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: volunteerId ? "Volunteer assigned successfully" : "Volunteer removed successfully"
        });

    } catch (error: any) {
        console.error("Error reassigning volunteer:", error);
        return NextResponse.json(
            { error: "Failed to reassign volunteer" },
            { status: 500 }
        );
    }
}
