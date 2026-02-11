import { useState, useEffect, useCallback, useRef } from "react";

interface AutocompleteSuggestion {
    formatted: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
}

interface UseAddressAutocompleteProps {
    query: string;
    enabled?: boolean;
    minLength?: number;
    debounceMs?: number;
}

export function useAddressAutocomplete({
    query,
    enabled = true,
    minLength = 3,
    debounceMs = 500,
}: UseAddressAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchSuggestions = useCallback(async (searchQuery: string) => {
        // Cancel previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        if (searchQuery.length < minLength) {
            setSuggestions([]);
            return;
        }

        const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
        if (!apiKey) {
            setError("Geoapify API key not configured");
            return;
        }

        setLoading(true);
        setError("");

        // Create new abort controller for this request
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const response = await fetch(
                `https://api.geoapify.com/v1/geocode/autocomplete?` +
                `text=${encodeURIComponent(searchQuery)}&` +
                `filter=countrycode:in&` +
                `limit=5&` +
                `apiKey=${apiKey}`,
                { signal: abortController.signal }
            );

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            const formattedSuggestions: AutocompleteSuggestion[] = (data.features || []).map((feature: any) => ({
                formatted: feature.properties.formatted,
                city: feature.properties.city,
                state: feature.properties.state,
                postcode: feature.properties.postcode,
                country: feature.properties.country,
            }));

            setSuggestions(formattedSuggestions);
        } catch (err: any) {
            if (err.name === 'AbortError') {
                // Request was cancelled, ignore
                return;
            }
            console.error("Autocomplete error:", err);
            setError("Failed to fetch suggestions");
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, [minLength]);

    useEffect(() => {
        if (!enabled) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(() => {
            fetchSuggestions(query);
        }, debounceMs);

        return () => {
            clearTimeout(timer);
            // Cancel any pending request when query changes
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [query, enabled, debounceMs, fetchSuggestions]);

    return { suggestions, loading, error };
}
