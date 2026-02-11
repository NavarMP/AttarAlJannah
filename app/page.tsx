import { HeroSection } from "@/components/sections/hero-section";
import { PromoVideoSection } from "@/components/sections/promo-video-section";
import { ProductDetails } from "@/components/sections/product-details";
import { AboutDars } from "@/components/sections/about-dars";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ui/share-button";
import { ShareButtons } from "@/components/sections/share-buttons";
import { Footer } from "@/components/sections/footer";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import { Sparkles, BookOpen, Heart, Gift, Bell } from "lucide-react";
import { AutoHideContainer } from "@/components/custom/auto-hide-container";
import { NotificationPermission } from "@/components/custom/NotificationPermission";
import { CanvasParticles } from "@/components/backgrounds/canvas-particles";
import { LiveStatsCard } from "@/components/stats/live-stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
    return (
        <main className="relative min-h-screen">
            {/* Canvas Particles Background */}
            <CanvasParticles />

            {/* Theme Toggle - Top Left */}
            <AutoHideContainer className="fixed top-6 left-6 z-50 flex gap-2">
                <ThemeToggle />
                {/* Notification Permission Button - Top Left */}
                <NotificationPermission />
            </AutoHideContainer>

            {/* Hero: Photo, Logo, Subtitle, Price, Order Button, Login (top right) */}
            <HeroSection />

            {/* Live Statistics */}
            <div className="py-12 px-4">
                <LiveStatsCard />
            </div>

            {/* Eid Special Banner */}
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Sparkles className="w-5 h-5 text-gold-500 animate-pulse" />
                        <h3 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold-500">
                            Eid Special
                        </h3>
                        <Sparkles className="w-5 h-5 text-gold-500 animate-pulse" />
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">
                        A blessed offering from <span className="font-semibold text-primary">Minhajul Janna</span> to celebrate this joyous occasion.
                        By participating in this initiative, you&apos;re supporting students who dedicate
                        their lives to learning and teaching the beautiful religion of Islam.
                        Every bottle ordered contributes to this noble cause.
                    </p>
                </div>
            </div>

            {/* Share Buttons */}
            <ShareButtons />

            {/* Promo Video */}
            {/* <PromoVideoSection /> */}

            {/* About and Features */}
            <ProductDetails />

            {/* About Dars */}
            <AboutDars />

            {/* Copyright */}
            <Footer />
        </main>
    );
}
