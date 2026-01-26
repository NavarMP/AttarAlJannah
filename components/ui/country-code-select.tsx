"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Popular country codes (focusing on India and nearby countries)
export const COUNTRY_CODES = [
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+971", country: "UAE", flag: "🇦🇪" },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
    { code: "+974", country: "Qatar", flag: "🇶🇦" },
    { code: "+965", country: "Kuwait", flag: "🇰🇼" },
    { code: "+973", country: "Bahrain", flag: "🇧🇭" },
    { code: "+968", country: "Oman", flag: "🇴🇲" },
    { code: "+60", country: "Malaysia", flag: "🇲🇾" },
    { code: "+65", country: "Singapore", flag: "🇸🇬" },
    { code: "+92", country: "Pakistan", flag: "🇵🇰" },
    { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
    { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
];

interface CountryCodeSelectProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function CountryCodeSelect({ value, onChange, disabled }: CountryCodeSelectProps) {
    const [open, setOpen] = useState(false);

    const selectedCountry = COUNTRY_CODES.find((country) => country.code === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-[120px] justify-between rounded-xl"
                >
                    <span className="flex items-center gap-1">
                        <span>{selectedCountry?.flag}</span>
                        <span className="font-medium">{value}</span>
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-auto">
                        {COUNTRY_CODES.map((country) => (
                            <CommandItem
                                key={country.code}
                                value={`${country.code} ${country.country}`}
                                onSelect={() => {
                                    onChange(country.code);
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === country.code ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <span className="mr-2">{country.flag}</span>
                                <span className="flex-1">{country.country}</span>
                                <span className="text-muted-foreground text-sm">{country.code}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
