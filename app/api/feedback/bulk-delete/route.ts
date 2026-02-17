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

        const { feedbackIds } = await request.json();

        if (!feedbackIds || !Array.isArray(feedbackIds) || feedbackIds.length === 0) {
            return NextResponse.json({ error: "No feedback IDs provided" }, { status: 400 });
        }

        const { error, count } = await supabase
            .from("feedback")
            .delete()
            .in("id", feedbackIds);

        if (error) {
            console.error("Bulk feedback delete error:", error);
            return NextResponse.json({ error: "Failed to delete feedback" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Deleted ${count || feedbackIds.length} feedback item(s)`,
            deletedCount: count || feedbackIds.length,
        });
    } catch (error) {
        console.error("Bulk feedback delete error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
