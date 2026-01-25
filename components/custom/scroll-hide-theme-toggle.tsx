"use client";

import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/custom/theme-toggle";

export function ScrollHideThemeToggle() {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show if scrolling up or at top, hide if scrolling down
            if (currentScrollY < 10) {
                setIsVisible(true);
            } else if (currentScrollY < lastScrollY) {
                // Scrolling up
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down and past 100px
                setIsVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [lastScrollY]);

    return (
        <div
            className={`fixed top-6 left-6 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                }`}
        >
            <ThemeToggle />
        </div>
    );
}
