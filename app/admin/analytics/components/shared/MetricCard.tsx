"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: "blue" | "green" | "purple" | "pink" | "amber" | "red";
    className?: string;
}

const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    pink: "text-pink-600",
    amber: "text-amber-600",
    red: "text-red-600",
};

const trendClasses = {
    positive: "text-green-600 bg-green-50",
    negative: "text-red-600 bg-red-50",
};

export function MetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "blue",
    className,
}: MetricCardProps) {
    return (
        <Card className={cn("rounded-3xl", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className={cn("h-5 w-5", colorClasses[color])} />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>

                <div className="flex items-center gap-2 mt-2">
                    {subtitle && (
                        <p className="text-sm text-muted-foreground">{subtitle}</p>
                    )}

                    {trend && (
                        <div
                            className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                trend.isPositive ? trendClasses.positive : trendClasses.negative
                            )}
                        >
                            {trend.isPositive ? "+" : ""}{trend.value}%
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
