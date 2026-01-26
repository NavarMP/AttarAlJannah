"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        // Check for existing Supabase session
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    // Verify user is admin
                    const { data: userRole } = await supabase
                        .from("users")
                        .select("user_role, name")
                        .eq("email", session.user.email)
                        .single();

                    if (userRole?.user_role === "admin") {
                        setUser({
                            id: session.user.id,
                            email: session.user.email!,
                            name: userRole.name || session.user.email?.split('@')[0] || 'Admin',
                            role: userRole.user_role,
                        });
                    } else {
                        // Not an admin, just ignore this session in AuthContext
                        // Do NOT sign out, as it might be a customer session
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

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const { data: userRole } = await supabase
                    .from("users")
                    .select("user_role, name")
                    .eq("email", session.user.email)
                    .single();

                if (userRole?.user_role === "admin") {
                    setUser({
                        id: session.user.id,
                        email: session.user.email!,
                        name: userRole.name || session.user.email?.split('@')[0] || 'Admin',
                        role: userRole.user_role,
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

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
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
