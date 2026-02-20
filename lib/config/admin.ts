// Legacy hardcoded list - kept as fallback during migration.
// The primary check now uses the admin_users database table via auth-guard.ts
export const ALLOWED_ADMINS = [
    "admin@attaraljannah.com",
    "minhajuljanna@gmail.com",
    "navarmp@gmail.com"
];

/**
 * Check if an email is in the allowed admin list.
 * This is used by the client-side auth context for quick checks.
 * Server-side routes should use requireAdmin() from auth-guard.ts instead.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    return ALLOWED_ADMINS.includes(email.toLowerCase());
}

export type AdminRole = "super_admin" | "admin" | "viewer";
