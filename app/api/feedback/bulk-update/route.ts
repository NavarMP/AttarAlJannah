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

        const { feedbackIds, status, priority } = await request.json();

        if (!feedbackIds || !Array.isArray(feedbackIds) || feedbackIds.length === 0) {
            return NextResponse.json({ error: "No feedback IDs provided" }, { status: 400 });
        }

        const updates: Record<string, string> = {};
        if (status && ["new", "in_progress", "resolved", "closed"].includes(status)) {
            updates.status = status;
        }
        if (priority && ["low", "medium", "high", "urgent"].includes(priority)) {
            updates.priority = priority;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
        }

        const { error } = await supabase
            .from("feedback")
            .update(updates)
            .in("id", feedbackIds);

        if (error) {
            console.error("Bulk feedback update error:", error);
            return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${feedbackIds.length} feedback item(s)`,
            updatedCount: feedbackIds.length,
        });
    } catch (error) {
        console.error("Bulk feedback update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
