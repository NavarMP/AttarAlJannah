import { Metadata } from "next";
import { EnhancedLeaderboard } from "@/components/volunteer/enhanced-leaderboard";
import { ShareButton } from "@/components/ui/share-button";
import { ThemeToggle } from "@/components/custom";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Volunteer Leaderboard | Attar al-Jannah",
    description: "See our top volunteers and their amazing contributions to the Attar al-Jannah campaign.",
    openGraph: {
        title: "Volunteer Leaderboard | Attar al-Jannah",
        description: "See our top volunteers and their amazing contributions to the Attar al-Jannah campaign.",
    },
};

export default function PublicLeaderboardPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                            Volunteer Leaderboard
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Recognizing our amazing volunteers
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShareButton
                            data={{
                                title: "Volunteer Leaderboard | Attar al-Jannah",
                                text: "Check out the leaderboard for our Attar al-Jannah volunteer campaign!",
                                url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/leaderboard`,
                            }}
                            variant="outline"
                            size="sm"
                        />
                        <ThemeToggle />
                        <Link href="/">
                            <Button variant="outline" size="icon" className="mr-2">
                                <span className="sr-only">Home</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Leaderboard */}
                <EnhancedLeaderboard />

                {/* Footer CTA */}
                {/* <div className="text-center pt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Want to join our volunteer team?
                    </p>
                    <Link href="/volunteer/signup">
                        <Button className="rounded-2xl">
                            Become a Volunteer
                        </Button>
                    </Link>
                </div> */}
            </div>
        </main>
    );
}
