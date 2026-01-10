"use client";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative py-8 px-4 border-t border-border bg-gradient-to-b from-background to-primary/5 dark:to-primary/10">
            <div className="max-w-6xl mx-auto">
                <div className="text-center space-y-4">
                    {/* Arabic Title */}
                    <h3 className="arabic-text text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold-500">
                        عطر الجنّة
                    </h3>

                    {/* Subtitle */}
                    <p className="text-sm text-muted-foreground">
                        From the House of Minhajul Jannah
                    </p>

                    {/* Divider */}
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto my-4" />

                    {/* Copyright */}
                    <p className="text-sm text-muted-foreground">
                        © {currentYear} Minhajul Jannah Dars. All rights reserved.
                    </p>

                    {/* Additional Info */}
                    <p className="text-xs text-muted-foreground/70">
                        Made with ❤️ for spreading the fragrance of Paradise
                    </p>
                </div>
            </div>
        </footer>
    );
}
