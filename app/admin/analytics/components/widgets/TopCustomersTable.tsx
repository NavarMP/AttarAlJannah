"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer } from "../shared/ChartContainer";
import { Phone, ShoppingBag, Package } from "lucide-react";

interface TopCustomersTableProps {
    data: Array<{
        id: string;
        name: string;
        phone: string;
        orders: number;
        bottles: number;
        totalSpent: number;
        lastOrder: string;
    }>;
}

export function TopCustomersTable({ data }: TopCustomersTableProps) {
    return (
        <ChartContainer
            title="Top Customers"
            description="Ranked by total spending"
        >
            {data.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    No customer data available for this period
                </div>
            ) : (
                <div className="space-y-2">
                    {data.map((customer, index) => (
                        <Card key={customer.id} className="rounded-2xl">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                            #{index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">{customer.name}</p>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                                                <Phone className="w-3 h-3" />
                                                <span className="truncate">{customer.phone}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="text-center">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <ShoppingBag className="w-3 h-3" />
                                                <span>{customer.orders}</span>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Package className="w-3 h-3" />
                                                <span>{customer.bottles}</span>
                                            </div>
                                        </div>
                                        <Badge
                                            className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                                        >
                                            ₹{customer.totalSpent.toLocaleString()}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </ChartContainer>
    );
}
