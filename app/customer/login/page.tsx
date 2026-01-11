"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Phone, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useCustomerAuth } from "@/lib/contexts/customer-auth-context";
import Link from "next/link";

export default function CustomerLoginPage() {
    const [phone, setPhone] = useState("");
    const [otp, setOTP] = useState("");
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [loading, setLoading] = useState(false);
    const { signInWithPhone, verifyOTP } = useCustomerAuth();
    const router = useRouter();

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!/^[6-9]\d{9}$/.test(phone)) {
            toast.error("Please enter a valid 10-digit mobile number");
            return;
        }

        setLoading(true);
        try {
            await signInWithPhone(phone);
            toast.success("OTP sent to your mobile!");
            setStep("otp");
        } catch (error) {
            console.error("Send OTP error:", error);
            toast.error("Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            await verifyOTP(phone, otp);
            toast.success("Login successful!");
            router.push("/customer/dashboard");
        } catch (error) {
            console.error("Verify OTP error:", error);
            toast.error("Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        try {
            await signInWithPhone(phone);
            toast.success("OTP resent successfully!");
        } catch (error) {
            toast.error("Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-primary/5 to-gold-500/10">
            <Card className="w-full max-w-md glass-strong rounded-3xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-gold-500/20 flex items-center justify-center">
                        {step === "phone" ? (
                            <Phone className="w-10 h-10 text-primary" />
                        ) : (
                            <MessageSquare className="w-10 h-10 text-primary" />
                        )}
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold">Customer Login</CardTitle>
                        <CardDescription className="mt-2">
                            {step === "phone"
                                ? "Enter your mobile number to receive OTP"
                                : `Enter the OTP sent to +91 ${phone}`
                            }
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {step === "phone" ? (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Mobile Number</Label>
                                <div className="flex gap-2">
                                    <div className="flex items-center px-3 py-2 border border-border rounded-xl bg-muted">
                                        <span className="text-sm font-medium">+91</span>
                                    </div>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="9876543210"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        required
                                        disabled={loading}
                                        maxLength={10}
                                        className="flex-1"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    We'll send you a one-time password
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl"
                                disabled={loading || phone.length !== 10}
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    "Send OTP"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">One-Time Password</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    disabled={loading}
                                    maxLength={6}
                                    className="text-center text-2xl tracking-widest"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl"
                                disabled={loading || otp.length !== 6}
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify & Login"
                                )}
                            </Button>

                            <div className="flex items-center justify-between text-sm">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setStep("phone")}
                                    disabled={loading}
                                    className="rounded-xl"
                                >
                                    ← Change number
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleResendOTP}
                                    disabled={loading}
                                    className="rounded-xl"
                                >
                                    Resend OTP
                                </Button>
                            </div>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link href="/login">
                            <Button variant="ghost" size="sm" className="rounded-xl">
                                ← Back to login options
                            </Button>
                        </Link>
                    </div>

                    <p className="text-center text-xs text-muted-foreground mt-6">
                        By logging in, you agree to our terms and conditions
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
