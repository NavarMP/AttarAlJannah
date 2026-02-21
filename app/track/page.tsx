"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Search } from "lucide-react";
import Link from "next/link";

export default function TrackPage() {
    const router = useRouter();
    const [orderId, setOrderId] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = orderId.trim();
        if (trimmed) {
            router.push(`/track/${trimmed}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4 lg:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2 pt-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Package className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold">Track Your Order</h1>
                    <p className="text-muted-foreground">
                        Enter your Order ID to see real-time delivery updates
                    </p>
                </div>

                {/* Search */}
                <Card className="rounded-2xl">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                placeholder="Enter Order ID (e.g. fbfe552a)..."
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                className="rounded-xl"
                                autoFocus
                            />
                            <Button
                                type="submit"
                                disabled={!orderId.trim()}
                                className="rounded-xl px-6"
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                        <p className="text-xs text-muted-foreground mt-3">
                            You can use the full Order ID or just the first few characters.
                        </p>
                    </CardContent>
                </Card>

                {/* Back link */}
                <div className="text-center pb-8">
                    <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                        ← Back to Attar Al Jannah
                    </Link>
                </div>
            </div>
        </div>
    );
}
