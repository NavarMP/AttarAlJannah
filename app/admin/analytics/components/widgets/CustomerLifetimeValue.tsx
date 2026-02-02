"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer } from "../shared/ChartContainer";

interface CustomerLifetimeValueProps {
    data: Array<{
        range: string;
        count: number;
    }>;
}

export function CustomerLifetimeValue({ data }: CustomerLifetimeValueProps) {
    return (
        <ChartContainer
            title="Customer Lifetime Value Distribution"
            description="Customers grouped by total spending"
        >
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                        dataKey="range"
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{ value: 'Number of Customers', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                        }}
                        formatter={(value: number | undefined) => value ? [`${value} customers`, 'Count'] : ['0 customers', 'Count']}
                    />
                    <Bar
                        dataKey="count"
                        fill="#a855f7"
                        radius={[8, 8, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
