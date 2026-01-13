"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LeaderboardEntry {
    id: string;
    name: string;
    confirmed_orders: number;
    total_revenue: number;
    rank: number;
}

interface VolunteerLeaderboardProps {
    currentVolunteerId?: string;
    limit?: number;
    autoRefreshSeconds?: number;
}

export function VolunteerLeaderboard({
    currentVolunteerId,
    limit = 10,
    autoRefreshSeconds = 30,
}: VolunteerLeaderboardProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentVolunteerRank, setCurrentVolunteerRank] = useState<number | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        try {
            // The instruction provided a hardcoded limit=5, but the original code used the 'limit' prop.
            // I'm using the 'limit' prop to maintain dynamic behavior, as the instruction's snippet was incomplete.
            const response = await fetch(`/api/volunteer/leaderboard?limit=${limit}`);
            if (!response.ok) throw new Error("Failed to load leaderboard"); // Changed error message as per instruction

            const data = await response.json();
            setLeaderboard(data.leaderboard || []);

            // Find current volunteer's rank
            if (currentVolunteerId) {
                const currentEntry = data.leaderboard.find(
                    (entry: LeaderboardEntry) => entry.id === currentVolunteerId
                );
                setCurrentVolunteerRank(currentEntry?.rank || null);
            }
        } catch (error) {
            console.error("Leaderboard error:", error); // Changed error message as per instruction
            // Don't show toast for this component to avoid spamming // Removed toast as per instruction
        } finally {
            setIsLoading(false);
        }
    }, [limit, currentVolunteerId]);

    useEffect(() => {
        fetchLeaderboard();

        // Auto-refresh
        if (autoRefreshSeconds > 0) {
            const interval = setInterval(fetchLeaderboard, autoRefreshSeconds * 1000);
            return () => clearInterval(interval);
        }
    }, [fetchLeaderboard, autoRefreshSeconds]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-6 h-6 text-gold-500" />;
            case 2:
                return <Medal className="w-6 h-6 text-gray-400" />;
            case 3:
                return <Medal className="w-6 h-6 text-amber-600" />;
            default:
                return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
        }
    };

    const getRankBadge = (rank: number) => {
        if (rank <= 3) {
            const colors = {
                1: "bg-gold-500/20 text-gold-600 border-gold-300",
                2: "bg-gray-400/20 text-gray-600 border-gray-300",
                3: "bg-amber-600/20 text-amber-700 border-amber-300",
            };
            return colors[rank as 1 | 2 | 3];
        }
        return "bg-secondary text-secondary-foreground border-border";
    };

    if (isLoading) {
        return (
            <Card className="glass-strong">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-gold-500" />
                        Leaderboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-strong border-gold-300 dark:border-gold-700">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-gold-500" />
                    Top Volunteers
                </CardTitle>
                {currentVolunteerRank && (
                    <p className="text-sm text-muted-foreground">
                        Your rank: #{currentVolunteerRank}
                    </p>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                {leaderboard.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No data yet</p>
                    </div>
                ) : (
                    leaderboard.map((entry) => {
                        const isCurrentUser = entry.id === currentVolunteerId;

                        return (
                            <div
                                key={entry.id}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isCurrentUser
                                    ? "bg-primary/10 border-2 border-primary"
                                    : "bg-card/50 border border-border hover:bg-card"
                                    }`}
                            >
                                <div className="flex-shrink-0">
                                    {getRankIcon(entry.rank)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={`font-semibold truncate ${isCurrentUser ? "text-primary" : ""}`}>
                                        {entry.name}
                                        {isCurrentUser && " (You)"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {entry.confirmed_orders} orders • ₹{entry.total_revenue.toLocaleString()}
                                    </p>
                                </div>

                                <div
                                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getRankBadge(entry.rank)}`}
                                >
                                    #{entry.rank}
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
