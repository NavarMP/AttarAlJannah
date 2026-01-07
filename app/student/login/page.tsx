"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentLoginSchema, type StudentLoginData } from "@/lib/validations/auth-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export default function StudentLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<StudentLoginData>({
        resolver: zodResolver(studentLoginSchema),
    });

    const onSubmit = async (data: StudentLoginData) => {
        setIsLoading(true);

        try {
            const response = await fetch("/api/student/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Authentication failed");
            }

            const result = await response.json();

            if (result.success) {
                toast.success("Login successful!");
                // Store student info in session/local storage
                localStorage.setItem("studentId", result.studentId);
                localStorage.setItem("studentName", result.studentName);
                router.push("/student/dashboard");
            } else {
                toast.error(result.message || "Student not found");
            }
        } catch (error) {
            toast.error("Failed to login. Please check your credentials.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-12 islamic-pattern">
            <Card className="max-w-md w-full glass-strong">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-gold-500 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl">Student Login</CardTitle>
                        <CardDescription className="mt-2">
                            Access your sales dashboard and track your progress
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="identifier">Phone Number or Student ID</Label>
                            <Input
                                id="identifier"
                                placeholder="Enter your phone or student ID"
                                {...register("identifier")}
                            />
                            {errors.identifier && (
                                <p className="text-sm text-destructive">{errors.identifier.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                "Login to Dashboard"
                            )}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            <p>Don&apos;t have access?</p>
                            <p>Contact your admin to get registered as a student</p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
