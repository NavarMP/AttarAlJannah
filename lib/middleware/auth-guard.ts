import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface AdminUser {
    id: string;
    auth_id: string | null;
    email: string;
    name: string;
    role: "super_admin" | "admin" | "viewer";
    is_active: boolean;
}

// Permission hierarchy: super_admin > admin > viewer
const ROLE_HIERARCHY: Record<string, number> = {
    viewer: 1,
    admin: 2,
    super_admin: 3,
};

/**
 * Server-side auth guard for admin API routes.
 * Verifies the user is authenticated and has the required role level.
 *
 * @param requiredRole - Minimum role needed (default: 'viewer')
 * @returns AdminUser if authorized, or NextResponse error
 */
export async function requireAdmin(
    requiredRole: "viewer" | "admin" | "super_admin" = "viewer"
): Promise<{ admin: AdminUser } | { error: NextResponse }> {
    try {
        const supabase = await createClient();

        // 1. Check Supabase Auth session
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                error: NextResponse.json(
                    { error: "Unauthorized — please log in" },
                    { status: 401 }
                ),
            };
        }

        // 2. Look up admin_users record
        const { createClient: createSupabaseClient } = await import(
            "@supabase/supabase-js"
        );
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: adminUser, error: adminError } = await adminSupabase
            .from("admin_users")
            .select("*")
            .eq("email", user.email)
            .eq("is_active", true)
            .single();

        if (adminError || !adminUser) {
            return {
                error: NextResponse.json(
                    { error: "Forbidden — admin access required" },
                    { status: 403 }
                ),
            };
        }

        // 3. Check role hierarchy
        const userLevel = ROLE_HIERARCHY[adminUser.role] || 0;
        const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

        if (userLevel < requiredLevel) {
            return {
                error: NextResponse.json(
                    {
                        error: `Forbidden — requires ${requiredRole} access`,
                    },
                    { status: 403 }
                ),
            };
        }

        return { admin: adminUser as AdminUser };
    } catch (error) {
        console.error("Auth guard error:", error);
        return {
            error: NextResponse.json(
                { error: "Internal authentication error" },
                { status: 500 }
            ),
        };
    }
}

/**
 * Check if an admin has at least the specified role level.
 */
export function hasMinRole(
    admin: AdminUser,
    requiredRole: "viewer" | "admin" | "super_admin"
): boolean {
    const userLevel = ROLE_HIERARCHY[admin.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    return userLevel >= requiredLevel;
}
