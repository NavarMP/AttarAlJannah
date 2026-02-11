// Share utilities for sharing content across platforms

export interface ShareData {
    title: string;
    text: string;
    url: string;
}

// Share on WhatsApp
export function shareToWhatsApp(data: ShareData) {
    const text = `${data.text}\n\n${data.url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
}

// Share on Facebook
export function shareToFacebook(data: ShareData) {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`;
    window.open(facebookUrl, "_blank", "noopener,noreferrer,width=600,height=400");
}

// Share on Twitter/X
export function shareToTwitter(data: ShareData) {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.text)}&url=${encodeURIComponent(data.url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer,width=600,height=400");
}

// Copy link to clipboard (MUST HAVE - User requirement)
export async function copyLink(url: string): Promise<boolean> {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
            return true;
        } else {
            // Fallback for browsers that don't support clipboard API
            const textArea = document.createElement("textarea");
            textArea.value = url;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            document.body.appendChild(textArea);
            textArea.select();
            const successful = document.execCommand("copy");
            document.body.removeChild(textArea);
            return successful;
        }
    } catch (err) {
        console.error("Failed to copy link:", err);
        return false;
    }
}

// Native share (for mobile devices)
export async function nativeShare(data: ShareData): Promise<boolean> {
    if (navigator.share) {
        try {
            await navigator.share({
                title: data.title,
                text: data.text,
                url: data.url,
            });
            return true;
        } catch (err) {
            // User cancelled or error occurred
            if (err instanceof Error && err.name !== "AbortError") {
                console.error("Native share failed:", err);
            }
            return false;
        }
    }
    return false;
}

// Check if native share is available
export function isNativeShareAvailable(): boolean {
    return typeof navigator !== "undefined" && "share" in navigator;
}

// Default share data for Attar Al Jannah
export const defaultShareData: ShareData = {
    title: "Attar Al Jannah - Support Students Learning Deen",
    text: "🌙 Assalamu Alaikum!\n\nSupport students learning the Deen of Allah by ordering Attar Al Jannah.\n\nEvery order helps a student! 📚✨",
    url: typeof window !== "undefined" ? window.location.origin : "https://attar-aljannah.com",
};
