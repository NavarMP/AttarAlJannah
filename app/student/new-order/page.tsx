"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderForm } from "@/components/forms/order-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function StudentNewOrderPage() {
    const router = useRouter();
    const [studentId, setStudentId] = useState<string | null>(null);
    const [studentName, setStudentName] = useState<string | null>(null);

    useEffect(() => {
        const id = localStorage.getItem("studentId");
        const name = localStorage.getItem("studentName");

        if (!id || !name) {
            router.push("/student/login");
            return;
        }

        setStudentId(id);
        setStudentName(name);
    }, [router]);

    if (!studentId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                        Enter Customer Order
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Hi {studentName}! This order will be credited to your account.
                    </p>
                </div>

                {/* Referral Link Section */}
                <Card className="glass border-primary/30">
                    <CardHeader>
                        <CardTitle className="text-xl">Your Referral Link</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Share this link with customers. Orders placed through this link will be credited to you!
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={`${window.location.origin}/order?ref=${studentId}`}
                                readOnly
                                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/order?ref=${studentId}`);
                                    toast.success("Link copied to clipboard!");
                                }}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'Order Attar Al-Jannah',
                                            text: `Order premium Attar Al-Jannah fragrance through my link!`,
                                            url: `${window.location.origin}/order?ref=${studentId}`,
                                        });
                                    } else {
                                        toast.error("Sharing not supported on this device");
                                    }
                                }}
                            >
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <OrderForm studentId={studentId} />
            </div>
        </main>
    );
}
