"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutocompleteSuggestion {
    formatted: string;
    city?: string;
    state?: string;
    postcode?: string;
}

interface AutocompleteInputProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    suggestions: AutocompleteSuggestion[];
    loading: boolean;
    placeholder?: string;
    className?: string;
    onSelect?: (suggestion: AutocompleteSuggestion) => void;
    maxLength?: number;
}

export function AutocompleteInput({
    id,
    value,
    onChange,
    suggestions,
    loading,
    placeholder,
    className,
    onSelect,
    maxLength,
}: AutocompleteInputProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Show suggestions when we have them and input is focused
    useEffect(() => {
        if (suggestions.length > 0 && document.activeElement === inputRef.current) {
            setShowSuggestions(true);
        } else if (suggestions.length === 0) {
            setShowSuggestions(false);
        }
    }, [suggestions]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleSelect(suggestions[selectedIndex]);
                }
                break;
            case "Escape":
                e.preventDefault();
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
        }
    };

    const handleSelect = (suggestion: AutocompleteSuggestion) => {
        onChange(suggestion.formatted);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        if (onSelect) {
            onSelect(suggestion);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Input
                    ref={inputRef}
                    id={id}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                    placeholder={placeholder}
                    className={cn(loading && "pr-10", className)}
                    maxLength={maxLength}
                    autoComplete="off"
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelect(suggestion)}
                            className={cn(
                                "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors",
                                "border-b last:border-b-0",
                                selectedIndex === index && "bg-accent"
                            )}
                        >
                            <div className="font-medium">{suggestion.formatted}</div>
                            {(suggestion.city || suggestion.state) && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {[suggestion.city, suggestion.state].filter(Boolean).join(", ")}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
