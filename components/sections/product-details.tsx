"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Heart, Gift } from "lucide-react";

export function ProductDetails() {
    return (
        <section className="relative py-20 px-4 bg-gradient-to-b from-background to-emerald-50/10 dark:to-emerald-950/10">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Title */}
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                        A Fragrance from Paradise
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Experience the divine essence brought to you by Minhajul Jannah Dars.
                        Join our sales challenge and be part of something extraordinary.
                    </p>
                </div>

                {/* Product Information Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="glass-strong border-emerald-200/50 dark:border-emerald-800/50">
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

                    <Card className="glass-strong border-emerald-200/50 dark:border-emerald-800/50">
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

                    <Card className="glass-strong border-emerald-200/50 dark:border-emerald-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Gift className="w-6 h-6 text-emerald-500" />
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

                {/* Pricing Card */}
                <Card className="max-w-md mx-auto glass border-gold-300/50 dark:border-gold-700/50 shadow-xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl">Pricing</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div className="space-y-2">
                            <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-400">
                                ₹499
                            </p>
                            <p className="text-sm text-muted-foreground">per bottle (12ml)</p>
                        </div>
                        <div className="pt-4 border-t">
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                                🎯 Student Challenge: Sell 20 bottles and earn rewards!
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Challenge Information */}
                <div className="text-center max-w-2xl mx-auto space-y-4 p-6 rounded-lg bg-gradient-to-r from-emerald-500/10 to-gold-500/10 border border-emerald-200 dark:border-emerald-800">
                    <h3 className="text-2xl font-bold text-foreground">Join the Sales Challenge</h3>
                    <p className="text-muted-foreground">
                        Are you a student of Minhajul Jannah? Participate in our sales challenge!
                        Help us spread this beautiful fragrance and track your progress towards the goal of 20 sales.
                    </p>
                </div>
            </div>
        </section>
    );
}
