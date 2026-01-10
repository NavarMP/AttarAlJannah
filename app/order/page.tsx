import { OrderForm } from "@/components/forms/order-form";
import { Footer } from "@/components/sections/footer";
import { ThemeToggle } from "@/components/custom/theme-toggle";

export default function OrderPage() {
    return (
        <main className="min-h-screen" id="order-form">
            {/* Theme Toggle */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <div className="py-12 px-4">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                            Place Your Order
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            عطر الجنّة - Experience the divine fragrance
                        </p>
                    </div>

                    <OrderForm />
                </div>
            </div>

            {/* Footer */}
            <Footer />
        </main>
    );
}
