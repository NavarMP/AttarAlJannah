"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/lib/contexts/customer-auth-context";

export default function CustomerPage() {
    const { user, loading } = useCustomerAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (user) {
                router.push("/customer/dashboard");
            } else {
                router.push("/customer/login");
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
