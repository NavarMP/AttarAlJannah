"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, HelpCircle, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/translations";

export function StartupPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const { language, toggleLanguage } = useTranslation();

    useEffect(() => {
        // Show after a brief delay
        const showTimer = setTimeout(() => {
            setIsVisible(true);
        }, 800);

        // Auto hide after 5 seconds of being shown
        const hideTimer = setTimeout(() => {
            handleClose();
        }, 5800);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        // Wait for the minimize animation to finish before unmounting
        setTimeout(() => {
            setIsVisible(false);
        }, 500);
    };

    if (!isVisible) return null;

    return (
        <div
            className={`fixed z-50 transition-all duration-500 ease-in-out ${isClosing
                ? "opacity-0 scale-50 pointer-events-none"
                : "opacity-100 scale-100"
                }`}
            style={{
                // Initial positioning - centered top a bit below header
                top: "5rem",
                left: "50%",
                transform: `translateX(-50%) ${isClosing ? "scale(0.1) translate(150vw, -100vh)" : "scale(1)"}`,
                transformOrigin: "top right"
            }}
        >
            <div className="relative bg-background/95 backdrop-blur-md border border-primary/30 shadow-2xl p-4 rounded-2xl w-80 max-w-[90vw] overflow-hidden group">
                {/* Decorative background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent -z-10" />
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Sparkles className="w-16 h-16 text-primary" />
                </div>

                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                        <Sparkles className="w-4 h-4 text-gold-500" />
                        Did you know?
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full -mt-1 -mr-1 hover:bg-black/5 dark:hover:bg-white/10"
                        onClick={handleClose}
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {language === "ml"
                        ? <>നിങ്ങൾക്ക് എളുപ്പത്തിൽ ഭാഷ മാറ്റാം അല്ലെങ്കിൽ <strong>ക്യാഷ് പേയ്‌മെൻ്റുകൾക്കായി</strong> ഞങ്ങളുടെ വോളൻ്റിയർമാരെ ബന്ധപ്പെടാം!</>
                        : <>You can easily switch the language or reach out to our volunteers for <strong>Cash payments</strong>!</>
                    }
                </p>

                <div className="flex gap-2">
                    <div
                        className="flex-1 rounded-xl bg-primary/5 border border-primary/10 p-2 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => {
                            toggleLanguage();
                            handleClose();
                        }}
                    >
                        <Languages className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-medium text-center">Translate</span>
                    </div>
                    <div
                        className="flex-1 rounded-xl bg-green-500/5 border border-green-500/10 p-2 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-green-500/10 transition-colors"
                        onClick={() => {
                            document.getElementById("help-button-trigger")?.click();
                            handleClose();
                        }}
                    >
                        <HelpCircle className="w-4 h-4 text-green-600" />
                        <span className="text-[10px] font-medium text-center">Help / Cash</span>
                    </div>
                </div>

                {/* Progress bar indicator for auto-close */}
                {!isClosing && (
                    <div className="absolute bottom-0 left-0 h-0.5 bg-primary/20 w-full overflow-hidden">
                        <div className="h-full bg-primary animate-[shrink_5s_linear_forwards]" style={{ width: '100%' }} />
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}
