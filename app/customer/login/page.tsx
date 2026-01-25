"use client";

export const dynamic = "force-dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { useCustomerAuth } from "@/lib/contexts/customer-auth-context";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import Link from "next/link";

export default function CustomerLoginPage() {
    const [phone, setPhone] = useState("");
    const [countryCode, setCountryCode] = useState("+91");
    const [loading, setLoading] = useState(false);
    const { loginWithPhone } = useCustomerAuth();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone || phone.length < 10) {
            toast.error("Please enter a valid mobile number");
            return;
        }

        setLoading(true);
        try {
            // Combine country code and phone number
            const fullPhone = `${countryCode}${phone}`;
            await loginWithPhone(fullPhone);
            toast.success("Login successful!");
            router.push("/customer/dashboard");
        } catch (error) {
            console.error("Login error:", error);
            toast.error("Failed to log in. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-primary/5 to-gold-500/10">
            <Card className="w-full max-w-md glass-strong rounded-3xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-gold-500/20 flex items-center justify-center">
                        <Phone className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold">Customer Login</CardTitle>
                        <CardDescription className="mt-2">
                            Enter your mobile number to access your dashboard
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Mobile Number</Label>
                            <div className="flex gap-2">
                                <CountryCodeSelect
                                    value={countryCode}
                                    onChange={setCountryCode}
                                    disabled={loading}
                                />
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="Enter mobile number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    required
                                    disabled={loading}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl"
                            disabled={loading || !phone || phone.length < 10}
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                "Go to Dashboard"
                            )}
                        </Button>
                    </form>

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
