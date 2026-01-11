"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { ShoppingCart, LogIn, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useCustomerAuth } from "@/lib/contexts/customer-auth-context";
import { useAuth } from "@/lib/contexts/auth-context";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
    const router = useRouter();
    const imageRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const priceRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!imageRef.current || !logoRef.current || !subtitleRef.current || !priceRef.current || !buttonRef.current) return;

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

        // Logo reveal animation
        gsap.fromTo(
            logoRef.current,
            { opacity: 0, y: 50, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 1, ease: "back.out(1.7)" }
        );

        // Subtitle reveal with delay
        gsap.fromTo(
            subtitleRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: "power2.out" }
        );

        // Price reveal with delay
        gsap.fromTo(
            priceRef.current,
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 0.6, delay: 0.5, ease: "back.out(1.7)" }
        );

        // Button reveal with delay
        gsap.fromTo(
            buttonRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, delay: 0.7, ease: "power2.out" }
        );
    }, []);

    const scrollToOrder = () => {
        router.push("/order");
    };

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
            {/* Login Button - Top Right */}
            <LoginButton />

            {/* Content Container */}
            <div className="relative z-10 max-w-6xl mx-auto text-center">
                {/* Product Image - Positioned Above Title */}
                <div ref={imageRef} className="relative w-72 h-72 md:w-96 md:h-96 mx-auto mb-8">
                    <div className="relative w-full h-full">
                        <Image
                            src="/assets/attar.svg"
                            alt="Attar Al Jannah"
                            fill
                            className="object-contain drop-shadow-2xl"
                            priority
                        />
                        {/* Shimmer overlay */}
                        <div className="absolute inset-0 shimmer opacity-20 pointer-events-none" />
                    </div>
                    {/* Decorative glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent blur-3xl -z-10" />
                </div>

                {/* Typography Logo */}
                <div ref={logoRef} className="mb-6 flex justify-center">
                    <div className="relative w-full max-w-3xl h-36 md:h-48">
                        <Image
                            src="/assets/typography.svg"
                            alt="عطر الجنّة - Attar Al Jannah"
                            fill
                            className="object-contain drop-shadow-lg"
                            priority
                        />
                    </div>
                </div>

                {/* Subtitle */}
                <p
                    ref={subtitleRef}
                    className="text-xl md:text-2xl text-muted-foreground font-light tracking-wide mb-6"
                >
                    Essense <span className="font-semibold text-foreground">Minhajul Jannah</span>
                </p>

                {/* Price and Order Button - Horizontal Layout */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 max-w-4xl mx-auto">
                    {/* Price */}
                    <div ref={priceRef}>
                        <div className="inline-flex items-center px-8 h-20 rounded-2xl bg-gradient-to-r from-primary/20 to-gold-500/20 border-2 border-primary/50 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                            <div className="flex items-baseline gap-2">
                                <p className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold-400">
                                    ₹313
                                </p>
                                <p className="text-xs text-muted-foreground">/10ml</p>
                            </div>
                        </div>
                    </div>

                    {/* Order Button */}
                    <div ref={buttonRef}>
                        <Link href="/order">
                            <Button
                                size="lg"
                                className="w-full md:w-auto px-8 h-20 text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 rounded-2xl"
                            >
                                Order Now
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Login/Profile Button Component
function LoginButton() {
    const { user: customerUser } = useCustomerAuth();
    const { user: adminUser } = useAuth();
    const router = useRouter();

    // Check if any user is logged in
    const isLoggedIn = !!(customerUser || adminUser);

    const handleClick = () => {
        if (adminUser) {
            router.push("/admin/dashboard");
        } else if (customerUser) {
            router.push("/customer/dashboard");
        } else {
            router.push("/login");
        }
    };

    // Determine button text based on user type
    const getButtonText = () => {
        if (adminUser) return "Admin Panel";
        if (customerUser) return "My Account";
        return "Login";
    };

    return (
        <div className="fixed top-6 right-6 z-50">
            <Button
                onClick={handleClick}
                className="rounded-2xl shadow-lg bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600"
                size="lg"
            >
                {isLoggedIn ? (
                    <>
                        <User className="w-5 h-5 mr-2" />
                        {getButtonText()}
                    </>
                ) : (
                    <>
                        <LogIn className="w-5 h-5 mr-2" />
                        Login
                    </>
                )}
            </Button>
        </div>
    );
}

