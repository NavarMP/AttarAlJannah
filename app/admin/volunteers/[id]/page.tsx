
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
    const { data: userRole } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

    if (userRole?.role !== "admin") {
        redirect("/");
    }

    const { data: volunteer, error } = await supabase
        .from("volunteers")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !volunteer) {
        notFound();
    }

    return <VolunteerDetail volunteer={volunteer} />;
}
