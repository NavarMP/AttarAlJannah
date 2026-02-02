"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Package, DollarSign, Medal } from "lucide-react";
import { toast } from "sonner";

interface LeaderboardEntry {
    id: string;
    volunteer_id: string;
    name: string;
    phone: string;
    referred_bottles: number;
    referred_orders: number;
    total_referral_commission: number;
    delivered_orders: number;
    delivered_bottles: number;
    total_delivery_commission: number;
    total_commission: number;
    overall_score: number;
    rank: number;
}

type MetricType = "overall" | "referral" | "delivery" | "revenue";
type PeriodType = "all" | "month" | "week";

export function EnhancedLeaderboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [metric, setMetric] = useState<MetricType>("overall");
    const [period, setPeriod] = useState<PeriodType>("all");

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/volunteer/leaderboard?metric=${metric}&period=${period}&limit=100`
            );
            if (!response.ok) throw new Error("Failed to fetch leaderboard");
            const data = await response.json();
            setLeaderboard(data.leaderboard || []);
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
            toast.error("Failed to load leaderboard");
        } finally {
            setLoading(false);
        }
    }, [metric, period]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const getMedalIcon = (rank: number) => {
        if (rank === 1) return <span className="text-2xl">🥇</span>;
        if (rank === 2) return <span className="text-2xl">🥈</span>;
        if (rank === 3) return <span className="text-2xl">🥉</span>;
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    };

    const getPeriodLabel = () => {
        switch (period) {
            case "week": return "This Week";
            case "month": return "This Month";
            default: return "All Time";
        }
    };

    const renderLeaderboardTable = (entries: LeaderboardEntry[], metricKey: keyof LeaderboardEntry, metricLabel: string) => {
        if (loading) {
            return <div className="text-center py-8 text-muted-foreground">Loading leaderboard...</div>;
        }

        if (entries.length === 0) {
            return <div className="text-center py-8 text-muted-foreground">No volunteers yet</div>;
        }

        return (
            <div className="space-y-2">
                {entries.map((entry) => (
                    <div
                        key={entry.id}
                        className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${entry.rank <= 3
                            ? "bg-gradient-to-r from-primary/5 to-transparent border-primary/30 shadow-sm"
                            : "bg-card hover:bg-accent/50"
                            }`}
                    >
                        <div className="w-12 flex items-center justify-center">
                            {getMedalIcon(entry.rank)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{entry.name}</p>
                            <p className="text-xs text-muted-foreground">{entry.volunteer_id}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                                {typeof entry[metricKey] === 'number'
                                    ? metricKey.includes('commission') || metricKey.includes('score')
                                        ? `₹${Math.round(entry[metricKey] as number)}`
                                        : entry[metricKey]
                                    : '0'}
                            </p>
                            <p className="text-xs text-muted-foreground">{metricLabel}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Card className="rounded-3xl">
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        Leaderboard - {getPeriodLabel()}
                    </CardTitle>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPeriod("all")}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${period === "all"
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                        >
                            All Time
                        </button>
                        <button
                            onClick={() => setPeriod("month")}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${period === "month"
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => setPeriod("week")}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${period === "week"
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                        >
                            This Week
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={metric} onValueChange={(value: string) => setMetric(value as MetricType)}>
                    <TabsList className="grid w-full grid-cols-4 mb-6">
                        <TabsTrigger value="overall" className="flex items-center gap-1">
                            <Trophy className="h-4 w-4" />
                            <span className="hidden sm:inline">Overall</span>
                        </TabsTrigger>
                        <TabsTrigger value="referral" className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            <span className="hidden sm:inline">Referrals</span>
                        </TabsTrigger>
                        <TabsTrigger value="delivery" className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            <span className="hidden sm:inline">Deliveries</span>
                        </TabsTrigger>
                        <TabsTrigger value="revenue" className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="hidden sm:inline">Revenue</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overall">
                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                Overall Performance Score
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                Composite score based on referrals (10 pts/bottle) + deliveries (50 pts/delivery) + total commission (0.5 pts/₹)
                            </p>
                        </div>
                        {renderLeaderboardTable(leaderboard, "overall_score", "Score")}
                    </TabsContent>

                    <TabsContent value="referral">
                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                Referral Leaders
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                Ranked by total bottles from referrals
                            </p>
                        </div>
                        {renderLeaderboardTable(leaderboard, "referred_bottles", "Bottles")}
                    </TabsContent>

                    <TabsContent value="delivery">
                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                Delivery Champions
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                Ranked by successful deliveries completed
                            </p>
                        </div>
                        {renderLeaderboardTable(leaderboard, "delivered_orders", "Deliveries")}
                    </TabsContent>

                    <TabsContent value="revenue">
                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                Revenue Generators
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                Ranked by total commission earned (referral + delivery)
                            </p>
                        </div>
                        {renderLeaderboardTable(leaderboard, "total_commission", "Commission")}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
