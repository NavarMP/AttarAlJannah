"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, Phone, MessageCircle, CheckCircle2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/translations";
import Link from "next/link";

export function HelpButton() {
    const [open, setOpen] = useState(false);
    const { t, language } = useTranslation();

    const whatsappMessage = language === "ml"
        ? "ഹായ്, എനിക്ക് അത്തർ അൽ-ജന്ന ഓർഡർ ചെയ്യാൻ സഹായം വേണം.%0A%0Aപേര്: %0Aവിലാസം: %0A%0Aഞാൻ പേയ്‌മെന്റ് സ്ക്രീൻഷോട്ട് അയയ്ക്കാം."
        : "Hi, I need help placing an order for Attar al-Jannah.%0A%0AName: %0AAddress: %0A%0AI will send the payment screenshot.";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    id="help-button-trigger"
                    variant="outline"
                    className="h-[34px] gap-2 rounded-full border-border/60 bg-background/80 backdrop-blur-sm hover:bg-accent/60 shadow-sm px-3"
                >
                    <HelpCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{t("help.needHelp", "Need Help")}?</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] max-w-sm rounded-3xl p-0 overflow-hidden border-primary/30 gap-0">
                <div className="bg-gradient-to-r from-green-500/10 to-primary/10 px-6 py-4 border-b border-border/40">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-center">
                            {t("help.title", "🤝 Need Help Placing an Order?")}
                        </DialogTitle>
                    </DialogHeader>
                </div>
                <div className="p-6 space-y-5">
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-primary">
                        <p className="text-sm font-medium leading-relaxed">
                            {language === "ml"
                                ? "ബാങ്ക് അക്കൗണ്ടിൽ പണമില്ലെങ്കിലും നിങ്ങളുടെ കയ്യിൽ പണമുണ്ടെങ്കിൽ, വിഷമിക്കേണ്ട! ഞങ്ങളുടെ വോളണ്ടിയർമാരെ ബന്ധപ്പെടുക, അവർ നിങ്ങളെ സഹായിക്കും."
                                : "If you have cash on hand, but not in a bank account, don't worry! You can reach out to our volunteers for assistance."}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground text-center">
                            {t("help.description", "Or send us these details on WhatsApp:")}
                        </p>
                        {/* Checklist */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span>{t("help.item.name", "Your Name")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span>{t("help.item.address", "Full Address")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span>{t("help.item.screenshot", "Payment Screenshot")}</span>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-center text-primary mt-2">
                            {t("help.teamMessage", "Our team will create the order for you!")}
                        </p>
                    </div>
                    {/* Action buttons */}
                    <div className="flex flex-col gap-3 pt-2">
                        <Link
                            href={`https://wa.me/919072358001?text=${whatsappMessage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors w-full"
                        >
                            <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                {t("help.whatsapp", "Send on WhatsApp")}
                            </span>
                        </Link>
                        <Link
                            href="tel:+919072358001"
                            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors w-full"
                        >
                            <Phone className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{t("help.call", "Call")} +91 907 235 8001</span>
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
