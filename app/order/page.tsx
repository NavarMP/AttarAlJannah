import { Suspense } from "react";
import { Footer } from "@/components/sections/footer";
import { ScrollHideThemeToggle } from "@/components/custom/scroll-hide-theme-toggle";
import { OrderContent } from "./order-content";

export default function OrderPage() {
    return (
        <main className="min-h-screen" id="order-form">
            {/* Theme Toggle with auto-hide on scroll */}
            <ScrollHideThemeToggle />

            <div className="py-12 px-4">
                <Suspense fallback={
                    <div className="max-w-4xl mx-auto text-center py-20">
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                }>
                    <OrderContent />
                </Suspense>
            </div>

            {/* Footer */}
            <Footer />
        </main>
    );
}