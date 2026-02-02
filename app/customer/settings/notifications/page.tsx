"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Bell, Mail, MessageSquare, Save, Check } from "lucide-react";

export default function CustomerNotificationPreferencesPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState<any>(null);
    const [customer, setCustomer] = useState<any>(null);

    useEffect(() => {
        loadPreferences();
    }, []);

    async function loadPreferences() {
        setLoading(true);
        try {
            const res = await fetch("/api/customer/notification-preferences");
            if (!res.ok) throw new Error("Failed to load preferences");

            const data = await res.json();
            setCustomer(data.customer);
            setPreferences(data.preferences);
        } catch (error) {
            console.error("Error loading preferences:", error);
            toast.error("Failed to load notification preferences");
        } finally {
            setLoading(false);
        }
    }

    async function savePreferences() {
        setSaving(true);
        try {
            const res = await fetch("/api/customer/notification-preferences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ preferences }),
            });

            if (!res.ok) throw new Error("Failed to save preferences");

            const data = await res.json();
            toast.success(data.message || "Preferences saved successfully!");
        } catch (error) {
            console.error("Error saving preferences:", error);
            toast.error("Failed to save preferences");
        } finally {
            setSaving(false);
        }
    }

    function toggleChannel(channel: string) {
        setPreferences({
            ...preferences,
            channels: {
                ...preferences.channels,
                [channel]: !preferences.channels[channel],
            },
        });
    }

    function toggleCategory(category: string) {
        setPreferences({
            ...preferences,
            categories: {
                ...preferences.categories,
                [category]: !preferences.categories[category],
            },
        });
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!preferences) {
        return (
            <div className="container mx-auto py-8 px-4">
                <p className="text-center text-muted-foreground">Failed to load preferences</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Notification Preferences
                </h1>
                <p className="text-muted-foreground mt-2">
                    Control how and when you receive notifications
                </p>
            </div>

            <div className="space-y-6">
                {/* Notification Channels */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-blue-600" />
                            Notification Channels
                        </CardTitle>
                        <CardDescription>
                            Choose how you want to receive notifications
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                            <div className="flex items-center gap-3">
                                <Bell className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="font-medium">Push Notifications</p>
                                    <p className="text-sm text-muted-foreground">
                                        Instant notifications in your browser
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleChannel("push")}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.channels.push ? "bg-blue-600" : "bg-gray-300"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.channels.push ? "translate-x-6" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-purple-600" />
                                <div>
                                    <p className="font-medium">Email Notifications</p>
                                    <p className="text-sm text-muted-foreground">
                                        {customer.email || "Add email to enable"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleChannel("email")}
                                disabled={!customer.email}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.channels.email && customer.email
                                    ? "bg-purple-600"
                                    : "bg-gray-300"
                                    } ${!customer.email ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.channels.email ? "translate-x-6" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors opacity-50">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="font-medium">SMS Notifications</p>
                                    <p className="text-sm text-muted-foreground">
                                        Coming soon - {customer.phone}
                                    </p>
                                </div>
                            </div>
                            <button
                                disabled
                                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 cursor-not-allowed"
                            >
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Categories */}
                <Card>
                    <CardHeader>
                        <CardTitle>Notification Types</CardTitle>
                        <CardDescription>
                            Choose which types of notifications you want to receive
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <NotificationToggle
                            title="Order Updates"
                            description="New orders, order confirmations, status changes"
                            enabled={preferences.categories.order_updates}
                            onToggle={() => toggleCategory("order_updates")}
                            icon="📦"
                        />

                        <NotificationToggle
                            title="Payment Updates"
                            description="Payment confirmations, failures, refunds"
                            enabled={preferences.categories.payment_updates}
                            onToggle={() => toggleCategory("payment_updates")}
                            icon="💳"
                        />

                        <NotificationToggle
                            title="Delivery Updates"
                            description="Delivery assignments, status, completion"
                            enabled={preferences.categories.delivery_updates}
                            onToggle={() => toggleCategory("delivery_updates")}
                            icon="🚚"
                        />

                        <NotificationToggle
                            title="Promotional Offers"
                            description="Special offers, discounts, new products"
                            enabled={preferences.categories.promotional}
                            onToggle={() => toggleCategory("promotional")}
                            icon="🎁"
                        />

                        <NotificationToggle
                            title="System Alerts"
                            description="Important system updates and announcements"
                            enabled={preferences.categories.system_alerts}
                            onToggle={() => toggleCategory("system_alerts")}
                            icon="⚠️"
                            critical
                        />
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={loadPreferences}
                        disabled={saving}
                    >
                        Reset
                    </Button>
                    <Button
                        onClick={savePreferences}
                        disabled={saving}
                        className="min-w-[120px]"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>

                {/* Info Note */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <div className="text-blue-600">ℹ️</div>
                            <div className="text-sm text-blue-900">
                                <p className="font-medium mb-1">Note about critical notifications</p>
                                <p>
                                    Critical notifications (like payment failures and system alerts) will always be
                                    sent regardless of your preferences to ensure you don&apos;t miss important updates.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function NotificationToggle({
    title,
    description,
    enabled,
    onToggle,
    icon,
    critical = false,
}: {
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    icon: string;
    critical?: boolean;
}) {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                    <p className="font-medium flex items-center gap-2">
                        {title}
                        {critical && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                Always On
                            </span>
                        )}
                    </p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
            <button
                onClick={onToggle}
                disabled={critical}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-blue-600" : "bg-gray-300"
                    } ${critical ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                />
            </button>
        </div>
    );
}
