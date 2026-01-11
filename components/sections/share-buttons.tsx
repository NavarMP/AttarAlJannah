"use client";

import { Share2, Facebook, Twitter, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export function ShareButtons() {
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "عطر الجنّة | Attar Al Jannah",
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

    const shareToWhatsApp = () => {
        const text = encodeURIComponent("Check out عطر الجنّة (Attar Al Jannah) from Minhajul Janna! " + window.location.href);
        window.open(`https://wa.me/?text=${text}`, "_blank");
    };

    const shareToFacebook = () => {
        const url = encodeURIComponent(window.location.href);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    };

    const shareToTwitter = () => {
        const text = encodeURIComponent("Check out عطر الجنّة (Attar Al Jannah) from Minhajul Janna!");
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

                <div className="flex justify-center items-center gap-4">
                    {/* Share Button */}
                    <button
                        onClick={handleShare}
                        className="group w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                        aria-label="Share"
                    >
                        <Share2 className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>

                    {/* WhatsApp */}
                    <button
                        onClick={shareToWhatsApp}
                        className="group w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BA5A] flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                        aria-label="Share on WhatsApp"
                    >
                        <MessageCircle className="w-6 h-6 text-white" />
                    </button>

                    {/* Facebook */}
                    <button
                        onClick={shareToFacebook}
                        className="group w-14 h-14 rounded-full bg-[#1877F2] hover:bg-[#0C63D4] flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                        aria-label="Share on Facebook"
                    >
                        <Facebook className="w-6 h-6 text-white" />
                    </button>

                    {/* Twitter/X */}
                    <button
                        onClick={shareToTwitter}
                        className="group w-14 h-14 rounded-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                        aria-label="Share on Twitter"
                    >
                        <Twitter className="w-6 h-6 text-white dark:text-black" />
                    </button>
                </div>
            </div>
        </section>
    );
}
