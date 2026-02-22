"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { ml } from "./ml";

type Language = "en" | "ml";

interface TranslationContextType {
    language: Language;
    toggleLanguage: () => void;
    t: (key: string, fallback?: string) => string;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

const STORAGE_KEY = "attar-order-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");

    // Restore language preference from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "ml") {
            setLanguage("ml");
        }
    }, []);

    const toggleLanguage = useCallback(() => {
        setLanguage((prev) => {
            const next = prev === "en" ? "ml" : "en";
            localStorage.setItem(STORAGE_KEY, next);
            return next;
        });
    }, []);

    const t = useCallback(
        (key: string, fallback?: string): string => {
            if (language === "en") return fallback || key;
            return ml[key] || fallback || key;
        },
        [language]
    );

    return (
        <TranslationContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        // Fallback when used outside provider — return English passthrough
        return {
            language: "en" as Language,
            toggleLanguage: () => { },
            t: (key: string, fallback?: string) => fallback || key,
        };
    }
    return context;
}
