"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Heart, Gift } from "lucide-react";

export function ProductDetails() {
    return (
        <section className="relative py-20 px-4 bg-gradient-to-b from-background to-primary/5 dark:to-primary/10">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Title */}
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                        About & Features
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Experience the divine essence brought to you by Minhajul Jannah Dars.
                        A fragrance from Paradise.
                    </p>
                </div>

                {/* Product Information Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="glass-strong border-primary/30 dark:border-primary/20 hover:shadow-xl transition-shadow duration-300 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-gold-500" />
                                Premium Quality
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Crafted with the finest ingredients to bring you an authentic and long-lasting fragrance experience.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass-strong border-primary/30 dark:border-primary/20 hover:shadow-xl transition-shadow duration-300 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="w-6 h-6 text-red-500" />
                                Made with Love
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Each bottle is carefully prepared by our dedicated team at Minhajul Jannah with utmost care.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass-strong border-primary/30 dark:border-primary/20 hover:shadow-xl transition-shadow duration-300 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Gift className="w-6 h-6 text-primary" />
                                Perfect Gift
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                An ideal present for your loved ones on any occasion, wrapped in elegance and grace.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
