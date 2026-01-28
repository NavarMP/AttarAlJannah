import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config/admin";

// GET /api/feedback/[id] - Get single feedback details (admin only)
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();

        // Verify user is admin
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const ADMIN_EMAIL = "admin@attaraljannah.com";
        if (user.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        // Get feedback
        const { data: feedback, error } = await supabase
            .from("feedback")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !feedback) {
            console.error("Fetch feedback error:", error);
            return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
        }

        console.log("Feedback fetched successfully:", id);
        return NextResponse.json({ feedback });
    } catch (error: any) {
        console.error("Feedback fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/feedback/[id] - Update feedback (admin only)
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();
        const body = await request.json();

        // Verify user is admin
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const ADMIN_EMAIL = "admin@attaraljannah.com";
        if (user.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        const { status, priority, admin_notes, admin_reply, tags } = body;

        // Build update object
        const updates: any = {};
        if (status) updates.status = status;
        if (priority) updates.priority = priority;
        if (admin_notes !== undefined) updates.admin_notes = admin_notes;
        if (admin_reply !== undefined) updates.admin_reply = admin_reply;
        if (tags !== undefined) updates.tags = tags;

        // Update feedback
        const { data: feedback, error } = await supabase
            .from("feedback")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error || !feedback) {
            console.error("Error updating feedback:", error);
            return NextResponse.json({ error: error?.message || "Feedback not found" }, { status: error ? 500 : 404 });
        }

        return NextResponse.json({ feedback, message: "Feedback updated successfully" });
    } catch (error: any) {
        console.error("Feedback update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/feedback/[id] - Delete feedback (admin only)
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();

        // Verify user is admin
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!isAdminEmail(user.email)) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        // Delete feedback
        const { error } = await supabase
            .from("feedback")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting feedback:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Feedback deleted successfully" });
    } catch (error: any) {
        console.error("Feedback delete error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
