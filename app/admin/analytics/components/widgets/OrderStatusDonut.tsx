"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartContainer } from "../shared/ChartContainer";

interface OrderStatusDonutProps {
    data: {
        pending: number;
        confirmed: number;
        delivered: number;
        cancelled: number;
    };
}

const COLORS = {
    pending: '#3b82f6',    // blue
    confirmed: '#f59e0b', // amber
    delivered: '#10b981',  // green
    cancelled: '#ef4444',  // red
};

export function OrderStatusDonut({ data }: OrderStatusDonutProps) {
    const chartData = [
        { name: 'Pending', value: data.pending, color: COLORS.pending },
        { name: 'Confirmed', value: data.confirmed, color: COLORS.confirmed },
        { name: 'Delivered', value: data.delivered, color: COLORS.delivered },
        { name: 'Cancelled', value: data.cancelled, color: COLORS.cancelled },
    ].filter(item => item.value > 0); // Only show non-zero values

    const total = data.pending + data.confirmed + data.delivered + data.cancelled;

    return (
        <ChartContainer
            title="Order Status Distribution"
            description={`Total: ${total} orders`}
        >
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                        }}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
