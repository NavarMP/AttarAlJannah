"use client";

import { useState, useEffect } from "react";
import { Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export interface MultiSelectOption {
    value: string;
    label: string;
}

interface MultiSelectFilterProps {
    options: MultiSelectOption[];
    selected: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    triggerLabel?: string;
}

export function MultiSelectFilter({
    options,
    selected,
    onChange,
    placeholder = "Select...",
    triggerLabel
}: MultiSelectFilterProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(v => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    const displayLabel = selected.length === 0
        ? placeholder
        : selected.length === 1
        ? options.find(o => o.value === selected[0])?.label || placeholder
        : `${selected.length} selected`;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={`w-full justify-between ${selected.length > 0 ? "border-primary" : ""}`}
                >
                    <span className="truncate">{triggerLabel || displayLabel}</span>
                    {selected.length > 0 ? (
                        <X className="h-3 w-3 ml-1" onClick={handleClear} />
                    ) : (
                        <span className="text-muted-foreground">▼</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
                <div className="p-2 border-b">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 pl-7"
                        />
                    </div>
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                    {filteredOptions.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                            No options found
                        </div>
                    ) : (
                        filteredOptions.map((opt) => (
                            <div
                                key={opt.value}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent"
                                onClick={() => handleSelect(opt.value)}
                            >
                                <Checkbox
                                    checked={selected.includes(opt.value)}
                                    onCheckedChange={() => handleSelect(opt.value)}
                                />
                                <span className="text-sm">{opt.label}</span>
                            </div>
                        ))
                    )}
                </div>
                {selected.length > 0 && (
                    <div className="p-2 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => onChange([])}
                        >
                            Clear selection
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
