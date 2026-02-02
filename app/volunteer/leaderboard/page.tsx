"use client";

import { EnhancedLeaderboard } from "@/components/volunteer/enhanced-leaderboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VolunteerLeaderboardPage() {
    return (
        <main className="min-h-screen py-8 px-4 md:px-6 mb-20">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/volunteer/dashboard">
                        <Button variant="outline" className="rounded-2xl">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                <EnhancedLeaderboard />
            </div>
        </main>
    );
}
