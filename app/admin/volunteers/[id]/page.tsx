
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

    // Check if user is admin
    const { isAdminEmail } = await import("@/lib/config/admin");
    let isAdmin = false;

    if (session.user.email && isAdminEmail(session.user.email)) {
        isAdmin = true;
    } else {
        const { data: userRole } = await supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single();

        if (userRole?.role === "admin") {
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
