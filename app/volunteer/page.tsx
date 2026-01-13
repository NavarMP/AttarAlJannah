"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VolunteerRootPage() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Check localStorage for volunteer session
        const volunteerId = localStorage.getItem("volunteerId");

        if (volunteerId) {
            router.replace("/volunteer/dashboard");
        } else {
            router.replace("/volunteer/login");
        }

        setIsChecking(false);
    }, [router]);

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-xl">Loading...</div>
            </div>
        );
    }

    return null;
}
