"use client";

export const dynamic = "force-dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function StudentLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!studentId || !password) {
            toast.error("Please enter both Student ID and Password");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/student/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: studentId.toUpperCase(),
                    password: password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Authentication failed");
            }

            if (result.success) {
                toast.success("Login successful!");
                // Store student info in localStorage to match dashboard expectations
                localStorage.setItem("studentId", result.student.studentId);
                localStorage.setItem("studentName", result.student.name);
                router.push("/student/dashboard");
            } else {
                toast.error(result.error || "Login failed");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to login. Please check your credentials.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-blue-500/5 to-purple-500/10">
            <Card className="max-w-md w-full glass-strong rounded-3xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
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
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="studentId">Student ID</Label>
                            <Input
                                id="studentId"
                                type="text"
                                placeholder="STU001 (case-insensitive)"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl"
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

                        <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Don&apos;t have access?
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Contact your admin to get registered as a student
                            </p>
                            <Link href="/login">
                                <Button variant="ghost" size="sm" className="rounded-xl mt-2">
                                    ← Back to login options
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
