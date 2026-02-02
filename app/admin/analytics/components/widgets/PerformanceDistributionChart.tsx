"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer } from "../shared/ChartContainer";

interface PerformanceDistributionChartProps {
    data: Array<{
        range: string;
        count: number;
    }>;
}

export function PerformanceDistributionChart({ data }: PerformanceDistributionChartProps) {
    return (
        <ChartContainer
            title="Volunteer Performance Distribution"
            description="Number of volunteers by delivery count ranges"
        >
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                        dataKey="range"
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{ value: 'Bottles Delivered', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{ value: 'Number of Volunteers', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                        }}
                        formatter={(value: number | undefined) => value ? [`${value} volunteers`, 'Count'] : ['0 volunteers', 'Count']}
                    />
                    <Bar
                        dataKey="count"
                        fill="#8b5cf6"
                        radius={[8, 8, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
