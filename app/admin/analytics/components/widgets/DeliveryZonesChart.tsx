"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer } from "../shared/ChartContainer";

interface DeliveryZonesChartProps {
    data: Array<{
        zoneName: string;
        deliveries: number;
        successRate: number;
    }>;
}

export function DeliveryZonesChart({ data }: DeliveryZonesChartProps) {
    return (
        <ChartContainer
            title="Deliveries by Zone"
            description="Total deliveries and success rates per delivery zone"
        >
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                        dataKey="zoneName"
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                        }}
                        formatter={(value: number | undefined, name: string | undefined) => {
                            if (name === 'successRate') return value ? `${value}%` : '0%';
                            return value || 0;
                        }}
                    />
                    <Legend />
                    <Bar
                        dataKey="deliveries"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                        name="Total Deliveries"
                    />
                    <Bar
                        dataKey="successRate"
                        fill="#10b981"
                        radius={[8, 8, 0, 0]}
                        name="Success Rate (%)"
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
