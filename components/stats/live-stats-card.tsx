"use client";

import { useLiveStats } from "@/hooks/use-live-stats";
import { TrendingUp, Star } from "lucide-react";
import { useEffect, useState } from "react";

export function LiveStatsCard() {
    const { stats, isLoading } = useLiveStats();
    const [displayOrders, setDisplayOrders] = useState(0);
    const [displayRating, setDisplayRating] = useState(0);

    // Count-up animation for orders
    useEffect(() => {
        if (!stats) return;

        const targetOrders = stats.totalOrders;
        const duration = 1000; // 1 second animation
        const steps = 30;
        const increment = targetOrders / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= targetOrders) {
                setDisplayOrders(targetOrders);
                clearInterval(timer);
            } else {
                setDisplayOrders(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stats?.totalOrders]);

    // Count-up animation for rating
    useEffect(() => {
        if (!stats) return;

        const targetRating = stats.averageRating;
        const duration = 1000;
        const steps = 30;
        const increment = targetRating / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= targetRating) {
                setDisplayRating(targetRating);
                clearInterval(timer);
            } else {
                setDisplayRating(current);
            }
        }, duration / steps);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stats?.averageRating]);

    if (isLoading && !stats) {
        return (
            <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-gold-500/10 border border-primary/20 backdrop-blur-sm">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-primary/20 rounded w-32 mx-auto"></div>
                    <div className="h-8 bg-primary/20 rounded w-40 mx-auto"></div>
                    <div className="h-8 bg-primary/20 rounded w-40 mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-6">
            {/* <h3 className="text-lg font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold-500">
                📊 Live Impact
            </h3> */}

            <div className="space-y-3">
                {/* Total Orders */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-primary/20">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">Orders Placed</span>
                    </div>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold-500">
                        {displayOrders.toLocaleString()}
                    </span>
                </div>

                {/* Average Rating */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-primary/20">
                    <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-gold-500 fill-gold-500" />
                        <span className="text-sm font-medium">Average Rating</span>
                    </div>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-500 to-primary">
                        {displayRating > 0 ? displayRating.toFixed(1) : "N/A"}
                    </span>
                </div>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
                Updates every 10 seconds
            </p>
        </div>
    );
}