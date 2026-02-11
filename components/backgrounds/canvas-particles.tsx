"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    color: string;
}

export function CanvasParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Islamic-themed colors
        const colors = theme === "dark"
            ? ["#047857", "#fbbf24", "#e0e7ff", "#ffffff"] // Emerald, Gold, Indigo, White
            : ["#047857", "#fbbf24", "#a5f3fc", "#1e40af"]; // Emerald, Gold, Cyan, Blue

        // Initialize particles
        const particleCount = 10; // Calm, not too many
        particlesRef.current = Array.from({ length: particleCount }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5, // Slow movement
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 3 + 1, // Small particles (1-4px)
            opacity: Math.random() * 0.5 + 0.2, // Subtle (0.2-0.7)
            color: colors[Math.floor(Math.random() * colors.length)],
        }));

        // Animation loop
        const animate = () => {
            if (!ctx || !canvas) return;

            // Clear canvas with slight trail effect for smooth motion
            ctx.fillStyle = theme === "dark" ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particlesRef.current.forEach((particle) => {
                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Wrap around screen edges
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.opacity;
                ctx.fill();

                // Draw connection lines to nearby particles (subtle)
                // particlesRef.current.forEach((otherParticle) => {
                //     const dx = particle.x - otherParticle.x;
                //     const dy = particle.y - otherParticle.y;
                //     const distance = Math.sqrt(dx * dx + dy * dy);

                //     if (distance < 150) {
                //         ctx.beginPath();
                //         ctx.moveTo(particle.x, particle.y);
                //         ctx.lineTo(otherParticle.x, otherParticle.y);
                //         ctx.strokeStyle = particle.color;
                //         ctx.globalAlpha = (1 - distance / 150) * 0.1; // Very subtle lines
                //         ctx.lineWidth = 1;
                //         ctx.stroke();
                //     }
                // });
            });

            ctx.globalAlpha = 1; // Reset alpha

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Cleanup
        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none -z-10 opacity-30"
            aria-hidden="true"
        />
    );
}
