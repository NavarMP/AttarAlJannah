import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config/admin";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Authenticate with Supabase Authentication
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError || !authData.user) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }


        // Fetch admin role from admin_users table
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: adminUser } = await adminSupabase
            .from("admin_users")
            .select("*")
            .eq("email", email)
            .single();

        if (!adminUser || !adminUser.is_active) {
            await supabase.auth.signOut();
            return NextResponse.json(
                { error: "Access denied. Your admin account is inactive." },
                { status: 403 }
            );
        }

        // Update last login
        await adminSupabase
            .from("admin_users")
            .update({ last_login_at: new Date().toISOString() })
            .eq("email", email);

        // Log the login
        await logAuditEvent({
            admin: adminUser,
            action: "login",
            entityType: "auth",
            details: { method: "email_password" },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({
            success: true,
            user: {
                id: authData.user.id,
                email: authData.user.email,
                name: adminUser.name || "Admin User",
                role: "admin",
                adminRole: adminUser.role,
            },
        });
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
