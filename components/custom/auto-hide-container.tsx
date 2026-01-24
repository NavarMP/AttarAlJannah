"use client";

import { useState, useEffect } from "react";

interface AutoHideContainerProps {
    children: React.ReactNode;
    className?: string;
    direction?: "up" | "down";
}

export function AutoHideContainer({ children, className = "", direction = "up" }: AutoHideContainerProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Always show at the very top
            if (currentScrollY < 50) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY + 5) {
                // Scrolling down (hide)
                setIsVisible(false);
            } else if (currentScrollY < lastScrollY - 5) {
                // Scrolling up (show)
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const transformClass = direction === "up"
        ? (isVisible ? "translate-y-0" : "-translate-y-32")
        : (isVisible ? "translate-y-0" : "translate-y-32");

    return (
        <div className={`${className} transition-transform duration-300 ease-in-out ${transformClass}`}>
            {children}
        </div>
    );
}
