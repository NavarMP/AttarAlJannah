"use client";

import { useTranslation } from "@/lib/i18n/translations";
import { Languages } from "lucide-react";

export function LanguageToggle() {
    const { language, toggleLanguage } = useTranslation();

    return (
        <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-background/80 backdrop-blur-sm hover:bg-accent/60 transition-all text-sm font-medium shadow-sm select-none"
            aria-label={language === "en" ? "Switch to Malayalam" : "Switch to English"}
        >
            <Languages className="w-4 h-4 text-muted-foreground" />
            <span className={`transition-opacity ${language === "en" ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                EN
            </span>
            <span className="text-muted-foreground/40">|</span>
            <span className={`transition-opacity ${language === "ml" ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                മല
            </span>
        </button>
    );
}
