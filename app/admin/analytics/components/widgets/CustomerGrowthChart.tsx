"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer } from "../shared/ChartContainer";

interface CustomerGrowthChartProps {
    data: Array<{
        date: string;
        newCustomers: number;
        returningCustomers: number;
    }>;
}

export function CustomerGrowthChart({ data }: CustomerGrowthChartProps) {
    // Format data for display
    const formattedData = data.map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    }));

    return (
        <ChartContainer
            title="Customer Growth"
            description="New vs. returning customers over time"
        >
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                        dataKey="date"
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
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="newCustomers"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="New Customers"
                        dot={{ fill: '#3b82f6' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="returningCustomers"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Returning Customers"
                        dot={{ fill: '#10b981' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
