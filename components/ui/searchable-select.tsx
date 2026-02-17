"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableOption {
    value: string;
    label: string;
    subLabel?: string;
    original?: any;
}

interface SearchableSelectProps {
    options: (string | SearchableOption)[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
    disabled?: boolean;
    onCustomSearch?: (query: string) => void;
    isSearching?: boolean;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyMessage = "No results found.",
    className,
    disabled = false,
    onCustomSearch,
    isSearching = false,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    // Normalize options to object format
    const normalizedOptions: SearchableOption[] = React.useMemo(() => {
        return options.map((option) => {
            if (typeof option === "string") {
                return { value: option, label: option };
            }
            return option;
        });
    }, [options]);

    // Find selected option object
    const selectedOption = normalizedOptions.find(
        (option) => option.value === value || option.label === value
    );

    // Custom filter function to search in both label and subLabel
    const filterFunction = (value: string, search: string) => {
        // If external search is handled, we might want to bypass local filtering
        // OR rely on parent to filter options.
        // For now, keeping local filter as well.
        const option = normalizedOptions.find((opt) => opt.value === value);
        if (!option) return 0;

        const searchLower = search.toLowerCase();
        const labelMatch = option.label.toLowerCase().includes(searchLower);
        const subLabelMatch = option.subLabel?.toLowerCase().includes(searchLower);

        return labelMatch || subLabelMatch ? 1 : 0;
    };

    const handleSearch = (val: string) => {
        setSearchValue(val);
        if (onCustomSearch) {
            onCustomSearch(val);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                    disabled={disabled}
                >
                    {selectedOption ? (
                        <div className="flex flex-col items-start truncate text-left">
                            <span className="truncate">{selectedOption.label}</span>
                            {selectedOption.subLabel && (
                                <span className="text-xs text-muted-foreground truncate">
                                    {selectedOption.subLabel}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command filter={onCustomSearch ? undefined : filterFunction} shouldFilter={!onCustomSearch}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onValueChange={handleSearch}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {isSearching ? "Searching..." : emptyMessage}
                        </CommandEmpty>
                        <CommandGroup>
                            {normalizedOptions.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={(currentValue) => {
                                        // We want to return the option's value
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    keywords={[option.label, option.subLabel || ""]}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{option.label}</span>
                                        {option.subLabel && (
                                            <span className="text-xs text-muted-foreground">
                                                {option.subLabel}
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
