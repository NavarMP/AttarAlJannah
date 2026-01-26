import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

        // Check if user has admin role in users table
        const { data: userRole, error: roleError } = await supabase
            .from("users")
            .select("user_role, name")
            .eq("email", email)
            .single();

        // If user doesn't exist in users table or is not admin, sign them out
        if (roleError || !userRole || userRole.user_role !== "admin") {
            await supabase.auth.signOut();
            return NextResponse.json(
                { error: "Access denied. Admin privileges required." },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: authData.user.id,
                email: authData.user.email,
                name: userRole.name || authData.user.email?.split('@')[0],
                role: userRole.user_role,
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
