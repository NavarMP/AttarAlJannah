"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

export function CanvasParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();
    const [primaryColor, setPrimaryColor] = useState<string>("");

    useEffect(() => {
        // Function to get primary color from CSS variable
        const updatePrimaryColor = () => {
            const style = getComputedStyle(document.documentElement);
            const primaryVar = style.getPropertyValue("--primary").trim();
            // Assuming the variable is in HSL format like "38 92% 50%" or similar
            if (primaryVar) {
                // If it's already HSL/A or hex, use it as is? 
                // No, globals.css shows just the values "38 92% 50%"
                setPrimaryColor(`hsl(${primaryVar})`);
            }
        };

        // Update immediately
        updatePrimaryColor();

        // Small timeout to ensure theme is applied to DOM (next-themes)
        const timer = setTimeout(updatePrimaryColor, 100);

        return () => clearTimeout(timer);
    }, [theme]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !primaryColor) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        // Particle class
        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            opacity: number;
            color: string;

            constructor(color: string) {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 3 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.color = color;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                // Wrap around screen
                if (this.x > canvas!.width) this.x = 0;
                if (this.x < 0) this.x = canvas!.width;
                if (this.y > canvas!.height) this.y = 0;
                if (this.y < 0) this.y = canvas!.height;
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.opacity * 0.3; // Subtle opacity
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        // Initialize particles
        const initParticles = () => {
            particles = [];
            const particleCount = window.innerWidth < 768 ? 30 : 60; // Fewer particles on mobile

            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(primaryColor));
            }
        };

        initParticles();

        // Animation loop
        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle) => {
                particle.update();
                particle.draw();
            });

            // Draw subtle gradient overlay
            const gradient = ctx.createRadialGradient(
                canvas.width / 2,
                canvas.height / 2,
                0,
                canvas.width / 2,
                canvas.height / 2,
                canvas.width
            );

            // Use primary color for the glow
            // Transform hsl(vals) to hsl(vals / 0.05) for opacity
            // primaryColor is like "hsl(38 92% 50%)"
            const primaryColorLowOpacity = primaryColor.endsWith(")")
                ? primaryColor.slice(0, -1) + " / 0.05)"
                : primaryColor;

            gradient.addColorStop(0, primaryColorLowOpacity); // Very subtle center glow
            gradient.addColorStop(1, "transparent");

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [primaryColor]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none -z-10"
        />
    );
}
