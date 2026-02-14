"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Phone, MessageCircle, Image as ImageIcon, Trash2, Pencil, MapPin, Truck } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Image from "next/image";
import Link from "next/link";
import { OrderBill } from "@/components/order-bill";
import { ThankYouPoster } from "@/components/thank-you-poster";
import { AutoHideContainer } from "@/components/custom/auto-hide-container";
import { DeliveryManagement } from "@/components/admin/delivery-management";
import { VolunteerAssignment } from "@/components/admin/volunteer-assignment";

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
    volunteer_id?: string;
    delivery_volunteer_id?: string; // Human-readable volunteer ID like VOL001
    is_delivery_duty?: boolean;
    delivery_method?: string;
    delivery_fee?: number;
    created_at: string;
    volunteers?: { name: string } | null;
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
    const [deliveryRequests, setDeliveryRequests] = useState<any[]>([]);

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
                {/* {order.order_status === 'ordered' && (
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => router.push(`/order?edit=${order.id}`)}
                    >
                        <Pencil className="w-4 h-4 mr-2" />
                        <span className="hidden md:inline">Edit Order</span>
                    </Button>
                )} */}
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
                                <a
                                    href={`https://wa.me/91${order.whatsapp_number}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="outline" size="sm" className="rounded-xl">
                                        <MessageCircle className="h-3 w-3" />
                                    </Button>
                                </a>
                            </div>
                        </div>
                        {order.customer_email && (
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{order.customer_email}</p>
                            </div>
                        )}
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
                            <p className="font-medium capitalize">{order.payment_method}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Order Date</p>
                            <p className="font-medium">
                                {new Date(order.created_at).toLocaleString()}
                            </p>
                        </div>
                        {order.volunteers && (
                            <div className="pt-2 border-t border-border/50">
                                <p className="text-sm text-muted-foreground">Referred by Volunteer</p>
                                <p className="font-medium text-primary">{order.volunteers.name}</p>
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
                        <CardContent>
                            <div className="relative w-full max-w-md h-96 rounded-2xl overflow-hidden border-2 border-border">
                                <Image
                                    src={order.payment_screenshot_url}
                                    alt="Payment screenshot"
                                    fill
                                    className="object-contain"
                                />
                            </div>
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
                                <SelectItem value="ordered">Ordered</SelectItem>
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
