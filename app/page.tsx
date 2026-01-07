import { HeroSection } from "@/components/sections/hero-section";
import { ProductDetails } from "@/components/sections/product-details";
import { ActionButtons } from "@/components/sections/action-buttons";
import { ThemeToggle } from "@/components/custom/theme-toggle";

export default function Home() {
    return (
        <main className="relative min-h-screen">
            {/* Theme Toggle */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            {/* Hero Section */}
            <HeroSection />

            {/* Product Details */}
            <ProductDetails />

            {/* Action Buttons */}
            <ActionButtons />
        </main>
    );
}
