import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

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

        // Find volunteer by volunteer_id (case-insensitive) in new volunteers table
        const { data: volunteer, error: fetchError } = await supabase
            .from("volunteers") // New Table
            .select("id, volunteer_id, name, email, status")
            .ilike("volunteer_id", volunteerId)
            // .eq("role", "volunteer") // Implied
            .single();

        if (fetchError || !volunteer || !volunteer.email) {
            return NextResponse.json(
                { error: "Invalid volunteer ID or password" },
                { status: 401 }
            );
        }

        // Check if volunteer account is active
        if (volunteer.status === "pending") {
            return NextResponse.json(
                { error: "Your account is pending admin approval. Please wait for approval before logging in." },
                { status: 403 }
            );
        }

        if (volunteer.status === "suspended") {
            return NextResponse.json(
                { error: "Your account has been suspended. Please contact an administrator." },
                { status: 403 }
            );
        }

        if (volunteer.status !== "active") {
            return NextResponse.json(
                { error: "Your account is not active. Please contact an administrator." },
                { status: 403 }
            );
        }

        // Sign in with Supabase Auth using looked-up email
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: volunteer.email,
            password: password,
        });

        if (signInError) {
            return NextResponse.json(
                { error: "Invalid volunteer ID or password" },
                { status: 401 }
            );
        }

        await logAuditEvent({
            actor: {
                id: authData.user?.id || volunteer.id,
                email: volunteer.email,
                name: volunteer.name,
                role: "volunteer"
            },
            action: "login",
            entityType: "auth",
            details: { volunteer_id: volunteer.volunteer_id },
            ipAddress: getClientIP(request),
        });

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
