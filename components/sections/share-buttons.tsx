"use client";

import { Button } from "@/components/ui/button";
import { Share2, Facebook, Twitter, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export function ShareButtons() {
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "عطر الجنّة | Attar Al Jannah",
                    text: "Check out this amazing Attar from Minhajul Jannah!",
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

    const shareToWhatsApp = () => {
        const text = encodeURIComponent("Check out عطر الجنّة (Attar Al Jannah) from Minhajul Jannah! " + window.location.href);
        window.open(`https://wa.me/?text=${text}`, "_blank");
    };

    const shareToFacebook = () => {
        const url = encodeURIComponent(window.location.href);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    };

    const shareToTwitter = () => {
        const text = encodeURIComponent("Check out عطر الجنّة (Attar Al Jannah) from Minhajul Jannah!");
        const url = encodeURIComponent(window.location.href);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
    };

    return (
        <section className="relative py-16 px-4 bg-gradient-to-b from-background to-primary/5 dark:to-primary/10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="space-y-4">
                    <h3 className="text-3xl font-bold text-foreground">Share the Fragrance</h3>
                    <p className="text-muted-foreground">
                        Spread the word about this beautiful attar with your friends and family
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button
                        size="lg"
                        variant="secondary"
                        className="w-full h-14 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl"
                        onClick={handleShare}
                    >
                        <Share2 className="mr-2 h-5 w-5" />
                        Share
                    </Button>

                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full h-14 text-base font-semibold border-2 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl bg-[#25D366] hover:bg-[#20BA5A] text-white border-[#25D366] hover:border-[#20BA5A]"
                        onClick={shareToWhatsApp}
                    >
                        <MessageCircle className="mr-2 h-5 w-5" />
                        WhatsApp
                    </Button>

                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full h-14 text-base font-semibold border-2 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl bg-[#1877F2] hover:bg-[#0C63D4] text-white border-[#1877F2] hover:border-[#0C63D4]"
                        onClick={shareToFacebook}
                    >
                        <Facebook className="mr-2 h-5 w-5" />
                        Facebook
                    </Button>

                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full h-14 text-base font-semibold border-2 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl bg-black hover:bg-gray-800 text-white border-black hover:border-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black dark:border-white dark:hover:border-gray-200"
                        onClick={shareToTwitter}
                    >
                        <Twitter className="mr-2 h-5 w-5" />
                        Twitter
                    </Button>
                </div>
            </div>
        </section>
    );
}
