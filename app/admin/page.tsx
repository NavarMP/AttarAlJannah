"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (user) {
                router.push("/admin/dashboard");
            } else {
                router.push("/admin/login");
            }
        }
    }, [user, loading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Redirecting...</p>
            </div>
        </div>
    );
}
