"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, Trophy, Plus, DollarSign, Share2 } from "lucide-react";
import { toast } from "sonner";
import { calculateCommission } from "@/lib/utils/commission-utils";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { DeliveryDashboard } from "@/components/volunteer/delivery-dashboard";
import { EnhancedLeaderboard } from "@/components/volunteer/enhanced-leaderboard";

interface DashboardStats {
    confirmedBottles: number;
    confirmedOrders: number;
    goal: number;
    pendingBottles: number;
    pendingOrders: number;
    totalRevenue: number;
}

export default function VolunteerDashboardPage() {
    const router = useRouter();
    const [volunteerName, setVolunteerName] = useState("");
    const [volunteerId, setVolunteerId] = useState("");
    const [stats, setStats] = useState<DashboardStats>({
        confirmedBottles: 0,
        confirmedOrders: 0,
        goal: 20,
        pendingBottles: 0,
        pendingOrders: 0,
        totalRevenue: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async (id: string) => {
        try {
            console.log("Fetching stats for ID:", id);
            const response = await fetch(`/api/volunteer/progress?volunteerId=${id}`, { cache: "no-store" });
            if (!response.ok) throw new Error("Failed to fetch stats");

            const data = await response.json();
            console.log("Received stats:", data);
            setStats(data);
        } catch (error) {
            toast.error("Failed to load dashboard data");
            console.error("Stats fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchAndStoreUuid = useCallback(async (volunteerId: string) => {
        try {
            // Fetch volunteer details to get UUID
            const response = await fetch(`/api/volunteer/auth?volunteerId=${volunteerId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.uuid) {
                    console.log("Fetched UUID from API:", data.uuid);
                    localStorage.setItem("volunteerUuid", data.uuid);
                    fetchStats(data.uuid);
                    return;
                }
            }
            // Fallback: try with readable ID (might not work but better than nothing)
            console.warn("Could not fetch UUID, falling back to readable ID:", volunteerId);
            fetchStats(volunteerId);
        } catch (error) {
            console.error("Error fetching UUID:", error);
            fetchStats(volunteerId);
        }
    }, [fetchStats]);

    useEffect(() => {
        // Check if logged in
        const id = localStorage.getItem("volunteerId");
        const uuid = localStorage.getItem("volunteerUuid");
        const name = localStorage.getItem("volunteerName");

        if (!id || !name) {
            router.push("/volunteer/login");
            return;
        }

        setVolunteerId(id);
        setVolunteerName(name);

        // If UUID is missing, fetch it from the API and store it
        if (!uuid) {
            console.log("UUID missing, fetching from API for volunteer:", id);
            fetchAndStoreUuid(id);
        } else {
            console.log("Using stored UUID:", uuid);
            fetchStats(uuid);
        }
    }, [router, fetchAndStoreUuid, fetchStats]);

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
                <div>
                    <h1 className="text-4xl font-bold text-foreground">
                        Welcome back, {volunteerName}!
                    </h1>
                    <div className="flex justify-between items-start mt-2">
                        <p className="text-muted-foreground">
                            Track your progress and manage your orders
                        </p>
                        <div className="flex gap-2">
                            {/* We need to ensure logic that links Volunteer ID to Notifications exists.
                                Currently relying on 'volunteerUuid' in localStorage which the Provider now reads.
                            */}
                            {/* <NotificationBell /> is not imported. Needs import. And needs to be inside Provider. 
                                Root layout likely has Provider.
                            */}
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="rounded-xl"
                            >
                                <span className="mr-2">Logout</span>
                            </Button>
                        </div>
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
                <div className="grid md:grid-cols-4 gap-6">
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Package className="w-5 h-5 text-blue-500" />
                                Confirmed Orders
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-foreground">
                                {stats.confirmedOrders}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Total orders confirmed
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Package className="w-5 h-5 text-orange-500" />
                                Pending Orders
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-foreground">
                                {stats.pendingOrders}
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
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <DollarSign className="w-5 h-5 text-gold-500" />
                                Your Commission
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-gold-500">
                                ₹{calculateCommission(stats.confirmedBottles, stats.goal).toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {stats.confirmedBottles > stats.goal
                                    ? `₹10 per bottle after ${stats.goal} (${stats.confirmedBottles - stats.goal} eligible)`
                                    : `Sales after ${stats.goal} bottles earn ₹10 each`
                                }
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

                    <Card className="glass border-primary-300 dark:border-primary-700">
                        <CardContent className="pt-6">
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full h-full min-h-[120px] border-2 border-primary-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 flex flex-col gap-2 rounded-xl"
                                onClick={() => {
                                    const link = `${window.location.origin}/order?ref=${volunteerId}`;
                                    navigator.clipboard.writeText(link);
                                    toast.success("Referral link copied to clipboard!");
                                }}
                            >
                                <Share2 className="w-8 h-8 text-primary-500" />
                                <span className="text-lg font-semibold text-primary-500">Share Link</span>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Delivery Management Section */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Delivery Management</h2>
                    <DeliveryDashboard volunteerId={volunteerId} />
                </div>

                {/* Enhanced Leaderboard */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Volunteer Rankings</h2>
                    <EnhancedLeaderboard />
                </div>
            </div>
        </main>
    );
}
