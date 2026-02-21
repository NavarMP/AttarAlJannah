
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { VolunteerDetail } from "@/components/admin/volunteers/volunteer-detail";

export const dynamic = "force-dynamic";

export default async function VolunteerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    // In Next.js 15, params is a Promise that needs to be awaited
    const { id } = await params;

    const supabase = await createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        redirect("/login");
    }

    // Check if user is admin via admin_users table
    let isAdmin = false;

    if (session?.user?.email) {
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: adminUser } = await adminSupabase
            .from("admin_users")
            .select("role")
            .eq("email", session.user.email)
            .eq("is_active", true)
            .single();

        if (adminUser) {
            isAdmin = true;
        }
    }

    if (!isAdmin) {
        redirect("/");
    }

    const { data: volunteer, error } = await supabase
        .from("volunteers")
        .select("*")
        .eq("volunteer_id", id) // Query by volunteer_id
        .single();

    // Fallback: if not found by volunteer_id, try by UUID (for backward compatibility if needed, or legacy links)
    if (error || !volunteer) {
        const { data: volunteerByUuid, error: uuidError } = await supabase
            .from("volunteers")
            .select("*")
            .eq("id", id)
            .single();

        if (volunteerByUuid) {
            // If found by UUID, we can either redirect to the volunteer_id URL or just render it. 
            // Rendering it is safer for now.
            return <VolunteerDetail volunteer={volunteerByUuid} />;
        }
        notFound();
    }

    return <VolunteerDetail volunteer={volunteer} />;
}
