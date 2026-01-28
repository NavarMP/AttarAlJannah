export const ALLOWED_ADMINS = [
    "admin@attaraljannah.com",
    "minhajuljanna@gmail.com",
    "navarmp@gmail.com"
];

export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    return ALLOWED_ADMINS.includes(email.toLowerCase());
}
