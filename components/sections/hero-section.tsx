"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
    const imageRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (!imageRef.current || !titleRef.current || !subtitleRef.current) return;

        // Floating animation for product image
        gsap.to(imageRef.current, {
            y: -20,
            duration: 2,
            ease: "power1.inOut",
            yoyo: true,
            repeat: -1,
        });

        // Parallax effect on scroll
        gsap.to(imageRef.current, {
            scrollTrigger: {
                trigger: imageRef.current,
                start: "top center",
                end: "bottom top",
                scrub: 1,
            },
            y: 100,
            scale: 0.9,
            opacity: 0.7,
        });

        // Title reveal animation
        gsap.fromTo(
            titleRef.current,
            { opacity: 0, y: 50, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 1, ease: "back.out(1.7)" }
        );

        // Subtitle reveal with delay
        gsap.fromTo(
            subtitleRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: "power2.out" }
        );
    }, []);

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden islamic-pattern">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-gold-500/5 pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 max-w-6xl mx-auto text-center space-y-12">
                {/* Arabic Title */}
                <h1
                    ref={titleRef}
                    className="arabic-text text-7xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-gold-500 to-emerald-600 drop-shadow-2xl"
                >
                    عطر الجنّة
                </h1>

                {/* Subtitle */}
                <p
                    ref={subtitleRef}
                    className="text-xl md:text-2xl text-muted-foreground font-light tracking-wide"
                >
                    From the House of <span className="font-semibold text-foreground">Minhajul Jannah</span>
                </p>

                {/* Product Image with Animation */}
                <div ref={imageRef} className="relative w-full max-w-md mx-auto">
                    <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
                        <Image
                            src="/assets/attar.png"
                            alt="Attar Al Jannah"
                            fill
                            className="object-cover"
                            priority
                        />
                        {/* Shimmer overlay */}
                        <div className="absolute inset-0 shimmer opacity-30" />
                    </div>

                    {/* Decorative glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent blur-3xl -z-10" />
                </div>

                {/* Scroll Indicator */}
                <div className="animate-bounce mt-12">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mx-auto text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                    </svg>
                </div>
            </div>
        </section>
    );
}
