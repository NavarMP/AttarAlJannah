"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type DatePreset = "today" | "7d" | "30d" | "90d" | "ytd" | "custom";

interface DateRange {
    from: Date;
    to: Date;
}

interface DateRangeSelectorProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
    preset: DatePreset;
    onPresetChange: (preset: DatePreset) => void;
}

export function DateRangeSelector({
    value,
    onChange,
    preset,
    onPresetChange,
}: DateRangeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const presets: { label: string; value: DatePreset }[] = [
        { label: "Today", value: "today" },
        { label: "7 Days", value: "7d" },
        { label: "30 Days", value: "30d" },
        { label: "90 Days", value: "90d" },
        { label: "YTD", value: "ytd" },
        { label: "Custom", value: "custom" },
    ];

    const handlePresetClick = (newPreset: DatePreset) => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        let from = new Date();
        from.setHours(0, 0, 0, 0);

        switch (newPreset) {
            case "today":
                from = new Date(today);
                from.setHours(0, 0, 0, 0);
                break;
            case "7d":
                from.setDate(today.getDate() - 7);
                break;
            case "30d":
                from.setDate(today.getDate() - 30);
                break;
            case "90d":
                from.setDate(today.getDate() - 90);
                break;
            case "ytd":
                from = new Date(today.getFullYear(), 0, 1);
                break;
            case "custom":
                // Custom will be handled by calendar selection
                return;
        }

        onPresetChange(newPreset);
        onChange({ from, to: today });
    };

    return (
        <div className="flex items-center gap-2">
            {/* Preset Buttons */}
            <div className="flex gap-1">
                {presets.filter(p => p.value !== "custom").map((p) => (
                    <Button
                        key={p.value}
                        variant={preset === p.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetClick(p.value)}
                        className="rounded-xl"
                    >
                        {p.label}
                    </Button>
                ))}
            </div>

            {/* Custom Range Picker */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant={preset === "custom" ? "default" : "outline"}
                        size="sm"
                        className="rounded-xl"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {preset === "custom"
                            ? `${format(value.from, "MMM d")} - ${format(value.to, "MMM d")}`
                            : "Custom"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0">
                    <div className="p-4">
                        <div className="space-y-4">
                            <Calendar
                                mode="range"
                                selected={{ from: value.from, to: value.to }}
                                onSelect={(range) => {
                                    if (range?.from && range?.to) {
                                        onChange({ from: range.from, to: range.to });
                                        onPresetChange("custom");
                                        setIsOpen(false);
                                    }
                                }}
                                numberOfMonths={2}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
