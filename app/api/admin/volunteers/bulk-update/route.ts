import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Verify admin
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { volunteerIds, status, goal } = await request.json();

        if (!volunteerIds || !Array.isArray(volunteerIds) || volunteerIds.length === 0) {
            return NextResponse.json({ error: "No volunteer IDs provided" }, { status: 400 });
        }

        let updatedCount = 0;

        // Update status if provided
        if (status && ["active", "suspended"].includes(status)) {
            const { error } = await supabase
                .from("volunteers")
                .update({ status })
                .in("id", volunteerIds);

            if (error) {
                console.error("Bulk status update error:", error);
                return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
            }
            updatedCount = volunteerIds.length;
        }

        // Update goal if provided
        if (goal && typeof goal === "number" && goal > 0) {
            // Update goal in challenge_progress table
            for (const volunteerId of volunteerIds) {
                const { error } = await supabase
                    .from("challenge_progress")
                    .upsert({
                        volunteer_id: volunteerId,
                        target: goal,
                    }, { onConflict: "volunteer_id" });

                if (error) {
                    console.error(`Goal update error for ${volunteerId}:`, error);
                }
            }
            updatedCount = volunteerIds.length;
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${updatedCount} volunteer(s)`,
            updatedCount,
        });
    } catch (error) {
        console.error("Bulk volunteer update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
