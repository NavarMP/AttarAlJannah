"use client";

import { useTranslation } from "@/lib/i18n/translations";
import { Languages } from "lucide-react";

export function LanguageToggle() {
    const { language, toggleLanguage } = useTranslation();

    return (
        <button
            type="button"
            onClick={toggleLanguage}
            className="relative flex items-center p-1 h-[34px] rounded-full border border-border/60 bg-background/80 backdrop-blur-sm shadow-sm select-none cursor-pointer hover:bg-accent/40 transition-colors"
            aria-label={language === "en" ? "Switch to Malayalam" : "Switch to English"}
        >
            <div
                className="absolute top-1 bottom-1 w-[38px] bg-primary/20 dark:bg-primary/30 rounded-full transition-transform duration-300 ease-in-out"
                style={{
                    transform: language === "en" ? "translateX(0)" : "translateX(100%)",
                }}
            />
            <div className={`relative z-10 w-[38px] text-center text-sm transition-colors duration-300 ${language === "en" ? "text-primary font-bold" : "text-muted-foreground font-medium"}`}>
                EN
            </div>
            <div className={`relative z-10 w-[38px] text-center text-[15px] pt-[1px] transition-colors duration-300 ${language === "ml" ? "text-primary font-bold" : "text-muted-foreground font-medium"}`}>
                മല
            </div>
        </button>
    );
}
