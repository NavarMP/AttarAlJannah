
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Try getting by volunteer_id first
        let query = supabase
            .from("volunteers")
            .select("*")
            .eq("volunteer_id", id)
            .single();

        let { data: volunteer, error } = await query;

        // Fallback to UUID if not found
        if (error || !volunteer) {
            const uuidQuery = supabase
                .from("volunteers")
                .select("*")
                .eq("id", id)
                .single();

            const uuidResult = await uuidQuery;
            volunteer = uuidResult.data;
            error = uuidResult.error;
        }

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(volunteer);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const supabase = await createClient();

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Sanitize body: remove fields that shouldn't be in the DB or are strictly for UI
        const { confirmPassword, ...updateData } = body;

        // If password is provided but empty, remove it so we don't blank it out
        // (The frontend might send "" if the user didn't touch the password field)
        if (updateData.password === "") {
            delete updateData.password;
        }

        // Also ensure we don't try to update the PKs if they are unchanged or shouldn't be touched
        // But the user might want to update volunteer_id.

        // Try update by volunteer_id
        let { data, error } = await supabase
            .from("volunteers")
            .update(updateData)
            .eq("volunteer_id", id)
            .select()
            .single();

        // Fallback to update by UUID if not found/error
        if (error || !data) {
            const uuidResult = await supabase
                .from("volunteers")
                .update(updateData)
                .eq("id", id)
                .select()
                .single();
            data = uuidResult.data;
            error = uuidResult.error;
        }

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Try delete by volunteer_id
        let { error } = await supabase
            .from("volunteers")
            .delete()
            .eq("volunteer_id", id);

        // Standard Supabase delete doesn't return error if record not found, only if query failed (e.g. constraints).
        // But if we use 'eq', it might just affect 0 rows.

        // If error occurred (like FK violation)
        if (error) {
            if (error.code === "23503") {
                return NextResponse.json({ error: "Cannot delete volunteer because they have associated orders or data." }, { status: 400 });
            }
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Check if we actually deleted something?
        // It's hard to know without 'select' or checking count. 
        // But the previous implementation had a fallback to ID.

        // Let's Resolve ID first to be precise
        const { data: vol } = await supabase.from("volunteers").select("id").or(`volunteer_id.eq.${id},id.eq.${id}`).single();

        if (vol) {
            const { error: deleteError } = await supabase
                .from("volunteers")
                .delete()
                .eq("id", vol.id);

            if (deleteError) {
                if (deleteError.code === "23503") {
                    return NextResponse.json({ error: "Cannot delete volunteer because they have associated orders or data." }, { status: 400 });
                }
                return NextResponse.json({ error: deleteError.message }, { status: 400 });
            }
        }
        // If vol not found, we can assume it's already gone or invalid ID. 
        // But asking for 'success' is fine.

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
