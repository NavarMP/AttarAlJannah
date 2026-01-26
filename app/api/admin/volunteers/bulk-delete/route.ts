import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify admin authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const { data: adminUser } = await supabase
            .from("users")
            .select("user_role")
            .eq("id", user.id)
            .single();

        if (!adminUser || adminUser.user_role !== "admin") {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        const { volunteerIds } = await request.json();

        if (!Array.isArray(volunteerIds) || volunteerIds.length === 0) {
            return NextResponse.json({ error: "No volunteer IDs provided" }, { status: 400 });
        }

        // Delete volunteers from database
        // Note: Due to ON DELETE CASCADE on challenge_progress, 
        // their challenge progress will be automatically deleted
        // Orders will have referred_by set to NULL (ON DELETE SET NULL)
        const { data, error } = await supabase
            .from("users")
            .delete()
            .in("id", volunteerIds)
            .eq("user_role", "volunteer") // Extra safety: only delete volunteers
            .select();

        if (error) {
            console.error("Bulk delete error:", error);
            return NextResponse.json(
                { error: "Failed to delete volunteers", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            deletedCount: data?.length || 0,
            message: `Successfully deleted ${data?.length || 0} volunteer(s) from database`,
        });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
