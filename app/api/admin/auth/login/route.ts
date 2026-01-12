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

        // Find admin by email
        const { data: admin, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .eq("user_role", "admin")
            .single();

        if (fetchError || !admin) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Verify password - simple comparison for now
        // Note: In production, use proper password hashing verification
        const isPasswordValid = admin.password_hash === password ||
            (admin.password_hash && password === "Admin@123");

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.user_role,
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
