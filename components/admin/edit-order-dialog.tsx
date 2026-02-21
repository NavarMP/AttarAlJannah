"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface EditOrderDialogProps {
    orderId: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditOrderDialog({ orderId, trigger, open: controlledOpen, onOpenChange: setControlledOpen, onSuccess }: EditOrderDialogProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

    // Support both controlled and uncontrolled usage
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;
    const setOpen = isControlled ? (setControlledOpen || (() => { })) : setUncontrolledOpen;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        customer_name: "",
        customer_phone: "",
        whatsapp_number: "",
        customer_email: "",
        customer_address: "",
        product_name: "",
        quantity: 1,
        total_price: 0,
    });

    useEffect(() => {
        if (open) {
            const fetchOrderDetails = async () => {
                setLoading(true);
                try {
                    const response = await fetch(`/api/admin/orders/${orderId}`);
                    if (!response.ok) throw new Error("Failed to fetch order details");

                    const data = await response.json();
                    setFormData({
                        customer_name: data.customer_name || "",
                        customer_phone: data.customer_phone || "",
                        whatsapp_number: data.whatsapp_number || "",
                        customer_email: data.customer_email || "",
                        customer_address: data.customer_address || "",
                        product_name: data.product_name || "عطر الجنّة (Attar Al Jannah)",
                        quantity: data.quantity || 1,
                        total_price: data.total_price || 0,
                    });
                } catch (error) {
                    console.error("Order fetch error:", error);
                    toast.error("Failed to load order details for editing");
                    setOpen(false);
                } finally {
                    setLoading(false);
                }
            };

            fetchOrderDetails();
        }
    }, [open, orderId, setOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "quantity" || name === "total_price" ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update order");
            }

            toast.success("Order details updated successfully");
            setOpen(false);
            onSuccess();
        } catch (error: any) {
            console.error("Update error:", error);
            toast.error(error.message || "An error occurred while saving the order");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Order Details</DialogTitle>
                    <DialogDescription>
                        Modify customer and order information directly. Changes apply immediately.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customer Info</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="customer_name">Full Name</Label>
                                    <Input id="customer_name" name="customer_name" value={formData.customer_name} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="customer_phone">Phone</Label>
                                    <Input id="customer_phone" name="customer_phone" value={formData.customer_phone} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp_number">WhatsApp</Label>
                                    <Input id="whatsapp_number" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="customer_email">Email <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                                    <Input id="customer_email" name="customer_email" type="email" value={formData.customer_email} onChange={handleChange} />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="customer_address">Address</Label>
                                    <Textarea
                                        id="customer_address"
                                        name="customer_address"
                                        value={formData.customer_address}
                                        onChange={handleChange}
                                        required
                                        className="min-h-[80px]"
                                    />
                                </div>
                            </div>

                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-2 border-t border-border">Order Config</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="product_name">Product Name</Label>
                                    <Input id="product_name" name="product_name" value={formData.product_name} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        name="quantity"
                                        type="number"
                                        min="1"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="total_price">Total Price (₹)</Label>
                                    <Input
                                        id="total_price"
                                        name="total_price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.total_price}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 mt-4 border-t border-border">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
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
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
