import { OrderForm } from "@/components/forms/order-form";

export default function OrderPage() {
    return (
        <main className="min-h-screen py-12 px-4" id="order-form">
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
        </main>
    );
}
