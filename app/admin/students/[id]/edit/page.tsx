"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
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
    const [stats, setStats] = useState({
        verified_sales: 0,
        totalOrders: 0,
        verifiedOrders: 0,
    });

    const fetchStudent = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/admin/students/${id}`);
            if (!response.ok) throw new Error("Failed to fetch student");

            const data = await response.json();
            const student = data.student;

            setFormData({
                name: student.name,
                email: student.email,
                phone: student.phone,
                student_id: student.student_id,
                password: "", // Don't populate password
                address: student.address || "",
                goal: student.goal?.toString() || "20",
            });

            setStats({
                verified_sales: student.verified_sales || 0,
                totalOrders: student.stats?.totalOrders || 0,
                verifiedOrders: student.stats?.verifiedOrders || 0,
            });

        } catch (error) {
            toast.error("Failed to load student");
            router.push("/admin/students");
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchStudent();
    }, [fetchStudent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email || !formData.phone) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (formData.phone.length !== 10) {
            toast.error("Phone number must be exactly 10 digits");
            return;
        }

        if (formData.password && formData.password.length < 8) {
            toast.error("Password must be at least 8 characters if provided");
            return;
        }

        try {
            setIsSubmitting(true);

            const updateData: any = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                student_id: formData.student_id,
                address: formData.address,
                goal: parseInt(formData.goal),
            };

            // Only include password if it's being changed
            if (formData.password) {
                updateData.password = formData.password;
            }

            const response = await fetch(`/api/admin/students/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to update student");
            }

            toast.success("Student updated successfully!");
            router.push("/admin/students");

        } catch (error: any) {
            toast.error(error.message || "Failed to update student");
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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
                    <h1 className="text-3xl font-bold">Edit Student</h1>
                    <p className="text-muted-foreground mt-1">
                        Update student information and progress
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card className="glass">
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Verified Sales</div>
                        <div className="text-2xl font-bold text-emerald-500 mt-1">
                            {stats.verified_sales}
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Total Orders</div>
                        <div className="text-2xl font-bold mt-1">{stats.totalOrders}</div>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Verified Orders</div>
                        <div className="text-2xl font-bold mt-1">{stats.verifiedOrders}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Form */}
            <Card className="glass-strong">
                <CardHeader>
                    <CardTitle>Student Information</CardTitle>
                    <CardDescription>
                        Update student details. Leave password empty to keep current password.
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
                                    maxLength={10}
                                    required
                                />
                            </div>
                        </div>

                        {/* Student ID and Password */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="student_id">Student ID *</Label>
                                <Input
                                    id="student_id"
                                    name="student_id"
                                    value={formData.student_id}
                                    onChange={handleChange}
                                    className="uppercase"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Be careful when changing this
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password (Optional)</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Leave empty to keep current"
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
                            />
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
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
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
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
