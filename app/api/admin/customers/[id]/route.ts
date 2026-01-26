import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const supabase = await createClient();

        // Verify admin authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const { data: adminUser } = await supabase
            .from("users")
            .select("user_role")
            .eq("id", user.id)
            .single();

        if (!adminUser || adminUser.user_role !== "admin") {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        const customerId = params.id;

        // Delete customer from customer_profiles table
        const { error } = await supabase
            .from("customer_profiles")
            .delete()
            .eq("id", customerId);

        if (error) {
            console.error("Customer delete error:", error);
            return NextResponse.json(
                { error: "Failed to delete customer" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
