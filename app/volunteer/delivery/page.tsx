"use client";

import { useState, useEffect } from "react";
import { DeliveryDashboard } from "@/components/volunteer/delivery-dashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VolunteerDeliveryPage() {
    const [volunteerId, setVolunteerId] = useState<string>("");

    useEffect(() => {
        // Simple auth check
        const id = localStorage.getItem("volunteerId");
        if (id) {
            setVolunteerId(id);
        }
    }, []);

    return (
        <main className="min-h-screen py-8 px-4 md:px-6 mb-20 bg-muted/20">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/volunteer/dashboard">
                        <Button variant="outline" className="rounded-2xl">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Dashboard
                        </Button>
                    </Link>
                </div>

                {volunteerId ? (
                    <DeliveryDashboard volunteerId={volunteerId} />
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Please log in to view deliveries.</p>
                        <Link href="/volunteer/login" className="text-primary hover:underline">Go to Login</Link>
                    </div>
                )}
            </div>
        </main>
    );
}
