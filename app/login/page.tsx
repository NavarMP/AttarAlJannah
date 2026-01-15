"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, GraduationCap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LoginSelectorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-primary/5 to-gold-500/10">
            <div className="w-full max-w-4xl space-y-8">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <Image
                            src="/assets/typography.svg"
                            alt="عطر الجنّة"
                            width={300}
                            height={80}
                            className="h-16 md:h-20 w-auto"
                        />
                    </div>
                    <p className="text-xl text-muted-foreground">Choose your login type</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Customer Login */}
                    <Link href="/customer/login">
                        <Card className="glass-strong rounded-3xl hover:border-primary transition-all duration-300 hover:scale-105 cursor-pointer h-full">
                            <CardHeader className="text-center">
                                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-gold-500/20 flex items-center justify-center mb-4">
                                    <User className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle className="text-2xl">Customer</CardTitle>
                                <CardDescription>Track your orders</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    • View order history
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    • Reorder with saved details
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    • One-click checkout
                                </p>
                                <Button className="w-full mt-4 bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl">
                                    Login
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Volunteer Login */}
                    <Link href="/volunteer/login">
                        <Card className="glass-strong rounded-3xl hover:border-primary transition-all duration-300 hover:scale-105 cursor-pointer h-full">
                            <CardHeader className="text-center">
                                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                                    <GraduationCap className="w-8 h-8 text-blue-600" />
                                </div>
                                <CardTitle className="text-2xl">Volunteer</CardTitle>
                                <CardDescription>Access your dashboard</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    • Get your referral link
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    • Track sales & progress
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    • View leaderboard rank
                                </p>
                                <Button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl">
                                    Login
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Admin Login */}
                    <Link href="/admin/login">
                        <Card className="glass-strong rounded-3xl hover:border-primary transition-all duration-300 hover:scale-105 cursor-pointer h-full">
                            <CardHeader className="text-center">
                                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mb-4">
                                    <ShieldCheck className="w-8 h-8 text-red-600" />
                                </div>
                                <CardTitle className="text-2xl">Admin</CardTitle>
                                <CardDescription>Manage your store</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    • View all orders
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    • Update order status
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    • Dashboard analytics
                                </p>
                                <Button className="w-full mt-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-2xl">
                                    Login
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                <div className="text-center">
                    <Link href="/">
                        <Button variant="ghost" className="rounded-xl">
                            ← Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
