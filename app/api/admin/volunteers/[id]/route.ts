
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

        // Try update by volunteer_id
        let { data, error } = await supabase
            .from("volunteers")
            .update(body)
            .eq("volunteer_id", id)
            .select()
            .single();

        // Fallback to update by UUID if not found/error
        if (error || !data) {
            const uuidResult = await supabase
                .from("volunteers")
                .update(body)
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

        // If error (or maybe generic error if not found? standard delete doesn't error on not found usually)
        // But to be safe, let's try delete by UUID if we are not sure what `id` is.
        // Actually, deleting by ID matching either column is safer done with an OR logic or check first.

        // Let's resolve the ID first.
        const { data: vol } = await supabase.from("volunteers").select("id").or(`volunteer_id.eq.${id},id.eq.${id}`).single();

        if (vol) {
            const { error: deleteError } = await supabase
                .from("volunteers")
                .delete()
                .eq("id", vol.id);

            if (deleteError) {
                return NextResponse.json({ error: deleteError.message }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
