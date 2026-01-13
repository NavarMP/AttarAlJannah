"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderForm } from "@/components/forms/order-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

function StudentNewOrderContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [studentId, setStudentId] = useState<string | null>(null);
    const [studentName, setStudentName] = useState<string | null>(null);
    const [prefillData, setPrefillData] = useState<any>(null);

    const fetchOrderForEdit = useCallback(async (orderId: string, studentIdParam: string) => {
        try {
            const response = await fetch(`/api/student/orders?studentId=${studentIdParam}&orderId=${orderId}`);
            const data = await response.json();
            const order = data.order;

            if (order) {
                // Parse address from the combined string
                const addressParts = order.customer_address.split(', ');
                setPrefillData({
                    customerName: order.customer_name,
                    customerPhone: order.customer_phone,
                    whatsappNumber: order.whatsapp_number,
                    customerEmail: order.customer_email || '',
                    quantity: order.quantity,
                    orderId: order.id, // Include orderId for the edit flow
                    // Parse address parts
                    houseBuilding: addressParts[0] || '',
                    town: addressParts[1] || '',
                    post: addressParts[2] || '',
                    city: addressParts[3] || '',
                    district: addressParts[4] || '',
                    state: addressParts[5]?.split(' - ')[0] || '',
                    pincode: addressParts[5]?.split(' - ')[1] || '',
                });
            }
        } catch (error) {
            console.error("Failed to fetch order for edit:", error);
            toast.error("Failed to load order details");
        }
    }, []);

    useEffect(() => {
        const id = localStorage.getItem("studentId");
        const name = localStorage.getItem("studentName");

        if (!id || !name) {
            router.push("/student/login");
            return;
        }

        setStudentId(id);
        setStudentName(name);

        // Check for edit mode
        const editId = searchParams.get("edit");
        if (editId && id) {
            fetchOrderForEdit(editId, id);
        }
    }, [router, searchParams, fetchOrderForEdit]);

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


                <OrderForm studentId={studentId} prefillData={prefillData} />
            </div>
        </main>
    );
}

export default function StudentNewOrderPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <StudentNewOrderContent />
        </Suspense>
    );
}
