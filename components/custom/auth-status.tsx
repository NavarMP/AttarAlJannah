"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LogIn, User, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/lib/contexts/customer-auth-context";
import { useAuth } from "@/lib/contexts/auth-context";
import { AutoHideContainer } from "@/components/custom/auto-hide-container";

export function AuthStatus() {
    const { user: customerUser } = useCustomerAuth();
    const { user: adminUser } = useAuth();
    const router = useRouter();
    const [volunteerLoggedIn, setVolunteerLoggedIn] = useState(false);

    useEffect(() => {
        const volunteerId = localStorage.getItem("volunteerId");
        setVolunteerLoggedIn(!!volunteerId);
    }, []);

    // Logic: Show login button along with logged in panel icon in all cases

    return (
        <AutoHideContainer className="fixed top-6 right-6 z-50 flex gap-2 items-center">
            {/* Admin Dashboard Icon - Show if Admin logged in */}
            {adminUser && (
                <Button
                    onClick={() => router.push("/admin/dashboard")}
                    className="rounded-full shadow-lg bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 w-12 h-12 p-0"
                    title="Admin Dashboard"
                >
                    <ShieldCheck className="w-5 h-5" />
                </Button>
            )}

            {/* Volunteer Dashboard Icon - Show if Volunteer logged in */}
            {volunteerLoggedIn && (
                <Button
                    onClick={() => router.push("/volunteer/dashboard")}
                    className="rounded-full shadow-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 w-12 h-12 p-0"
                    title="Volunteer Dashboard"
                >
                    <Award className="w-5 h-5" />
                </Button>
            )}

            {/* Customer Dashboard Icon - Show if Customer logged in */}
            {customerUser && (
                <Button
                    onClick={() => router.push("/customer/dashboard")}
                    className="rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 w-12 h-12 p-0"
                    title="Customer Dashboard"
                >
                    <User className="w-5 h-5" />
                </Button>
            )}

            {/* Login Button - Show unless logged in as ALL roles (Admin + Volunteer + Customer) */}
            {!(adminUser && volunteerLoggedIn && customerUser) && (
                <Button
                    onClick={() => router.push("/login")}
                    className="rounded-2xl shadow-lg bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600"
                    size="lg"
                >
                    <LogIn className="w-5 h-5 mr-2" />
                    Login
                </Button>
            )}
        </AutoHideContainer>
    );
}
