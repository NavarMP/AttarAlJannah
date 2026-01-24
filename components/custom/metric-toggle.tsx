"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Package, Layers } from "lucide-react";

interface MetricToggleProps {
    onToggle?: (showBottles: boolean) => void;
    defaultShowBottles?: boolean;
    className?: string;
}

export function MetricToggle({ onToggle, defaultShowBottles = true, className = "" }: MetricToggleProps) {
    const [showBottles, setShowBottles] = useState(defaultShowBottles);

    const handleToggle = () => {
        const newValue = !showBottles;
        setShowBottles(newValue);
        onToggle?.(newValue);
    };

    return (
        <div className={`inline-flex items-center gap-2 p-1 bg-muted rounded-xl ${className}`}>
            <Button
                variant={showBottles ? "default" : "ghost"}
                size="sm"
                onClick={handleToggle}
                className="rounded-lg"
            >
                <Layers className="w-4 h-4 mr-1" />
                Bottles
            </Button>
            <Button
                variant={!showBottles ? "default" : "ghost"}
                size="sm"
                onClick={handleToggle}
                className="rounded-lg"
            >
                <Package className="w-4 h-4 mr-1" />
                Orders
            </Button>
        </div>
    );
}

interface MetricDisplayProps {
    bottles: number;
    orders: number;
    showBottles?: boolean;
    label?: string;
}

export function MetricDisplay({ bottles, orders, showBottles = true, label }: MetricDisplayProps) {
    const value = showBottles ? bottles : orders;
    const unit = showBottles ? 'Bottle' : 'Order';
    const plural = value !== 1 ? 's' : '';

    return (
        <div>
            {label && <p className="text-sm text-muted-foreground mb-1">{label}</p>}
            <p className="text-3xl font-bold text-foreground">
                {value}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
                {unit}{plural}
            </p>
        </div>
    );
}
