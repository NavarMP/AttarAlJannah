"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Heart, Gift, Droplet, Shield, MapPin } from "lucide-react";

export function ProductDetails() {
    return (
        <section className="relative py-20 px-4 bg-gradient-to-b from-background to-primary/5 dark:to-primary/10">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Title */}
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                        Product Details
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Experience the divine essence - Attar al-Jannah
                    </p>
                </div>

                {/* Product Specifications */}
                <Card className="glass-strong border-primary/30 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-2xl">Product Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Product Type</h3>
                                <p className="text-muted-foreground">10ml Roll-On Perfume (Alcohol-Free)</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Content</h3>
                                <p className="text-muted-foreground">Concentrated Perfume Oil</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Net Quantity</h3>
                                <p className="text-muted-foreground">10ml (One bottle of 10ml roll-on perfume)</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Ingredients</h3>
                                <p className="text-muted-foreground">Synthetic Essential Oils, Synthetic Aroma Chemicals, Natural Essential Oils</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Usage</h3>
                                <p className="text-muted-foreground">For External Use Only</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Manufacturing Date</h3>
                                <p className="text-muted-foreground">01/2026</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Use Before</h3>
                                <p className="text-muted-foreground">01/2029</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Made In</h3>
                                <p className="text-muted-foreground">India</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="glass-strong border-primary/30 dark:border-primary/20 hover:shadow-xl transition-shadow duration-300 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Droplet className="w-6 h-6 text-blue-500" />
                                Alcohol-Free
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Concentrated perfume oil formula, gentle on skin and long-lasting fragrance.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass-strong border-primary/30 dark:border-primary/20 hover:shadow-xl transition-shadow duration-300 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-gold-500" />
                                Premium Quality
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Crafted with finest synthetic and natural essential oils for an authentic experience.
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
                                An ideal present for loved ones, wrapped in elegance and divine fragrance.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Manufacturer & Legal Information */}
                <Card className="glass-strong border-primary/30 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-2xl">Manufacturer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                Distributed By
                            </h3>
                            <p className="text-muted-foreground">
                                Minhajul Janna Dars Pullaloor<br />
                                Kuruvattur (PO), Kozhikode, Kerala, India
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-500" />
                                Manufactured By
                            </h3>
                            <p className="text-muted-foreground">
                                OAR FRAGRANCE LLP<br />
                                Plot No: 29 D, Inkel Edu-City<br />
                                Kerala, India - 676519<br />
                                Mfg. License No: 46/COS8/KER/2023
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg mb-2">Customer Care</h3>
                            <p className="text-muted-foreground">
                                Email: <a href="mailto:MinhajulJanna786@gmail.com" className="text-primary hover:underline">Minhajuljanna@gmail.com</a>
                            </p>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground italic">
                                <strong>Note:</strong> Not for Sale. This package is distributed exclusively through Minhajul Janna Dars.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
