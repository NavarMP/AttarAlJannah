"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Award } from "lucide-react";

export function AboutDars() {
    return (
        <section className="relative py-20 px-4 bg-gradient-to-b from-primary/5 to-background dark:from-primary/10">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Title */}
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                        About Minhajul Jannah Dars
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        A sacred journey of knowledge and spiritual enlightenment
                    </p>
                </div>

                {/* Content */}
                <Card className="glass-strong border-primary/30 dark:border-primary/20 rounded-3xl">
                    <CardContent className="p-8 md:p-12">
                        <div className="space-y-8">
                            <p className="text-lg text-muted-foreground leading-relaxed text-center">
                                Minhajul Jannah Dars is a dedicated Islamic educational institution committed to spreading
                                authentic knowledge and nurturing spiritual growth. Through comprehensive programs and
                                community-driven initiatives, we strive to illuminate the path towards Paradise.
                            </p>

                            <div className="grid md:grid-cols-3 gap-6 mt-8">
                                <div className="text-center space-y-3">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-gold-500/20 flex items-center justify-center">
                                        <BookOpen className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Islamic Education</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Authentic knowledge from the Quran and Sunnah
                                    </p>
                                </div>

                                <div className="text-center space-y-3">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-gold-500/20 flex items-center justify-center">
                                        <Users className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Community</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Building a strong brotherhood and sisterhood
                                    </p>
                                </div>

                                <div className="text-center space-y-3">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-gold-500/20 flex items-center justify-center">
                                        <Award className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Excellence</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Striving for the highest standards of learning
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
