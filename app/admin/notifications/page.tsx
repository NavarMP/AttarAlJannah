"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle2, XCircle, Search, AlertCircle } from "lucide-react";

export default function NotificationComposerPage() {
    const [targetType, setTargetType] = useState<"all" | "role" | "individual">("all");
    const [targetRole, setTargetRole] = useState<string>("");

    // Individual Targeting
    const [individualType, setIndividualType] = useState<"customer" | "volunteer">("customer");
    const [individualId, setIndividualId] = useState(""); // Phone for customer, Volunteer ID for volunteer
    const [verifiedUser, setVerifiedUser] = useState<{ name: string; id: string } | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [notFound, setNotFound] = useState(false);

    // Message Content
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [actionUrl, setActionUrl] = useState("");
    const [priority, setPriority] = useState("medium");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const verifyUser = async () => {
            if (!individualId || individualId.length < 3) {
                setVerifiedUser(null);
                setNotFound(false);
                return;
            }

            setVerifying(true);
            setVerifiedUser(null);
            setNotFound(false);

            try {
                if (individualType === "customer") {
                    // Search Customers by Phone
                    const res = await fetch(`/api/admin/customers?search=${individualId}`);
                    if (!res.ok) throw new Error("Failed to fetch customers");
                    const data = await res.json();

                    const match = data.customers?.find((c: any) => c.phone?.includes(individualId));

                    if (match) {
                        setVerifiedUser({ name: match.name, id: match.id });
                    } else {
                        setNotFound(true);
                    }
                } else {
                    // Search Volunteers by ID
                    const res = await fetch(`/api/admin/volunteers?search=${individualId}`);
                    if (!res.ok) throw new Error("Failed to fetch volunteers");
                    const data = await res.json();

                    const match = data.volunteers?.find((v: any) =>
                        v.volunteer_id.toLowerCase().includes(individualId.toLowerCase())
                    );

                    if (match) {
                        setVerifiedUser({ name: match.name, id: match.id });
                    } else {
                        setNotFound(true);
                    }
                }
            } catch (error) {
                console.error("Verification failed:", error);
            } finally {
                setVerifying(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (targetType === "individual") {
                verifyUser();
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [individualId, individualType, targetType]);

    const handleSend = async () => {
        if (!title || !message) {
            toast.error("Please fill in title and message");
            return;
        }

        if (targetType === "role" && !targetRole) {
            toast.error("Please select a target role");
            return;
        }

        if (targetType === "individual" && !verifiedUser) {
            toast.error("Please verify the recipient first");
            return;
        }

        setSending(true);

        try {
            const response = await fetch("/api/notifications/send-manual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    target_type: targetType,
                    target_role: targetRole || undefined,
                    target_user_ids: verifiedUser ? [verifiedUser.id] : undefined,
                    title,
                    message,
                    action_url: actionUrl || undefined,
                    priority,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to send notification");
            }

            const data = await response.json();
            toast.success(`Notification sent successfully!`);

            // Reset critical fields
            setTitle("");
            setMessage("");
            setVerifiedUser(null);
            setIndividualId("");
            setNotFound(false);
        } catch (error: any) {
            console.error("Send notification error:", error);
            toast.error(error.message || "Failed to send notification");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Compose Notification</h1>
                <p className="text-muted-foreground">Send push notifications to your users</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {/* Target Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Target Audience</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 p-3 rounded-xl border border-input cursor-pointer hover:bg-muted/50 transition-colors">
                                    <input
                                        type="radio"
                                        value="all"
                                        checked={targetType === "all"}
                                        onChange={(e) => setTargetType(e.target.value as any)}
                                        className="w-4 h-4"
                                    />
                                    <span>All Users</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 rounded-xl border border-input cursor-pointer hover:bg-muted/50 transition-colors">
                                    <input
                                        type="radio"
                                        value="role"
                                        checked={targetType === "role"}
                                        onChange={(e) => setTargetType(e.target.value as any)}
                                        className="w-4 h-4"
                                    />
                                    <span>Specific Role</span>
                                </label>

                                {targetType === "role" && (
                                    <div className="pl-8 space-y-2">
                                        <select
                                            value={targetRole}
                                            onChange={(e) => setTargetRole(e.target.value)}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                        >
                                            <option value="" disabled>Select Role...</option>
                                            <option value="customer">Customers</option>
                                            <option value="volunteer">Volunteers</option>
                                            <option value="admin">Admins</option>
                                        </select>
                                    </div>
                                )}

                                <label className="flex items-center gap-3 p-3 rounded-xl border border-input cursor-pointer hover:bg-muted/50 transition-colors">
                                    <input
                                        type="radio"
                                        value="individual"
                                        checked={targetType === "individual"}
                                        onChange={(e) => setTargetType(e.target.value as any)}
                                        className="w-4 h-4"
                                    />
                                    <span>Specific Individual</span>
                                </label>

                                {targetType === "individual" && (
                                    <div className="p-4 bg-muted/30 rounded-xl space-y-3 border border-border">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <select
                                                    value={individualType}
                                                    onChange={(e) => {
                                                        setIndividualType(e.target.value as any);
                                                        setVerifiedUser(null);
                                                        setIndividualId("");
                                                        setNotFound(false);
                                                    }}
                                                    className="h-10 px-3 rounded-md border border-input bg-background w-1/3 text-sm"
                                                >
                                                    <option value="customer">Customer</option>
                                                    <option value="volunteer">Volunteer</option>
                                                </select>
                                                <div className="relative flex-1">
                                                    <Input
                                                        placeholder={individualType === "customer" ? "Enter Phone Number" : "Enter Volunteer ID"}
                                                        value={individualId}
                                                        onChange={(e) => {
                                                            setIndividualId(e.target.value);
                                                            // verifiedUser cleared by effect dependency
                                                        }}
                                                        className={notFound ? "border-destructive" : ""}
                                                    />
                                                    {verifying && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {verifiedUser && (
                                                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-2 rounded-lg animate-in fade-in slide-in-from-top-1">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span>Found: <strong>{verifiedUser.name}</strong></span>
                                                </div>
                                            )}

                                            {notFound && !verifying && individualId.length > 2 && (
                                                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-lg animate-in fade-in slide-in-from-top-1">
                                                    <XCircle className="h-4 w-4" />
                                                    <span>User not found</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview (Desktop) */}
                    <Card className="hidden md:block opacity-70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-background rounded-lg p-3 shadow-md border border-border">
                                <h4 className="font-semibold text-sm">{title || "Notification Title"}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{message || "Your message will appear here..."}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Title</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter notification title"
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label>Message</Label>
                                <Textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Enter notification message"
                                    className="mt-1.5 min-h-[120px]"
                                />
                                <div className="text-right text-xs text-muted-foreground mt-1">
                                    {message.length} chars
                                </div>
                            </div>
                            <div>
                                <Label>Action URL (Optional)</Label>
                                <Input
                                    value={actionUrl}
                                    onChange={(e) => setActionUrl(e.target.value)}
                                    placeholder="e.g. /volunteer/orders"
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label>Priority</Label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full h-10 px-3 mt-1.5 rounded-md border border-input bg-background"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button
                            className="w-full h-12 text-lg rounded-xl"
                            onClick={handleSend}
                            disabled={sending || !title || !message || (targetType === "individual" && !verifiedUser)}
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-5 w-5" />
                                    Send Notification
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
