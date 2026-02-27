"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Phone, MessageCircle, Image as ImageIcon, Trash2, Pencil, MapPin, Truck, Mail } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Image from "next/image";
import Link from "next/link";
import { OrderBill } from "@/components/order-bill";
import { ThankYouPoster } from "@/components/thank-you-poster";
import { AutoHideContainer } from "@/components/custom/auto-hide-container";
import { DeliveryManagement } from "@/components/admin/delivery-management";
import { VolunteerAssignment } from "@/components/admin/volunteer-assignment";
import { TrackingTimeline } from "@/components/tracking-timeline";
import { EditOrderDialog } from "@/components/admin/edit-order-dialog";

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    whatsapp_number: string;
    customer_email: string;
    customer_address: string;
    product_name: string;
    quantity: number;
    total_price: number;
    payment_method: string;
    payment_status: string;
    order_status: string;
    payment_screenshot_url: string | null;
    screenshot_verified: boolean | null;
    screenshot_verification_details: any;
    extracted_transaction_id: string | null;
    volunteer_id?: string;
    delivery_volunteer_id?: string; // Human-readable volunteer ID like VOL001
    is_delivery_duty?: boolean;
    delivery_method?: string;
    delivery_fee?: number;
    created_at: string;
    volunteers?: { name: string } | null;
    payment_upi_id?: string | null;
    whatsapp_sent?: boolean;
    email_sent?: boolean;
    admin_notes?: string | null;
    cash_received?: boolean;
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [volunteerIdInput, setVolunteerIdInput] = useState("");
    const [deliveryMethod, setDeliveryMethod] = useState("volunteer");
    const [assigningDelivery, setAssigningDelivery] = useState(false);
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [newDate, setNewDate] = useState("");
    const [isEditingUpi, setIsEditingUpi] = useState(false);
    const [newUpi, setNewUpi] = useState("");
    const [historicalUpis, setHistoricalUpis] = useState<string[]>([]);
    const [deliveryRequests, setDeliveryRequests] = useState<any[]>([]);
    const [resendingEmail, setResendingEmail] = useState(false);

    // Notes state
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [noteInput, setNoteInput] = useState("");
    const [savingNote, setSavingNote] = useState(false);

    // Fetch UPI IDs for autocomplete
    useEffect(() => {
        const fetchUpis = async () => {
            try {
                const res = await fetch("/api/admin/upi-ids");
                if (res.ok) {
                    const data = await res.json();
                    setHistoricalUpis(data.upiIds || []);
                }
            } catch (error) {
                console.error("Failed to fetch historical UPI IDs:", error);
            }
        };
        fetchUpis();
    }, []);

    const fetchOrder = useCallback(async () => {
        try {
            const response = await fetch(`/api/admin/orders/${id}`);
            if (!response.ok) {
                throw new Error("Order not found");
            }
            const data = await response.json();
            setOrder(data);
            setNewStatus(data.order_status);

            // Fetch delivery requests for this order
            try {
                const requestsRes = await fetch(`/api/admin/delivery-requests?orderId=${id}`);
                if (requestsRes.ok) {
                    const requestsData = await requestsRes.json();
                    setDeliveryRequests(requestsData.requests || []);
                }
            } catch (error) {
                console.error("Failed to fetch delivery requests:", error);
            }
        } catch (error) {
            console.error("Failed to fetch order:", error);
            toast.error("Failed to load order");
            router.push("/admin/orders");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    const handleStatusUpdate = async () => {
        if (!order || newStatus === order.order_status) return;

        setUpdating(true);
        try {
            const response = await fetch(`/api/admin/orders/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order_status: newStatus }),
            });

            if (!response.ok) throw new Error("Failed to update");

            toast.success("Order status updated successfully");
            fetchOrder();
        } catch (error) {
            console.error("Failed to update order:", error);
            toast.error("Failed to update order");
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateDate = async () => {
        if (!newDate) return;
        setUpdating(true);
        try {
            const response = await fetch(`/api/admin/orders/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ created_at: new Date(newDate).toISOString() }),
            });

            if (!response.ok) throw new Error("Failed to update date");

            toast.success("Order date updated successfully");
            setIsEditingDate(false);
            fetchOrder();
        } catch (error) {
            console.error("Failed to update date:", error);
            toast.error("Failed to update date");
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateUpi = async () => {
        setUpdating(true);
        try {
            const response = await fetch(`/api/admin/orders/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payment_upi_id: newUpi || null }),
            });

            if (!response.ok) throw new Error("Failed to update UPI ID");

            toast.success("UPI ID updated successfully");
            setIsEditingUpi(false);
            fetchOrder();
        } catch (error) {
            console.error("Failed to update UPI ID:", error);
            toast.error("Failed to update UPI ID");
        } finally {
            setUpdating(false);
        }
    };

    const isValidUpi = (upi: string) => {
        if (!upi || upi.trim() === "") return true; // Allowed to clear it
        return /^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi);
    };

    const handleDelete = async () => {
        if (!order) return;

        setDeleting(true);
        try {
            const response = await fetch("/api/admin/orders/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id }),
            });

            if (response.ok) {
                toast.success("Order deleted successfully");
                router.push("/admin/orders");
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to delete order");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("An error occurred while deleting the order");
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const handleAssignDelivery = async () => {
        if (!volunteerIdInput.trim()) {
            toast.error("Please enter a volunteer ID");
            return;
        }

        setAssigningDelivery(true);
        try {
            const response = await fetch(`/api/admin/orders/${id}/assign-delivery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    volunteerId: volunteerIdInput,
                    deliveryMethod,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to assign delivery");
            }

            const data = await response.json();
            toast.success(`Delivery assigned to ${data.volunteer.name}`);
            setVolunteerIdInput("");
            fetchOrder(); // Refresh to show updated delivery info
        } catch (error: any) {
            toast.error(error.message || "Failed to assign delivery");
        } finally {
            setAssigningDelivery(false);
        }
    };

    const handleResendEmail = async () => {
        if (!order?.customer_email) return;

        setResendingEmail(true);
        try {
            const response = await fetch(`/api/admin/orders/${id}/resend-email`, {
                method: "POST",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to resend email");
            }

            toast.success(data.message || "Email resent successfully");

            // Auto update email_sent status if not already set
            if (!order.email_sent) {
                await fetch(`/api/admin/orders/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email_sent: true }),
                });
                fetchOrder();
            }

        } catch (error: any) {
            console.error("Resend email error:", error);
            toast.error(error.message || "An error occurred while resending the email");
        } finally {
            setResendingEmail(false);
        }
    };

    const toggleWhatsAppStatus = async () => {
        if (!order) return;
        setUpdating(true);
        try {
            const newStatus = !order.whatsapp_sent;
            const response = await fetch(`/api/admin/orders/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ whatsapp_sent: newStatus }),
            });
            if (!response.ok) throw new Error("Failed to update status");

            toast.success(`WhatsApp status marked as ${newStatus ? 'Sent' : 'Not Sent'}`);
            fetchOrder();
        } catch (error) {
            toast.error("Failed to update WhatsApp status");
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveNote = async () => {
        setSavingNote(true);
        try {
            const response = await fetch(`/api/admin/orders/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ admin_notes: noteInput }),
            });
            if (!response.ok) throw new Error("Failed to save note");

            toast.success("Note saved successfully");
            setIsEditingNote(false);
            fetchOrder();
        } catch (error) {
            toast.error("Failed to save note");
        } finally {
            setSavingNote(false);
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: "Pending",
            confirmed: "Confirmed",
            delivered: "Delivered",
            cant_reach: "Can't Reach",
            cancelled: "Cancelled",
        };
        return labels[status] || status;
    };

    const handleWhatsAppMessage = async (order: Order) => {
        if (!order.whatsapp_number) return;

        toast.info("Preparing WhatsApp message and poster...", { id: "wa-prep" });

        try {
            // Generate Thanks Poster programmatically
            const canvas = document.createElement("canvas");
            const width = 1080;
            const height = 1350;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            if (ctx) {
                const img = document.createElement("img");
                img.crossOrigin = "anonymous";

                await new Promise((resolve) => {
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, width, height);
                        ctx.textAlign = "left";
                        ctx.textBaseline = "middle";
                        ctx.font = "bold 40px sans-serif";
                        ctx.fillStyle = "#ffffff";
                        ctx.fillText(order.customer_name, 110, 480);

                        canvas.toBlob(async (blob) => {
                            if (blob) {
                                try {
                                    await navigator.clipboard.write([
                                        new ClipboardItem({ "image/png": blob })
                                    ]);
                                    resolve(true);
                                } catch (err) {
                                    console.error("Clipboard write failed:", err);
                                    resolve(false);
                                }
                            } else {
                                resolve(false);
                            }
                        }, "image/png");
                    };
                    img.onerror = () => resolve(false);
                    img.src = "/assets/thankYou_Ml.png";
                });
            }

            const statusLabel = getStatusLabel(order.order_status);
            const baseUrl = window.location.origin;
            const trackUrl = `${baseUrl}/track/${order.id}`;
            const dashboardUrl = `${baseUrl}/customer/dashboard`;

            const message = `Assalamu Alaykum, ${order.customer_name},

Thank you for your order with Attar al-Jannah!

*Order Status*: ${statusLabel}
*Quantity*: ${order.quantity} bottle(s)
*Total Price*: ₹${order.total_price}

*Track your delivery here:*
${trackUrl}

*View your orders & invoice here:*
${dashboardUrl}

جزاك الله خيراً`;

            const encodedMessage = encodeURIComponent(message);
            const cleanNumber = order.whatsapp_number.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanNumber}?text=${encodedMessage}`, "_blank");

            toast.dismiss("wa-prep");
            toast.success("Ready! Hit Paste (Cmd+V / Ctrl+V) in WhatsApp to attach the poster.", { duration: 6000 });

            // Auto update whatsapp_sent status if not already set
            if (!order.whatsapp_sent) {
                await fetch(`/api/admin/orders/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ whatsapp_sent: true }),
                });
                fetchOrder(); // Refresh to show the badge
            }

        } catch (error) {
            console.error("WhatsApp prep failed:", error);
            toast.dismiss("wa-prep");
            toast.error("Failed to prepare message.");
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading order details...</div>;
    }

    if (!order) {
        return <div className="text-center py-12">Order not found</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl relative">
            <div className="flex items-center gap-4">
                <Link href="/admin/orders">
                    <Button variant="outline" size="icon" className="rounded-xl">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Order Details</h1>
                    <p className="text-muted-foreground">Order ID: {order.id.slice(0, 8)}</p>
                </div>
            </div>

            {/* Floating Action Buttons - Auto-hide on scroll */}
            <AutoHideContainer className="fixed top-20 right-6 z-40 flex flex-col gap-2 md:static md:absolute md:right-0 md:top-1 md:flex-row md:ml-auto">
                <EditOrderDialog
                    orderId={order.id}
                    onSuccess={fetchOrder}
                    trigger={
                        <Button
                            variant="outline"
                            className="rounded-xl"
                        >
                            <Pencil className="w-4 h-4 mr-2" />
                            <span className="hidden md:inline">Edit Order</span>
                        </Button>
                    }
                />
                <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => setDeleteDialogOpen(true)}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span className="hidden md:inline">Delete Order</span>
                </Button>
            </AutoHideContainer>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <Card className="rounded-3xl">
                    <CardHeader>
                        <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-medium">{order.customer_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <div className="flex items-center gap-2">
                                <p className="font-medium">{order.customer_phone}</p>
                                <a href={`tel:${order.customer_phone}`}>
                                    <Button variant="outline" size="sm" className="rounded-xl">
                                        <Phone className="h-3 w-3" />
                                    </Button>
                                </a>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">WhatsApp</p>
                            <div className="flex items-center gap-2">
                                <p className="font-medium">{order.whatsapp_number}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => handleWhatsAppMessage(order)}
                                >
                                    <MessageCircle className="h-3 w-3 mr-1" /> Message
                                </Button>
                                <Button
                                    variant={order.whatsapp_sent ? "default" : "outline"}
                                    size="sm"
                                    className={`rounded-xl px-2 h-7 ${order.whatsapp_sent ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                    onClick={toggleWhatsAppStatus}
                                    disabled={updating}
                                >
                                    {order.whatsapp_sent ? 'Sent ✓' : 'Mark Sent'}
                                </Button>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <div className="flex items-center gap-2">
                                {order.customer_email ? (
                                    <>
                                        <p className="font-medium">{order.customer_email}</p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-xl h-7 px-2"
                                                onClick={handleResendEmail}
                                                disabled={resendingEmail}
                                            >
                                                <Mail className="h-3 w-3 mr-1" />
                                                {resendingEmail ? "Sending..." : "Resend"}
                                            </Button>
                                            {order.email_sent && (
                                                <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full flex items-center">
                                                    Sent ✓
                                                </span>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm italic text-muted-foreground">(Not provided)</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Address</p>
                            <p className="font-medium">{order.customer_address}</p>
                            {/* Google Maps Link */}
                            {order.customer_address && (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer_address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-sm font-medium text-primary transition-colors"
                                >
                                    <MapPin className="w-4 h-4" />
                                    View on Maps
                                </a>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Order Information */}
                <Card className="rounded-3xl">
                    <CardHeader>
                        <CardTitle>Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Product</p>
                            <p className="font-medium">{order.product_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Quantity</p>
                            <p className="font-medium">{order.quantity} bottle(s)</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Price</p>
                            <p className="text-2xl font-bold text-primary">₹{order.total_price}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Payment Method</p>
                            <p className="font-medium">{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method === 'volunteer_cash' ? 'Cash (Volunteer)' : order.payment_method === 'qr' ? 'UPI' : order.payment_method === 'razorpay' ? 'Razorpay' : order.payment_method}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Cash Received</p>
                            <Button
                                variant={order.cash_received ? "default" : "outline"}
                                size="sm"
                                className={`rounded-xl px-2 h-7 ${order.cash_received ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}
                                onClick={async () => {
                                    setUpdating(true);
                                    try {
                                        const response = await fetch(`/api/admin/orders/${id}`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ cash_received: !order.cash_received }),
                                        });
                                        if (response.ok) {
                                            toast.success(`Cash marked as ${!order.cash_received ? 'received' : 'not received'}`);
                                            fetchOrder();
                                        } else {
                                            toast.error("Failed to update cash status");
                                        }
                                    } finally {
                                        setUpdating(false);
                                    }
                                }}
                                disabled={updating}
                            >
                                {order.cash_received ? 'Yes ✓' : 'No ✗'}
                            </Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Order Date</p>
                                {isEditingDate ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Input
                                            type="datetime-local"
                                            value={newDate}
                                            onChange={(e) => setNewDate(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={handleUpdateDate}
                                            disabled={updating}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setIsEditingDate(false);
                                                setNewDate("");
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">
                                            {new Date(order.created_at).toLocaleString()}
                                        </p>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                            onClick={() => {
                                                const d = new Date(order.created_at);
                                                // Format to YYYY-MM-DDThh:mm for input type datetime-local
                                                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                                                setNewDate(d.toISOString().slice(0, 16));
                                                setIsEditingDate(true);
                                            }}
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div>
                                <p className="text-sm text-muted-foreground">Paid To (UPI ID)</p>
                                {isEditingUpi ? (
                                    <div className="flex flex-col gap-1 mt-1">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="text"
                                                value={newUpi}
                                                onChange={(e) => setNewUpi(e.target.value)}
                                                placeholder="Enter UPI ID"
                                                className={`h-8 text-sm max-w-[200px] ${!isValidUpi(newUpi) && newUpi !== "" ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                                list="upi-suggestions"
                                            />
                                            <datalist id="upi-suggestions">
                                                {historicalUpis.map(upi => (
                                                    <option key={upi} value={upi} />
                                                ))}
                                            </datalist>
                                            <Button
                                                size="sm"
                                                onClick={handleUpdateUpi}
                                                disabled={updating || (!isValidUpi(newUpi) && newUpi !== "")}
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setIsEditingUpi(false);
                                                    setNewUpi("");
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                        {!isValidUpi(newUpi) && newUpi !== "" && (
                                            <span className="text-xs text-red-500 font-medium">Please enter a valid UPI ID (e.g., name@bank)</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {order.payment_upi_id ? (
                                            <p className="font-medium font-mono text-sm bg-muted/50 w-fit px-2 py-0.5 rounded">
                                                {order.payment_upi_id}
                                            </p>
                                        ) : (
                                            <p className="text-sm italic text-muted-foreground">
                                                Not recorded
                                            </p>
                                        )}
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                            onClick={() => {
                                                setNewUpi(order.payment_upi_id || "");
                                                setIsEditingUpi(true);
                                            }}
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {order.volunteers && (
                            <div className="pt-2 border-t border-border/50">
                                <p className="text-sm text-muted-foreground">Referred by Volunteer</p>
                                <p className="font-medium text-primary">{order.volunteers.name}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Admin Notes */}
                <Card className="rounded-3xl md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between py-4">
                        <CardTitle className="text-lg">Admin Notes (Internal)</CardTitle>
                        {!isEditingNote && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl h-8"
                                onClick={() => {
                                    setNoteInput(order.admin_notes || "");
                                    setIsEditingNote(true);
                                }}
                            >
                                <Pencil className="h-3 w-3 mr-2" />
                                {order.admin_notes ? "Edit Note" : "Add Note"}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {isEditingNote ? (
                            <div className="space-y-3">
                                <textarea
                                    className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="Add notes about this order..."
                                    value={noteInput}
                                    onChange={(e) => setNoteInput(e.target.value)}
                                />
                                <div className="flex items-center gap-2 justify-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-xl"
                                        onClick={() => setIsEditingNote(false)}
                                        disabled={savingNote}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="rounded-xl"
                                        onClick={handleSaveNote}
                                        disabled={savingNote}
                                    >
                                        {savingNote ? "Saving..." : "Save Note"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-muted/30 p-4 rounded-xl min-h-[80px]">
                                {order.admin_notes ? (
                                    <p className="whitespace-pre-wrap text-sm">{order.admin_notes}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic text-center mt-2">No notes added yet.</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Payment Screenshot */}
            {
                order.payment_screenshot_url && (
                    <Card className="rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                Payment Screenshot
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative w-full max-w-md h-96 rounded-2xl overflow-hidden border-2 border-border">
                                <Image
                                    src={order.payment_screenshot_url}
                                    alt="Payment screenshot"
                                    fill
                                    className="object-contain"
                                />
                            </div>

                            {/* AI Verification Badge */}
                            {order.screenshot_verified !== null && order.screenshot_verified !== undefined && (
                                <div className={`p-3 rounded-2xl border text-sm ${order.screenshot_verified
                                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                                    : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                                    }`}>
                                    <div className="flex items-center gap-2 font-medium">
                                        <span>{order.screenshot_verified ? "🛡️ AI Verified" : "⚠️ Not Verified"}</span>
                                    </div>
                                    {order.screenshot_verification_details && (
                                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                            {order.screenshot_verification_details.extracted?.amount && (
                                                <p>Amount detected: <span className={order.screenshot_verification_details.checks?.amount_match === false ? "text-red-500 font-bold" : ""}>₹{order.screenshot_verification_details.extracted.amount}</span></p>
                                            )}
                                            {order.screenshot_verification_details.extracted?.app_name && (
                                                <p>App: {order.screenshot_verification_details.extracted.app_name}</p>
                                            )}
                                            {order.extracted_transaction_id && (
                                                <p>Txn ID: <code className="bg-muted px-1 rounded">{order.extracted_transaction_id}</code></p>
                                            )}
                                            {order.screenshot_verification_details.checks?.is_duplicate && (
                                                <p className="text-red-500 font-bold">⚠️ Duplicate transaction ID detected!</p>
                                            )}
                                            {order.screenshot_verification_details.message && (
                                                <p className="italic">{order.screenshot_verification_details.message}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            }

            {/* Thank You Poster */}
            <Card className="rounded-3xl">
                <CardHeader>
                    <CardTitle>Thank You Poster</CardTitle>
                </CardHeader>
                <CardContent>
                    <ThankYouPoster customerName={order.customer_name} />
                </CardContent>
            </Card>

            {/* Delivery Management - Moved above detailed volunteer assignment */}
            <DeliveryManagement
                orderId={order.id}
                volunteerId={order.delivery_volunteer_id}
                isDeliveryDuty={order.is_delivery_duty}
                deliveryMethod={order.delivery_method}
                deliveryFee={order.delivery_fee}
                onRefresh={fetchOrder}
            />

            {/* Tracking Timeline */}
            <Card className="rounded-3xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Delivery Tracking
                        </CardTitle>
                        <Link href={`/track/${order.id}`} target="_blank">
                            <Button variant="outline" size="sm" className="rounded-xl text-xs">
                                Public Tracking Page ↗
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <TrackingTimeline orderId={order.id} />
                </CardContent>
            </Card>

            {/* Order Bill/Invoice */}
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Order Invoice</h2>
                <OrderBill order={order} />
            </div>

            {/* Status Update */}
            <Card className="rounded-3xl">
                <CardHeader>
                    <CardTitle>Update Order Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Order Status</Label>
                        <Select
                            value={newStatus}
                            onValueChange={setNewStatus}
                        >
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cant_reach">Can&apos;t Reach</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={handleStatusUpdate}
                        disabled={updating || newStatus === order.order_status}
                        className="bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl"
                    >
                        {updating ? "Updating..." : "Update Status"}
                    </Button>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this order for <strong>{order.customer_name}</strong>?
                            <br />
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}