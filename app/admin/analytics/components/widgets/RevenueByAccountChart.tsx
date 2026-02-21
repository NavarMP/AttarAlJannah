"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer } from "../shared/ChartContainer";

interface RevenueByAccountChartProps {
    data: Array<{
        name: string;
        grossRevenue: number;
        netProfit: number;
        bottles: number;
    }>;
}

export function RevenueByAccountChart({ data }: RevenueByAccountChartProps) {
    return (
        <ChartContainer
            title="Revenue By Account (UPI)"
            description="Gross revenue and net profit per receiving UPI ID"
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
                        dataKey="name"
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        width={120}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                        }}
                        formatter={(value: number | undefined, name: string | undefined) => {
                            const safeName = name || '';
                            if (safeName === "Bottles Sold") return [`${value} bottles`];
                            return value ? [`₹${value.toLocaleString()}`, safeName] : ['₹0', safeName]
                        }}
                    />
                    <Legend />
                    <Bar
                        dataKey="grossRevenue"
                        fill="#8b5cf6"
                        radius={[0, 8, 8, 0]}
                        name="Gross Revenue"
                    />
                    <Bar
                        dataKey="netProfit"
                        fill="#f43f5e"
                        radius={[0, 8, 8, 0]}
                        name="Net Profit"
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
