"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer } from "../shared/ChartContainer";

interface RevenueTimelineProps {
    data: Array<{
        date: string;
        grossRevenue: number;
        netProfit: number;
        manufacturerCost: number;
    }>;
}

export function RevenueTimeline({ data }: RevenueTimelineProps) {
    // Format data for display
    const formattedData = data.map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    }));

    return (
        <ChartContainer
            title="Revenue Timeline"
            description="Gross revenue vs. net profit (after COGS)"
        >
            <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={formattedData}>
                    <defs>
                        <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                        dataKey="date"
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                        }}
                        formatter={(value: number | undefined) => value ? `₹${value.toLocaleString()}` : '₹0'}
                    />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey="grossRevenue"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#colorGross)"
                        name="Gross Revenue (₹313/bottle)"
                    />
                    <Area
                        type="monotone"
                        dataKey="netProfit"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#colorNet)"
                        name="Net Profit (₹200/bottle)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
