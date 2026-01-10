"use client";

import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { useRouter } from "next/navigation";

export function TrackOrder() {
    const router = useRouter();

    return (
        <section className="relative py-12 px-4">
            <div className="max-w-2xl mx-auto text-center space-y-6">
                <h3 className="text-3xl font-bold text-foreground">Track Your Order</h3>
                <p className="text-muted-foreground">
                    Already placed an order? Track its status and delivery progress here.
                </p>
                <Button
                    size="lg"
                    variant="outline"
                    className="w-full max-w-md h-16 text-lg font-semibold border-2 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl"
                    onClick={() => router.push("/track")}
                >
                    <Package className="mr-2 h-6 w-6" />
                    Track Order
                </Button>
            </div>
        </section>
    );
}
