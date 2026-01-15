import { HeroSection } from "@/components/sections/hero-section";
import { PromoVideoSection } from "@/components/sections/promo-video-section";
import { ProductDetails } from "@/components/sections/product-details";
import { AboutDars } from "@/components/sections/about-dars";
import { ShareButtons } from "@/components/sections/share-buttons";
import { Footer } from "@/components/sections/footer";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import { Sparkles } from "lucide-react";

export default function Home() {
    return (
        <main className="relative min-h-screen">
            {/* Theme Toggle - Top Left */}
            <div className="fixed top-6 left-6 z-50">
                <ThemeToggle />
            </div>

            {/* Hero: Photo, Logo, Subtitle, Price, Order Button, Login (top right) */}
            <HeroSection />

            {/* Eid Special Banner */}
            <div className="py-8 px-4 bg-gradient-to-r from-primary/10 via-gold-500/10 to-primary/10 border-y border-primary/20">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Sparkles className="w-5 h-5 text-gold-500 animate-pulse" />
                        <h3 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold-500">
                            Eid Special Launch
                        </h3>
                        <Sparkles className="w-5 h-5 text-gold-500 animate-pulse" />
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">
                        A blessed offering from <span className="font-semibold text-foreground">Minhajul Janna Dars</span> to celebrate this joyous occasion
                    </p>
                </div>
            </div>

            {/* Promo Video */}
            <PromoVideoSection />

            {/* About and Features */}
            <ProductDetails />

            {/* About Dars */}
            <AboutDars />

            {/* Share Buttons */}
            <ShareButtons />

            {/* Copyright */}
            <Footer />
        </main>
    );
}
