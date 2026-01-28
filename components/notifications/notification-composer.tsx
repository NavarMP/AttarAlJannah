"use client";

import { useState } from "react";
import { useNotifications } from "@/lib/contexts/notification-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send, AlertCircle } from "lucide-react";

interface NotificationComposerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NotificationComposer({ open, onOpenChange }: NotificationComposerProps) {
    const [targetType, setTargetType] = useState<"all" | "role" | "individual">("all");
    const [targetRole, setTargetRole] = useState<string>("");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [actionUrl, setActionUrl] = useState("");
    const [priority, setPriority] = useState("medium");
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const handleSend = async () => {
        if (!title || !message) {
            toast.error("Please fill in title and message");
            return;
        }

        if (targetType === "role" && !targetRole) {
            toast.error("Please select a target role");
            return;
        }

        if (targetType === "individual" && selectedUsers.length === 0) {
            toast.error("Please select at least one user");
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
                    target_user_ids: selectedUsers.length > 0 ? selectedUsers : undefined,
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
            toast.success(`Notification sent to ${data.sent_count} users!`);

            // Reset form
            setTitle("");
            setMessage("");
            setActionUrl("");
            setTargetType("all");
            setTargetRole("");
            setSelectedUsers([]);
            onOpenChange(false);
        } catch (error: any) {
            console.error("Send notification error:", error);
            toast.error(error.message || "Failed to send notification");
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
                <DialogHeader>
                    <DialogTitle>Send Notification</DialogTitle>
                    <DialogDescription>
                        Broadcast notifications to users. Choose your target audience and compose your message.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Target Selection */}
                    <div className="space-y-3">
                        <Label>Target Audience</Label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="all"
                                    checked={targetType === "all"}
                                    onChange={(e) => setTargetType(e.target.value as any)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">All Users (customers, volunteers, admins, public)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="role"
                                    checked={targetType === "role"}
                                    onChange={(e) => setTargetType(e.target.value as any)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Specific Role</span>
                            </label>

                            {targetType === "role" && (
                                <div className="ml-6 space-y-2">
                                    {["customer", "volunteer", "admin"].map((role) => (
                                        <label key={role} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value={role}
                                                checked={targetRole === role}
                                                onChange={(e) => setTargetRole(e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm capitalize">{role}s</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="individual"
                                    checked={targetType === "individual"}
                                    onChange={(e) => setTargetType(e.target.value as any)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Specific Individuals</span>
                            </label>

                            {targetType === "individual" && (
                                <div className="ml-6">
                                    <p className="text-xs text-muted-foreground mb-2">
                                        <AlertCircle className="inline h-3 w-3 mr-1" />
                                        Search for users by name, email, or phone (requires additional implementation)
                                    </p>
                                    <Input
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="rounded-xl"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notification Content */}
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., System Maintenance Notice"
                                className="rounded-xl mt-1"
                                maxLength={100}
                            />
                        </div>

                        <div>
                            <Label htmlFor="message">Message *</Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Compose your notification message..."
                                className="rounded-xl mt-1 min-h-[100px]"
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground mt-1">{message.length}/500</p>
                        </div>

                        <div>
                            <Label htmlFor="actionUrl">Action URL (Optional)</Label>
                            <Input
                                id="actionUrl"
                                value={actionUrl}
                                onChange={(e) => setActionUrl(e.target.value)}
                                placeholder="/admin/dashboard"
                                className="rounded-xl mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Where users will be directed when they click the notification
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="priority">Priority</Label>
                            <select
                                id="priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm mt-1"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-muted/50 rounded-xl p-4 border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
                        <div className="bg-background rounded-lg p-3 shadow-sm">
                            <h4 className="font-semibold text-sm">{title || "Notification Title"}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{message || "Your message will appear here..."}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={sending}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={sending || !title || !message}
                            className="rounded-xl"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Notification
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
