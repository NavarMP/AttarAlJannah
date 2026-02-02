"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer } from "../shared/ChartContainer";

interface RevenueByZoneChartProps {
    data: Array<{
        zoneName: string;
        grossRevenue: number;
        netProfit: number;
    }>;
}

export function RevenueByZoneChart({ data }: RevenueByZoneChartProps) {
    return (
        <ChartContainer
            title="Revenue by Zone"
            description="Gross revenue and net profit per delivery zone"
        >
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                        type="number"
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                        type="category"
                        dataKey="zoneName"
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        width={100}
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
                    <Bar
                        dataKey="grossRevenue"
                        fill="#3b82f6"
                        radius={[0, 8, 8, 0]}
                        name="Gross Revenue (₹313/bottle)"
                    />
                    <Bar
                        dataKey="netProfit"
                        fill="#10b981"
                        radius={[0, 8, 8, 0]}
                        name="Net Profit (₹200/bottle)"
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
