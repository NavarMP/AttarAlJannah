"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, Trophy, Plus, Share } from "lucide-react";
import { toast } from "sonner";

interface DashboardStats {
    confirmedBottles: number;
    goal: number;
    pendingBottles: number;
    totalRevenue: number;
}

export default function VolunteerDashboardPage() {
    const router = useRouter();
    const [volunteerName, setVolunteerName] = useState("");
    const [volunteerId, setVolunteerId] = useState("");
    const [stats, setStats] = useState<DashboardStats>({
        confirmedBottles: 0,
        goal: 20,
        pendingBottles: 0,
        totalRevenue: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if logged in
        const id = localStorage.getItem("volunteerId");
        const name = localStorage.getItem("volunteerName");

        if (!id || !name) {
            router.push("/volunteer/login");
            return;
        }

        setVolunteerId(id);
        setVolunteerName(name);
        fetchStats(id);
    }, [router]);

    const fetchStats = async (id: string) => {
        try {
            const response = await fetch(`/api/volunteer/progress?volunteerId=${id}`);
            if (!response.ok) throw new Error("Failed to fetch stats");

            const data = await response.json();
            setStats(data);
        } catch (error) {
            toast.error("Failed to load dashboard data");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("volunteerId");
        localStorage.removeItem("volunteerName");
        router.push("/volunteer/login");
    };

    const progressPercentage = (stats.confirmedBottles / stats.goal) * 100;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground">
                            Welcome back, {volunteerName}!
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Track your progress and manage your orders
                        </p>
                    </div>
                </div>
                {/* Progress Card */}
                <Card className="glass-strong border-emerald-300 dark:border-emerald-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-gold-500" />
                            Challenge Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-2xl font-bold text-foreground">
                                    {stats.confirmedBottles} / {stats.goal} Bottles
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {Math.round(progressPercentage)}% Complete
                                </span>
                            </div>
                            <Progress value={progressPercentage} className="h-4" />
                        </div>

                        {stats.confirmedBottles >= stats.goal ? (
                            <div className="p-4 bg-gradient-to-r from-gold-500/20 to-emerald-500/20 rounded-lg border border-gold-300 dark:border-gold-700">
                                <p className="text-lg font-bold text-center">
                                    🎉 Goal Achieved! Keep going for more bottles! 🚀
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Keep going! {stats.goal - stats.confirmedBottles} more bottles to reach your goal.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Package className="w-5 h-5 text-blue-500" />
                                Pending Bottles
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-foreground">
                                {stats.pendingBottles}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Awaiting admin verification
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                Total Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-foreground">
                                ₹{stats.totalRevenue.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                From all your sales
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass border-gold-300 dark:border-gold-700">
                        <CardContent className="pt-6">
                            <Button
                                size="lg"
                                className="w-full h-full min-h-[120px] bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-700 hover:to-gold-600 flex flex-col gap-2"
                                onClick={() => router.push(`/order?ref=${volunteerId}`)}
                            >
                                <Plus className="w-8 h-8" />
                                <span className="text-lg font-semibold">Place New Order</span>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
