"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NewStudentPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        student_id: "",
        password: "",
        address: "",
        goal: "20",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (formData.phone.length !== 10) {
            toast.error("Phone number must be exactly 10 digits");
            return;
        }

        if (formData.password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await fetch("/api/admin/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    goal: parseInt(formData.goal),
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to create student");
            }

            toast.success("Student created successfully!");
            router.push("/admin/students");

        } catch (error: any) {
            toast.error(error.message || "Failed to create student");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/students">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Add New Student</h1>
                    <p className="text-muted-foreground mt-1">
                        Create a new student account for the challenge
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card className="glass-strong">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Student Information
                    </CardTitle>
                    <CardDescription>
                        Fill in the student details. Student ID will be auto-generated if left empty.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter student's full name"
                                required
                            />
                        </div>

                        {/* Email and Phone */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="student@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number *</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="10-digit number"
                                    maxLength={10}
                                    required
                                />
                            </div>
                        </div>

                        {/* Student ID and Password */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="student_id">Student ID</Label>
                                <Input
                                    id="student_id"
                                    name="student_id"
                                    value={formData.student_id}
                                    onChange={handleChange}
                                    placeholder="Auto-generated (e.g., STU001)"
                                    className="uppercase"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty for auto-generation
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Minimum 8 characters"
                                    required
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <Label htmlFor="address">Address (Optional)</Label>
                            <Textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter student's address"
                                rows={3}
                            />
                        </div>

                        {/* Goal */}
                        <div className="space-y-2">
                            <Label htmlFor="goal">Sales Goal</Label>
                            <Input
                                id="goal"
                                name="goal"
                                type="number"
                                min="1"
                                value={formData.goal}
                                onChange={handleChange}
                                placeholder="20"
                            />
                            <p className="text-xs text-muted-foreground">
                                Default: 20 verified sales
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Student...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Create Student
                                    </>
                                )}
                            </Button>
                            <Link href="/admin/students" className="flex-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                            </Link>
                        </div>

                        <p className="text-xs text-center text-muted-foreground">
                            * Required fields
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
