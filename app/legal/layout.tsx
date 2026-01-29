"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import { Footer } from "@/components/sections/footer";
import { AutoHideContainer } from "@/components/custom/auto-hide-container";

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Auto-hiding Header */}
            <AutoHideContainer className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:scale-105">
                            <Image
                                src="/assets/typography.svg"
                                alt="Attar Al Jannah Logo"
                                fill
                                className="object-contain dark:brightness-[180%] dark:contrast-75"
                            />
                        </div>
                        <span className="font-bold text-lg md:text-xl text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-gold-500">
                            Attar Al Jannah
                        </span>
                    </Link>
                    <ThemeToggle />
                </div>
            </AutoHideContainer>

            {/* Main Content with top padding for fixed header */}
            <main className="flex-grow pt-20">
                {children}
            </main>

            <Footer />
        </div>
    );
}
