"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save, Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        payment_method: "cod",
        payment_screenshot_url: "",
    });

    // Screenshot state
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string>("");
    const [removeScreenshot, setRemoveScreenshot] = useState(false);

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
                        payment_method: data.payment_method || "cod",
                        payment_screenshot_url: data.payment_screenshot_url || "",
                    });
                    setScreenshotPreview("");
                    setScreenshotFile(null);
                    setRemoveScreenshot(false);
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

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setScreenshotFile(file);
            setScreenshotPreview(URL.createObjectURL(file));
            setRemoveScreenshot(false);
        }
    };

    const handleRemoveScreenshot = () => {
        setScreenshotFile(null);
        setScreenshotPreview("");
        setRemoveScreenshot(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (formData.payment_method === 'qr' && ((removeScreenshot && !screenshotFile) || (!formData.payment_screenshot_url && !screenshotFile))) {
                toast.error("A payment screenshot is mandatory when using UPI (QR).");
                setSaving(false);
                return;
            }

            let finalScreenshotUrl = formData.payment_screenshot_url;

            // Handle screenshot removal
            if (removeScreenshot) {
                finalScreenshotUrl = "";
            }
            // Handle new screenshot upload
            else if (screenshotFile) {
                const supabase = createClient();
                const fileExt = screenshotFile.name.split(".").pop() || "jpg";
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `screenshots/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("payment-screenshots")
                    .upload(filePath, screenshotFile, { cacheControl: "3600", upsert: false });

                if (uploadError) {
                    throw new Error(`Failed to upload screenshot: ${uploadError.message}`);
                }

                const { data: urlData } = supabase.storage
                    .from("payment-screenshots")
                    .getPublicUrl(filePath);

                finalScreenshotUrl = urlData.publicUrl;
            }

            const isOnlinePayment = ['razorpay', 'qr'].includes(formData.payment_method);
            const payload = {
                ...formData,
                payment_screenshot_url: (!isOnlinePayment || removeScreenshot) ? null : (finalScreenshotUrl || undefined)
            };

            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
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
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="space-y-4 py-4 overflow-y-auto pr-2">
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
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="payment_method">Payment Method</Label>
                                    <select
                                        id="payment_method"
                                        name="payment_method"
                                        value={formData.payment_method}
                                        onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="razorpay">Online (Razorpay)</option>
                                        <option value="qr">UPI (QR)</option>
                                        <option value="cod">Cash on Delivery</option>
                                        <option value="volunteer_cash">Held by volunteer</option>
                                    </select>
                                    {formData.payment_method === 'qr' && (
                                        <p className="text-xs mt-1 text-amber-600 dark:text-amber-400">Consider updating the payment screenshot if UPI method is selected.</p>
                                    )}
                                </div>
                            </div>

                            {['razorpay', 'qr'].includes(formData.payment_method) && (
                                <>
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-2 border-t border-border">Payment Screenshot</h4>
                                    <div className="space-y-4">
                                        {(screenshotPreview || (formData.payment_screenshot_url && !removeScreenshot)) ? (
                                            <div className="relative w-full max-w-sm h-64 rounded-xl overflow-hidden border border-border mx-auto group">
                                                <Image
                                                    src={screenshotPreview || formData.payment_screenshot_url}
                                                    alt="Payment screenshot"
                                                    fill
                                                    className="object-contain bg-muted/30"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        className="rounded-xl shadow-lg"
                                                        onClick={handleRemoveScreenshot}
                                                    >
                                                        <X className="h-4 w-4 mr-2" />
                                                        Remove Image
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-xl bg-muted/20">
                                                <ImageIcon className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                                                <p className="text-sm text-muted-foreground mb-4 text-center">
                                                    {removeScreenshot ? "Screenshot marked for removal." : "No screenshot available."}
                                                    <br />Upload a new one below.
                                                </p>

                                                <div className="relative">
                                                    <Input
                                                        id="screenshot-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={handleScreenshotChange}
                                                    />
                                                    <Button type="button" variant="outline" className="rounded-xl pointer-events-none">
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        Choose File
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
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
