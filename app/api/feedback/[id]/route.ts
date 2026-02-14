import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config/admin";

// GET /api/feedback/[id] - Get single feedback details (admin only)
// GET /api/feedback/[id] - Get single feedback details
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const phoneParam = searchParams.get("phone");

        // 1. Get the feedback item first using service role to bypass potential RLS issues for initial check
        const { createClient: createServiceClient } = await import("@supabase/supabase-js");
        const adminSupabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: feedback, error } = await adminSupabase
            .from("feedback")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !feedback) {
            return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
        }

        // 2. Access Control
        const { data: { user } } = await supabase.auth.getUser();

        console.log(`[Feedback Detail] Checking auth for Feedback ID: ${id}`);
        // Log user details safely
        console.log(`[Feedback Detail] User Email: ${user?.email || 'No User'}, User Phone: ${user?.phone || 'No Phone'}, Phone Param: ${phoneParam}, Feedback Phone: ${feedback.phone}`);

        let isAuthorized = false;

        // Check Admin
        if (user) {
            const { isAdminEmail } = await import("@/lib/config/admin");
            if (isAdminEmail(user.email)) {
                console.log("[Feedback Detail] Authorized as Admin");
                isAuthorized = true;
            }
            // Check Owner (Supabase User)
            else if (feedback.user_id === user.id) {
                console.log("[Feedback Detail] Authorized as Owner (User ID Match)");
                isAuthorized = true;
            }
            // Check Hybrid (User has phone that matches feedback)
            else if (user.phone && feedback.phone) {
                const userPhoneClean = user.phone.replace(/\D/g, '').slice(-10);
                const feedbackPhoneClean = feedback.phone.replace(/\D/g, '').slice(-10);
                if (userPhoneClean === feedbackPhoneClean) {
                    console.log("[Feedback Detail] Authorized as Owner (Phone Match via Session)");
                    isAuthorized = true;
                }
            }
        }

        // Check Simple Auth (Phone Param)
        if (!isAuthorized && phoneParam) {
            const cleanParam = phoneParam.replace(/\D/g, '').slice(-10);
            const cleanFeedbackPhone = feedback.phone?.replace(/\D/g, '').slice(-10) || "";

            console.log(`[Feedback Detail] Comparing Params - Input: ${cleanParam}, Feedback: ${cleanFeedbackPhone}`);

            if (cleanFeedbackPhone === cleanParam) {
                console.log("[Feedback Detail] Authorized via Phone Param");
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            console.warn("[Feedback Detail] Authorization Failed");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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

        const { isAdminEmail } = await import("@/lib/config/admin");
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
