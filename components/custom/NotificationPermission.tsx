"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { AutoHideContainer } from "@/components/custom/auto-hide-container";
import { toast } from "sonner";

gsap.registerPlugin(ScrollTrigger);

export function NotificationPermission() {
    const [permission, setPermission] = useState<NotificationPermission>("default");

    useEffect(() => {
        if ("Notification" in window) {
            setPermission(Notification.permission);
        }
    }, []);

    if (permission === "granted") return null;

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={async () => {
                if (!("Notification" in window)) {
                    toast.error("This browser does not support notifications");
                    return;
                }
                const result = await Notification.requestPermission();
                setPermission(result);
                if (result === 'granted') {
                    toast.success("Notifications enabled!");
                } else {
                    toast.error("Permission denied");
                }
            }}
            className="glass"
            title="Enable Notifications"
        >
            <Bell className="h-[1.2rem] w-[1.2rem] text-yellow-500" />
            <span className="sr-only">Enable Notifications</span>
        </Button>
    );
}
