"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminRole } from "@/lib/config/admin";

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    adminRole?: AdminRole;  // Granular role from admin_users table
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    hasPermission: (requiredRole: AdminRole) => boolean;
}

const ROLE_HIERARCHY: Record<string, number> = {
    viewer: 1,
    admin: 2,
    super_admin: 3,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchAdminRole = async (email: string): Promise<{ name: string; role: AdminRole } | null> => {
        try {
            const res = await fetch(`/api/admin/auth/me?email=${encodeURIComponent(email)}`);
            if (res.ok) {
                const data = await res.json();
                return { name: data.name, role: data.role };
            }
        } catch {
            // Fallback gracefully
        }
        return null;
    };

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    const adminInfo = await fetchAdminRole(session.user.email!);
                    if (adminInfo) {
                        setUser({
                            id: session.user.id,
                            email: session.user.email!,
                            name: adminInfo.name || 'Admin',
                            role: 'admin',
                            adminRole: adminInfo.role || 'admin',
                        });
                    } else {
                        setUser(null);
                    }
                }
            } catch (error) {
                console.error("Session check error:", error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const adminInfo = await fetchAdminRole(session.user.email!);
                if (adminInfo) {
                    setUser({
                        id: session.user.id,
                        email: session.user.email!,
                        name: adminInfo.name || 'Admin',
                        role: 'admin',
                        adminRole: adminInfo.role || 'admin',
                    });
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const signIn = async (email: string, password: string) => {
        const response = await fetch("/api/admin/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Login failed");
        }

        const { user: userData } = await response.json();
        setUser(userData);
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const hasPermission = (requiredRole: AdminRole): boolean => {
        if (!user?.adminRole) return false;
        const userLevel = ROLE_HIERARCHY[user.adminRole] || 0;
        const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
        return userLevel >= requiredLevel;
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
