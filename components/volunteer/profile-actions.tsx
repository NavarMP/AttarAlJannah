"use client";

import { useState } from "react";
import { Download, Link as LinkIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ui/share-button";
import { toast } from "sonner";
import { downloadNodeAsImage } from "@/lib/utils/export";

interface ProfileActionsProps {
    volunteerName: string;
    volunteerId: string;
    totalBottles: number;
    shareUrl: string;
}

export function ProfileActions({ volunteerName, volunteerId, totalBottles, shareUrl }: ProfileActionsProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            setIsDownloading(true);
            await downloadNodeAsImage("profile-card-export", `${volunteerId}_profile_card.png`);
            toast.success("Profile card downloaded!");
        } catch (error) {
            toast.error("Failed to download profile card");
        } finally {
            setIsDownloading(false);
        }
    };

    const referralUrl = `${typeof window !== "undefined" ? window.location.origin : "https://attaraljannah.com"}/order?ref=${volunteerId}`;

    const handleCopyReferral = () => {
        navigator.clipboard.writeText(referralUrl);
        toast.success("Referral link copied!");
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-border/50">
            <ShareButton
                data={{
                    title: `Support ${volunteerName} on Attar Al Jannah`,
                    text: `Check out ${volunteerName}'s volunteer profile! They've ordered ${totalBottles} bottles so far.`,
                    url: shareUrl,
                }}
                variant="outline"
                size="sm"
            />

            <Button variant="outline" size="sm" onClick={handleCopyReferral} className="gap-2 w-full sm:w-auto">
                <LinkIcon className="w-4 h-4 text-primary" />
                Share Referral Link
            </Button>

            <Button onClick={handleDownload} disabled={isDownloading} size="sm" className="gap-2 bg-gradient-to-r from-primary to-gold-500 w-full sm:w-auto">
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download Profile
            </Button>
        </div>
    );
}
