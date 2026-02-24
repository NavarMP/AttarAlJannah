"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Check if touchscreen
        setIsMobile('ontouchstart' in window);

        if ('ontouchstart' in window) return;

        const onMouseMove = (e: MouseEvent) => {
            if (cursorRef.current) {
                cursorRef.current.style.left = `${e.clientX}px`;
                cursorRef.current.style.top = `${e.clientY}px`;
            }
        };

        const onMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === "BUTTON" ||
                target.tagName === "A" ||
                target.closest("button") ||
                target.closest("a")
            ) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseover", onMouseOver);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseover", onMouseOver);
        };
    }, []);

    if (isMobile) return null;

    return (
        <div
            ref={cursorRef}
            className={`custom-cursor ${isHovering ? "hover" : ""}`}
            style={{
                left: "-100px",
                top: "-100px",
                transform: "translate(-50%, -50%)",
            }}
        />
    );
}
