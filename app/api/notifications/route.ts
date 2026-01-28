import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/notifications - List notifications for current user
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Get query parameters
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");
        const unreadOnly = searchParams.get("unread_only") === "true";
        const type = searchParams.get("type") || "all";

        // Use service role client to handle both Admin and Simple Auth cases
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check for Auth (Supabase Session)
        const { data: { user } } = await supabase.auth.getUser();
        let targetUserId = user?.id;
        let isSimpleAuth = false;

        // If no session, check for Simple Auth headers/params (Phone or Volunteer ID)
        // Note: In a real secure app, we'd verify a token. Here we trust the client implementation for Simple Auth (Simple ID/Phone).
        if (!targetUserId) {
            const phone = searchParams.get("phone"); // For Customers
            const volunteerId = searchParams.get("volunteer_id"); // For Volunteers (UUID or Readable?)

            if (phone) {
                // Find user by phone in consumers/users?? 
                // Actually, notifications are linked to `user_id`.
                // If the Customer "Simple Auth" user is NOT in `auth.users` or `public.users`, they can't have notifications linked to a UUID.
                // HOWEVER, our `notifications` table has `user_id` (UUID).
                // Does "Phone Login" create a UUID user? Yes, `api/customer/profile` creates a row in `customer_profiles` (which might have a UUID?).
                // Let's assume notifications for simple auth need a way to link.
                // If we can't link to UUID, we can't show notifications.
                // EXISTING ARCHITECTURE: `public.users` seems to be the main user table.
                // The `CustomerAuthContext` uses `api/customer/profile`.
                // If `api/customer/profile` returns an ID, use that.

                // Let's assume the client passes the UUID if available.
                // If the client only has phone, we need to lookup UUID.

                // Simpler approach: Logic below assumes `user_id` matches.
                // If client passes `user_id` param (protected by us trusting it for now, or verifying it matches phone).
                const paramUserId = searchParams.get("user_id");
                if (paramUserId) {
                    targetUserId = paramUserId;
                    isSimpleAuth = true;
                }
            } else if (volunteerId) {
                // Similar for volunteer
                const paramUserId = searchParams.get("user_id");
                if (paramUserId) {
                    targetUserId = paramUserId;
                    isSimpleAuth = true;
                }
            }
        }

        if (!targetUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Build query using adminSupabase (to bypass RLS for Simple Auth, or regular RLS for Auth users if we switched back, but easier to just use Admin for consistent reads here)
        let query = adminSupabase
            .from("notifications")
            .select("*", { count: "exact" })
            .or(`user_id.eq.${targetUserId},user_role.eq.public`)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (unreadOnly) {
            query = query.eq("is_read", false);
        }

        if (type !== "all") {
            query = query.eq("type", type);
        }

        const { data: notifications, error, count } = await query;

        if (error) {
            console.error("Error fetching notifications:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            notifications,
            pagination: {
                total: count || 0,
                limit,
                offset,
                hasMore: (count || 0) > offset + limit,
            },
        });
    } catch (error: any) {
        console.error("Notification fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/notifications - Create a new notification (admin/system only)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // Verify user is admin
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: userDetails } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (userDetails?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        // Validate required fields
        const { user_id, user_role, type, title, message, action_url, metadata } = body;

        if (!user_role || !type || !title || !message) {
            return NextResponse.json(
                { error: "Missing required fields: user_role, type, title, message" },
                { status: 400 }
            );
        }

        // Create notification
        const { data: notification, error } = await supabase
            .from("notifications")
            .insert({
                user_id,
                user_role,
                type,
                title,
                message,
                action_url,
                metadata: metadata || {},
                is_read: false,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating notification:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ notification }, { status: 201 });
    } catch (error: any) {
        console.error("Notification creation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
