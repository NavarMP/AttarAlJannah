"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Medal, Award, TrendingUp } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface LeaderboardEntry {
    rank: number;
    id: string;
    name: string;
    volunteer_id: string;
    confirmed_bottles: number;
    confirmed_orders_count?: number;
    total_revenue: number;
}

export default function VolunteerLeaderboardPage() {
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentVolunteerId, setCurrentVolunteerId] = useState<string>("");

    const [sortType, setSortType] = useState<"bottles" | "orders">("bottles");

    useEffect(() => {
        // Check authentication
        const volunteerId = localStorage.getItem("volunteerId");
        if (!volunteerId) {
            router.push("/volunteer/login");
            return;
        }
        setCurrentVolunteerId(volunteerId);
        fetchLeaderboard();
    }, [router]);

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch("/api/volunteer/leaderboard", { cache: "no-store" });
            if (!response.ok) throw new Error("Failed to load leaderboard");

            const data = await response.json();
            setLeaderboard(data.leaderboard || []);
        } catch (error) {
            console.error("Leaderboard error:", error);
            toast.error("Failed to load leaderboard");
        } finally {
            setIsLoading(false);
        }
    };

    const getSortedLeaderboard = () => {
        return [...leaderboard].sort((a, b) => {
            if (sortType === "bottles") {
                return b.confirmed_bottles - a.confirmed_bottles;
            }
            return (b.confirmed_orders_count || 0) - (a.confirmed_orders_count || 0);
        }).map((entry, index) => ({ ...entry, rank: index + 1 }));
    };

    const sortedLeaderboard = getSortedLeaderboard();

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
        if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
        return <span className="w-6 text-center font-bold text-muted-foreground">{rank}</span>;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading leaderboard...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/volunteer/dashboard">
                                <Button variant="outline" className="rounded-2xl">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-10 h-10 text-yellow-500" />
                            <div>
                                <h1 className="text-4xl font-bold">Volunteer Leaderboard</h1>
                                <p className="text-muted-foreground">See how you rank among all volunteers</p>
                            </div>
                        </div>

                        {/* Sort Switch */}
                        <div className="flex bg-muted p-1 rounded-xl">
                            <button
                                onClick={() => setSortType("bottles")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortType === "bottles"
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Bottles
                            </button>
                            <button
                                onClick={() => setSortType("orders")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortType === "orders"
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Orders
                            </button>
                        </div>
                    </div>
                </div>

                {/* Leaderboard */}
                <Card className="glass-strong rounded-3xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Rankings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sortedLeaderboard.length === 0 ? (
                            <div className="text-center py-12">
                                <Award className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                                <p className="text-lg text-muted-foreground">No volunteers yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sortedLeaderboard.map((entry) => {
                                    const isCurrentUser = entry.volunteer_id === currentVolunteerId;
                                    return (
                                        <div
                                            key={entry.id}
                                            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${entry.rank <= 3 && !isCurrentUser
                                                ? "bg-card border-2 " + (
                                                    entry.rank === 1 ? "border-yellow-500 shadow-lg ring-2 ring-yellow-500/20" :
                                                        entry.rank === 2 ? "border-gray-400 shadow-lg ring-2 ring-gray-400/20" :
                                                            "border-amber-600 shadow-lg ring-2 ring-amber-600/20"
                                                )
                                                : isCurrentUser
                                                    ? "bg-primary/10 border-2 border-primary shadow-lg ring-2 ring-primary/20"
                                                    : "bg-card border border-border hover:border-primary/50"
                                                }`}
                                        >
                                            {/* Rank */}
                                            <div className="flex-shrink-0 w-12 flex items-center justify-center">
                                                {getRankIcon(entry.rank)}
                                            </div>

                                            {/* Volunteer Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`font-semibold truncate ${entry.rank <= 3 && !isCurrentUser
                                                        ? "text-white"
                                                        : isCurrentUser
                                                            ? "text-primary"
                                                            : "text-foreground"
                                                        }`}>
                                                        {entry.name} {isCurrentUser && "(You)"}
                                                    </h3>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${entry.rank <= 3 && !isCurrentUser
                                                        ? "bg-white/20 text-white"
                                                        : isCurrentUser
                                                            ? "bg-primary/20 text-primary"
                                                            : "bg-muted text-muted-foreground"
                                                        }`}>
                                                        {entry.volunteer_id}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-6">
                                                <div className={`text-right ${sortType === 'bottles' ? 'opacity-100' : 'opacity-60'}`}>
                                                    <div className={`text-sm ${entry.rank <= 3 && !isCurrentUser
                                                        ? "text-white/80"
                                                        : isCurrentUser
                                                            ? "text-primary/80"
                                                            : "text-muted-foreground"
                                                        }`}>
                                                        Bottles
                                                    </div>
                                                    <div className={`text-xl font-bold ${entry.rank <= 3 && !isCurrentUser
                                                        ? "text-white"
                                                        : isCurrentUser
                                                            ? "text-primary"
                                                            : "text-primary"
                                                        }`}>
                                                        {entry.confirmed_bottles}
                                                    </div>
                                                </div>
                                                <div className={`text-right ${sortType === 'orders' ? 'opacity-100' : 'opacity-60'}`}>
                                                    <div className={`text-sm ${entry.rank <= 3 && !isCurrentUser
                                                        ? "text-white/80"
                                                        : isCurrentUser
                                                            ? "text-primary/80"
                                                            : "text-muted-foreground"
                                                        }`}>
                                                        Orders
                                                    </div>
                                                    <div className={`text-xl font-bold ${entry.rank <= 3 && !isCurrentUser
                                                        ? "text-white"
                                                        : isCurrentUser
                                                            ? "text-primary"
                                                            : "text-blue-500"
                                                        }`}>
                                                        {entry.confirmed_orders_count || 0}
                                                    </div>
                                                </div>
                                                <div className="text-right hidden sm:block">
                                                    <div className={`text-sm ${entry.rank <= 3 && !isCurrentUser
                                                        ? "text-white/80"
                                                        : isCurrentUser
                                                            ? "text-primary/80"
                                                            : "text-muted-foreground"
                                                        }`}>
                                                        Revenue
                                                    </div>
                                                    <div className={`text-xl font-bold ${entry.rank <= 3 && !isCurrentUser
                                                        ? "text-white"
                                                        : isCurrentUser
                                                            ? "text-primary"
                                                            : "text-emerald-600"
                                                        }`}>
                                                        ₹{entry.total_revenue.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
