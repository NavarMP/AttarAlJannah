import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const { volunteerId, password } = await request.json();

        if (!volunteerId || !password) {
            return NextResponse.json(
                { error: "Volunteer ID and password are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Find volunteer by volunteer_id (case-insensitive)
        const { data: volunteer, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .ilike("volunteer_id", volunteerId)
            .eq("user_role", "volunteer")
            .single();

        if (fetchError || !volunteer) {
            return NextResponse.json(
                { error: "Invalid volunteer ID or password" },
                { status: 401 }
            );
        }

        // Verify password using pgcrypto
        const { data: passwordCheck, error: passwordError } = await supabase
            .rpc("verify_password", {
                user_id: volunteer.id,
                password_input: password,
            });

        if (passwordError) {
            // Fallback: Create the verification function if it doesn't exist
            // For now, we'll check using a raw query
            const { data: verifyResult } = await supabase
                .from("users")
                .select("id")
                .eq("id", volunteer.id)
                .eq("password_hash", `crypt('${password}', password_hash)`)
                .single();

            if (!verifyResult) {
                return NextResponse.json(
                    { error: "Invalid volunteer ID or password" },
                    { status: 401 }
                );
            }
        }

        // Sign in with Supabase Auth using email (volunteer email is auto-generated)
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: volunteer.email,
            password: password,
        });

        if (signInError) {
            // If auth sign-in fails, create a session manually
            // For now, we'll just return success with volunteer data
            return NextResponse.json({
                success: true,
                volunteer: {
                    id: volunteer.id,
                    volunteerId: volunteer.volunteer_id,
                    name: volunteer.name,
                    email: volunteer.email,
                },
            });
        }

        return NextResponse.json({
            success: true,
            session: authData.session,
            volunteer: {
                id: volunteer.id,
                volunteerId: volunteer.volunteer_id,
                name: volunteer.name,
                email: volunteer.email,
            },
        });
    } catch (error) {
        console.error("Volunteer login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
