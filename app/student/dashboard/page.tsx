"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, Trophy, Plus } from "lucide-react";
import { toast } from "sonner";

interface DashboardStats {
    verifiedSales: number;
    goal: number;
    pendingOrders: number;
    totalEarnings: number;
}

export default function StudentDashboardPage() {
    const router = useRouter();
    const [studentName, setStudentName] = useState("");
    const [studentId, setStudentId] = useState("");
    const [stats, setStats] = useState<DashboardStats>({
        verifiedSales: 0,
        goal: 20,
        pendingOrders: 0,
        totalEarnings: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if logged in
        const id = localStorage.getItem("studentId");
        const name = localStorage.getItem("studentName");

        if (!id || !name) {
            router.push("/student/login");
            return;
        }

        setStudentId(id);
        setStudentName(name);
        fetchStats(id);
    }, [router]);

    const fetchStats = async (id: string) => {
        try {
            const response = await fetch(`/api/student/progress?studentId=${id}`);
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
        localStorage.removeItem("studentId");
        localStorage.removeItem("studentName");
        router.push("/student/login");
    };

    const progressPercentage = (stats.verifiedSales / stats.goal) * 100;

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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground">
                            Welcome, {studentName}! 👋
                        </h1>
                        <p className="text-lg text-muted-foreground mt-2">
                            Track your sales progress and manage orders
                        </p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                        Logout
                    </Button>
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
                                    {stats.verifiedSales} / {stats.goal} Sales
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {Math.round(progressPercentage)}% Complete
                                </span>
                            </div>
                            <Progress value={progressPercentage} className="h-4" />
                        </div>

                        {stats.verifiedSales >= stats.goal ? (
                            <div className="p-4 bg-gradient-to-r from-gold-500/20 to-emerald-500/20 rounded-lg border border-gold-300 dark:border-gold-700">
                                <p className="text-lg font-bold text-center">
                                    🎉 Congratulations! You&apos;ve achieved your goal! 🎉
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Keep going! {stats.goal - stats.verifiedSales} more sales to reach your goal.
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
                                Total Earnings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-foreground">
                                ₹{stats.totalEarnings.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                From verified sales
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass border-gold-300 dark:border-gold-700">
                        <CardContent className="pt-6">
                            <Button
                                size="lg"
                                className="w-full h-full min-h-[120px] bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-700 hover:to-gold-600 flex flex-col gap-2"
                                onClick={() => router.push("/student/new-order")}
                            >
                                <Plus className="w-8 h-8" />
                                <span className="text-lg font-semibold">Enter New Order</span>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card className="glass-strong">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => router.push("/student/new-order")}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Customer Order
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => router.push("/student/orders")}
                        >
                            <Package className="mr-2 h-4 w-4" />
                            View All My Orders
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
