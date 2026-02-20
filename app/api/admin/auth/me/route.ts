import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Simple endpoint for the auth context to fetch admin role info
export async function GET(request: NextRequest) {
    try {
        const email = request.nextUrl.searchParams.get("email");

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        const supabase = await createClient();

        // Verify the caller is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.email !== email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch admin info using service role
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: adminUser } = await adminSupabase
            .from("admin_users")
            .select("name, role, is_active")
            .eq("email", email)
            .eq("is_active", true)
            .single();

        if (!adminUser) {
            return NextResponse.json({ error: "Not an admin" }, { status: 403 });
        }

        // Update last login
        await adminSupabase
            .from("admin_users")
            .update({ last_login_at: new Date().toISOString() })
            .eq("email", email);

        return NextResponse.json({
            name: adminUser.name,
            role: adminUser.role,
        });
    } catch (error) {
        console.error("Admin me error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
