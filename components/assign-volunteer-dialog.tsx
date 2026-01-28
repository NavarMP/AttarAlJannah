import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, CheckCircle2, XCircle } from "lucide-react";

// Inline debounce for simplicity if hook doesn't exist?
// Let's assume we implement simple timeout logic.

interface AssignVolunteerDialogProps {
    orderId: string;
    customerPhone: string;
    onSuccess: () => void;
}

export function AssignVolunteerDialog({ orderId, customerPhone, onSuccess }: AssignVolunteerDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [volunteerId, setVolunteerId] = useState("");
    const [loading, setLoading] = useState(false);

    // Live validation states
    const [isValidating, setIsValidating] = useState(false);
    const [volunteerName, setVolunteerName] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (volunteerId.length >= 3) {
                setIsValidating(true);
                setValidationError(null);
                setVolunteerName(null);

                try {
                    const res = await fetch(`/api/volunteer/validate?volunteerId=${volunteerId}`);
                    const data = await res.json();

                    if (data.valid && data.volunteer) {
                        setVolunteerName(data.volunteer.name);
                        setValidationError(null);
                    } else {
                        setVolunteerName(null);
                        setValidationError("Volunteer not found");
                    }
                } catch (err) {
                    setVolunteerName(null);
                    setValidationError("Validation failed");
                } finally {
                    setIsValidating(false);
                }
            } else if (volunteerId.length > 0) {
                setVolunteerName(null);
                setValidationError(null); // Too short to fail yet
            } else {
                setVolunteerName(null);
                setValidationError(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [volunteerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!volunteerName) {
            toast.error("Please enter a valid volunteer ID");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/customer/orders/assign-volunteer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId,
                    volunteerId, // Using the validated input
                    phone: customerPhone,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to assign volunteer");
            }

            toast.success(`Assigned to ${data.volunteerName}`);
            setIsOpen(false);
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={(e) => e.stopPropagation()}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign Volunteer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Volunteer</DialogTitle>
                    <DialogDescription>
                        Did a volunteer refer you? Enter their ID below to link them to this order.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="volunteerId">Volunteer ID</Label>
                            <div className="relative">
                                <Input
                                    id="volunteerId"
                                    value={volunteerId}
                                    onChange={(e) => setVolunteerId(e.target.value)}
                                    placeholder="e.g. VOL123"
                                    className={`pr-10 ${validationError ? "border-red-500" : volunteerName ? "border-green-500" : ""}`}
                                    required
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {isValidating ? (
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    ) : volunteerName ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : validationError ? (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    ) : null}
                                </div>
                            </div>
                            {volunteerName && (
                                <p className="text-sm text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Found: {volunteerName}
                                </p>
                            )}
                            {validationError && (
                                <p className="text-sm text-red-500">
                                    {validationError}
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading || !volunteerName}>
                            {loading ? "Assigning..." : "Assign Volunteer"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
