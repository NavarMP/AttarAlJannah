"use client";

export const dynamic = "force-dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EnhancedLeaderboard } from "@/components/volunteer/enhanced-leaderboard";
import { AutoHideContainer } from "@/components/custom/auto-hide-container";
import { ThemeToggle } from "@/components/custom/theme-toggle";

export default function AdminLeaderboardPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen py-8 px-4">
            <AutoHideContainer>
                <div className="flex items-center justify-between mb-6">
                    <Link href="/admin/dashboard">
                        <Button variant="outline" className="rounded-2xl">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <ThemeToggle />
                </div>
            </AutoHideContainer>

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold">Volunteer Leaderboard</h1>
                    <p className="text-muted-foreground">
                        Track and compare volunteer performance across multiple metrics
                    </p>
                </div>

                <EnhancedLeaderboard />
            </div>
        </main>
    );
}
