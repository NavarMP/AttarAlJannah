import { HeroSection } from "@/components/sections/hero-section";
import { ProductDetails } from "@/components/sections/product-details";
import { AboutDars } from "@/components/sections/about-dars";
import { ShareButtons } from "@/components/sections/share-buttons";
import { Footer } from "@/components/sections/footer";
import { ThemeToggle } from "@/components/custom/theme-toggle";

export default function Home() {
    return (
        <main className="relative min-h-screen">
            {/* Theme Toggle - Top Left */}
            <div className="fixed top-6 left-6 z-50">
                <ThemeToggle />
            </div>

            {/* Hero: Photo, Logo, Subtitle, Price, Order Button, Login (top right) */}
            <HeroSection />

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
