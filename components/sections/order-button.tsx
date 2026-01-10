"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

export function OrderButton() {
    const router = useRouter();

    const scrollToOrder = () => {
        const orderSection = document.getElementById("order-form");
        if (orderSection) {
            orderSection.scrollIntoView({ behavior: "smooth" });
        } else {
            router.push("/order");
        }
    };

    return (
        <section className="relative py-12 px-4">
            <div className="max-w-2xl mx-auto text-center">
                <Button
                    size="lg"
                    className="w-full max-w-md h-20 text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                    onClick={scrollToOrder}
                >
                    <ShoppingCart className="mr-3 h-8 w-8" />
                    Order Now
                </Button>
            </div>
        </section>
    );
}
