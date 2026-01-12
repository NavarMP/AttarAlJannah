import { Suspense } from "react";
import { Footer } from "@/components/sections/footer";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import { OrderContent } from "./order-content";

export default function OrderPage() {
    return (
        <main className="min-h-screen" id="order-form">
            {/* Theme Toggle */}
            <div className="fixed top-6 left-6 z-50">
                <ThemeToggle />
            </div>

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
