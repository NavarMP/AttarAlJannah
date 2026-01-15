"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart, LogIn, Package, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ActionButtons() {
    const router = useRouter();

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Attar al-Jannah | عطر الجنّة",
                    text: "Check out this amazing Attar from Minhajul Janna!",
                    url: window.location.href,
                });
            } catch (error) {
                // User cancelled share
            }
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard!");
        }
    };

    const scrollToOrder = () => {
        const orderSection = document.getElementById("order-form");
        if (orderSection) {
            orderSection.scrollIntoView({ behavior: "smooth" });
        } else {
            router.push("/order");
        }
    };

    return (
        <section className="relative py-20 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Buy Now Button */}
                    <Button
                        size="lg"
                        className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={scrollToOrder}
                    >
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Buy Now
                    </Button>

                    {/* Volunteer Login */}
                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full h-16 text-lg font-semibold border-2 border-gold-500 text-gold-600 hover:bg-gold-50 dark:hover:bg-gold-950/20 shadow-md hover:shadow-lg transition-all duration-300"
                        onClick={() => router.push("/volunteer/login")}
                    >
                        <LogIn className="mr-2 h-5 w-5" />
                        Volunteer Login
                    </Button>

                    {/* Track Order */}
                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full h-16 text-lg font-semibold border-2 shadow-md hover:shadow-lg transition-all duration-300"
                        onClick={() => router.push("/track")}
                    >
                        <Package className="mr-2 h-5 w-5" />
                        Track Order
                    </Button>

                    {/* Share Button */}
                    <Button
                        size="lg"
                        variant="secondary"
                        className="w-full h-16 text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                        onClick={handleShare}
                    >
                        <Share2 className="mr-2 h-5 w-5" />
                        Share
                    </Button>
                </div>
            </div>
        </section>
    );
}
