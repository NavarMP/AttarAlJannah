"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderForm } from "@/components/forms/order-form";

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

                <OrderForm studentId={studentId} />
            </div>
        </main>
    );
}
