"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ui/share-button";
import { Bell, Calendar, Clock } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";

export function Share() {
    const [reminderSet, setReminderSet] = useState(false);
    const [reminderLabel, setReminderLabel] = useState("");

    useEffect(() => {
        // Check local storage on load
        const stored = localStorage.getItem("attar-reminder");
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setReminderSet(true);
                setReminderLabel(data.label || "Reminder");
            } catch (e) {
                console.error("Failed to parse reminder data", e);
            }
        }
    }, []);

    const handleSetReminder = async (days: number, label: string) => {
        // 1. Request Permission if supported (and not already granted/denied handling implied by browser)
        if ("Notification" in window) {
            let permission = Notification.permission;
            if (permission === "default") {
                const toastId = toast.loading("Requesting permission...");
                permission = await Notification.requestPermission();
                toast.dismiss(toastId);
            }

            if (permission !== "granted") {
                toast.error("Notifications disabled", {
                    description: "Please enable notifications in your browser settings to set a reminder"
                });
                return;
            }
        }

        // 2. Set Reminder State
        const date = new Date();
        date.setDate(date.getDate() + days);
        const formattedDate = date.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' });

        setReminderSet(true);
        setReminderLabel(label);

        // Persist to local storage
        localStorage.setItem("attar-reminder", JSON.stringify({
            date: date.toISOString(),
            label: label,
            days: days
        }));

        toast.success("Reminder Scheduled!", {
            description: `We'll remind you on ${formattedDate}`,
            icon: <Bell className="h-4 w-4 text-primary" />,
        });
    };

    const clearReminder = () => {
        setReminderSet(false);
        setReminderLabel("");
        localStorage.removeItem("attar-reminder");
        toast.info("Reminder cancelled");
    };

    return (
        <section className="relative py-16 px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="space-y-4">
                    <h3 className="text-3xl font-bold text-foreground">Earn Rewards Beyond Giving</h3>
                    <p className="text-muted-foreground">
                        If a purchase isn&apos;t possible right now, consider setting a reminder for later or sharing this with others to help spread the fragrance.
                    </p>
                </div>

                <div className="flex justify-center items-center gap-4">
                    {reminderSet ? (
                        <Button
                            variant="outline"
                            className="gap-2 border-primary/50 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
                            onClick={clearReminder}
                            title="Click to cancel reminder"
                        >
                            <div className="relative">
                                <Bell className="h-4 w-4 fill-primary" />
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                            </div>
                            Reminder Set ({reminderLabel})
                        </Button>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Bell className="h-4 w-4" />
                                    Set Reminder
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => handleSetReminder(1, "Tomorrow")}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    Remind me Tomorrow
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSetReminder(2, "2 Days Later")}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    In 2 Days
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSetReminder(7, "Next Week")}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    In 1 Week
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSetReminder(30, "Before Eid")}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Before Eid
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    <ShareButton variant="default" size="default" />
                </div>
            </div>
        </section>
    );
}
