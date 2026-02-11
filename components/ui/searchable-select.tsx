"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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

interface SearchableSelectProps {
    options: string[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    className?: string;
    onInputChange?: (value: string) => void; // NEW: Callback for search input changes
    isSearching?: boolean; // NEW: Show loading state
    onCustomSearch?: (query: string) => void; // NEW: Trigger custom search (e.g., API)
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyMessage = "No results found.",
    disabled = false,
    className,
    onInputChange,
    isSearching = false,
    onCustomSearch,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");

    // Filter options based on input for manual typing support
    const filteredOptions = React.useMemo(() => {
        if (!inputValue) return options;
        return options.filter((option) =>
            option.toLowerCase().includes(inputValue.toLowerCase())
        );
    }, [options, inputValue]);

    const handleSelect = (currentValue: string) => {
        onChange(currentValue);
        setOpen(false);
        setInputValue("");
    };

    const handleInputChange = (newValue: string) => {
        setInputValue(newValue);
        if (onInputChange) {
            onInputChange(newValue);
        }
        // Trigger custom search if provided and input is long enough
        if (onCustomSearch && newValue.length >= 3 && filteredOptions.length === 0) {
            onCustomSearch(newValue);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
                >
                    {value || placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        onValueChange={handleInputChange}
                    />
                    <CommandList>
                        {isSearching ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                Searching...
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>{emptyMessage}</CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-y-auto" data-lenis-prevent>
                                    {filteredOptions.length > 0 ? (
                                        filteredOptions.map((option) => (
                                            <CommandItem
                                                key={option}
                                                value={option}
                                                onSelect={() => handleSelect(option)}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        value === option ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {option}
                                            </CommandItem>
                                        ))
                                    ) : null}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
