import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config/admin";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify admin authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin via email
        if (!isAdminEmail(user.email)) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        const { volunteerIds } = await request.json();

        if (!Array.isArray(volunteerIds) || volunteerIds.length === 0) {
            return NextResponse.json({ error: "No volunteer IDs provided" }, { status: 400 });
        }

        // Initialize Admin Client for deletion
        // (volunteers table might need admin rights if RLS is strict, though standard client might work if user is admin?? 
        //  Wait, 'user' is the admin user. If RLS allows admin email, it works. 
        //  But using Service Role is safer/guaranteed for admin ops).
        const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Delete volunteers from database
        // Note: Due to ON DELETE CASCADE on challenge_progress, 
        // their challenge progress will be automatically deleted
        // Orders will have referred_by set to NULL (ON DELETE SET NULL)
        const { data, error } = await adminSupabase
            .from("volunteers") // New Table
            .delete()
            .in("id", volunteerIds)
            // .eq("role", "volunteer")
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
