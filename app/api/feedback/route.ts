import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/feedback - List all feedback (admin only)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Use service role client for data access to handle both Admin and Simple Auth cases
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get query parameters
        const status = searchParams.get("status") || "all";
        const category = searchParams.get("category") || "all";
        const priority = searchParams.get("priority") || "all";
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");
        const sort = searchParams.get("sort") || "newest";
        const search = searchParams.get("search") || "";
        const emailParam = searchParams.get("email");
        const phoneParam = searchParams.get("phone");

        // Verify authentication
        const { data: { user } } = await supabase.auth.getUser();
        let isAdmin = false;

        if (user) {
            // Check if user is admin in the users table
            const { data: userDetails, error: userError } = await supabase
                .from("users")
                .select("user_role")
                .eq("id", user.id)
                .single();

            if (!userError && userDetails?.user_role === "admin") {
                isAdmin = true;
            }
        }

        // Build query using adminSupabase
        let query = adminSupabase
            .from("feedback")
            .select("*", { count: "exact" });

        // Access Control
        if (isAdmin) {
            // Admin sees all feedback - no filter needed
            console.log("Admin access granted - fetching all feedback");
        } else if (user) {
            // Authenticated non-admin: see own feedback only
            query = query.eq("user_id", user.id);
        } else if (emailParam || phoneParam) {
            // Simple Auth (Unauthenticated but provided contact info)
            if (emailParam) query = query.eq("email", emailParam);
            if (phoneParam) {
                const phoneClean = phoneParam.replace(/\D/g, '').slice(-10);
                query = query.ilike("phone", `%${phoneClean}%`);
            }
        } else {
            // No auth, no params -> Unauthorized
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Apply filters
        if (status !== "all") {
            query = query.eq("status", status);
        }

        if (category !== "all") {
            query = query.eq("category", category);
        }

        if (priority !== "all") {
            query = query.eq("priority", priority);
        }

        // Search
        if (search) {
            query = query.or(`subject.ilike.%${search}%,message.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        // Sorting
        if (sort === "newest") {
            query = query.order("created_at", { ascending: false });
        } else if (sort === "oldest") {
            query = query.order("created_at", { ascending: true });
        } else if (sort === "priority") {
            query = query.order("priority", { ascending: false });
        }

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data: feedback, error, count } = await query;

        if (error) {
            console.error("Error fetching feedback:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            feedback,
            pagination: {
                total: count || 0,
                limit,
                offset,
                hasMore: (count || 0) > offset + limit,
            },
        });
    } catch (error: any) {
        console.error("Feedback fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/feedback - Submit new feedback
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // Get current user (optional - feedback can be anonymous)
        const { data: { user } } = await supabase.auth.getUser();

        // Validate required fields
        const {
            name,
            email,
            phone,
            category,
            subject,
            message,
            rating_packing,
            rating_delivery,
            rating_ordering,
            rating_overall,
            product_photo_url,
            screenshot_url,
            page_url,
            is_anonymous,
            metadata,
        } = body;

        if (!name || !email || !category || !subject || !message || !rating_overall) {
            return NextResponse.json(
                { error: "Missing required fields: name, email, category, subject, message, rating_overall" },
                { status: 400 }
            );
        }

        // Validate rating values
        const ratings = [rating_packing, rating_delivery, rating_ordering, rating_overall];
        for (const rating of ratings) {
            if (rating && (rating < 1 || rating > 5)) {
                return NextResponse.json(
                    { error: "All ratings must be between 1 and 5" },
                    { status: 400 }
                );
            }
        }

        // Get user role if authenticated
        let user_role = "anonymous";
        let user_id = null;

        if (user && !is_anonymous) {
            // Check if user is a volunteer
            const { data: volunteer } = await supabase
                .from("volunteers")
                .select("id, role")
                .eq("auth_id", user.id)
                .single();

            if (volunteer) {
                user_id = user.id; // Assuming feedback.user_id references auth.users
                user_role = volunteer.role || "volunteer";
            } else {
                // Check legacy users or admin?
                // Admin check (hardcoded email or check users table if used for admin)
                const { data: existingUser } = await supabase
                    .from("users")
                    .select("id, user_role")
                    .eq("id", user.id)
                    .single();

                if (existingUser) {
                    user_id = user.id;
                    user_role = existingUser.user_role;
                } else {
                    // Customer or loose auth
                    user_id = null;
                    user_role = "customer";
                }
            }
        }

        // Create feedback
        const { data: feedback, error } = await supabase
            .from("feedback")
            .insert({
                user_id,
                user_role,
                name: is_anonymous ? "Anonymous" : name,
                email,
                phone,
                category,
                subject,
                message,
                rating_packing,
                rating_delivery,
                rating_ordering,
                rating_overall,
                product_photo_url,
                screenshot_url,
                page_url,
                status: "new",
                priority: "medium",
                metadata: metadata || {},
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating feedback:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Notify admins about new feedback
        const { data: admins } = await supabase
            .from("users")
            .select("id")
            .eq("role", "admin");

        if (admins && admins.length > 0) {
            const notifications = admins.map((admin) => ({
                user_id: admin.id,
                user_role: "admin" as const,
                type: "admin_action" as const,
                title: "New Feedback Received",
                message: `New ${category} feedback from ${is_anonymous ? "Anonymous" : name}: "${subject.slice(0, 50)}${subject.length > 50 ? '...' : ''}"`,
                action_url: `/admin/feedback/${feedback.id}`,
                metadata: { feedback_id: feedback.id, category },
            }));

            await supabase.from("notifications").insert(notifications);
        }

        return NextResponse.json({
            feedback,
            message: "Feedback submitted successfully! Thank you for your input.",
        }, { status: 201 });
    } catch (error: any) {
        console.error("Feedback submit error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
