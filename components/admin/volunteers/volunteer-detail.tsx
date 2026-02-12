
"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Edit,
    Trash2,
    Package,
    TrendingUp,
    DollarSign,
    Award,
    Calendar,
    Mail,
    Phone,
    MapPin,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
    Truck
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ShareButton } from "@/components/ui/share-button"; // Generic share button
import { toast } from "sonner";
import { getInitials } from "@/lib/utils/image-utils";
import Link from "next/link";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch data");
    return res.json();
});

interface VolunteerDetailProps {
    volunteer: any; // Using any for simplicity as DB schema types might vary
}

export function VolunteerDetail({ volunteer }: VolunteerDetailProps) {
    const router = useRouter();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    // Fetch analytics
    const { data: analytics, error: analyticsError, isLoading: analyticsLoading } = useSWR(
        `/api/admin/volunteers/${volunteer.id}/analytics`,
        fetcher
    );

    // Fetch orders (simplified pagination for now)
    const [page, setPage] = useState(1);
    const { data: ordersData, error: ordersError, isLoading: ordersLoading } = useSWR(
        `/api/admin/volunteers/${volunteer.id}/orders?page=${page}&limit=50`,
        fetcher
    );

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/volunteers/${volunteer.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete volunteer");
            }

            toast.success("Volunteer deleted successfully");
            router.push("/admin/volunteers");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete volunteer");
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    // Helper to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    // Share data
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/profile/${volunteer.volunteer_id}` : "";

    // Construct share text with stats if available
    const bottlesSold = analytics?.overview?.totalBottles || 0;
    const shareText = bottlesSold > 0
        ? `Check out ${volunteer.name}'s volunteer profile! They've sold ${bottlesSold} bottles so far.`
        : `Check out ${volunteer.name}'s profile on Attar Al Jannah!`;

    const shareData = {
        title: `${volunteer.name} - Attar Al Jannah Volunteer`,
        text: shareText,
        url: shareUrl,
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>

                    <Avatar className="w-20 h-20 border-4 border-background shadow-md">
                        <AvatarImage src={volunteer.profile_photo || undefined} alt={volunteer.name} className="object-cover" />
                        <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                            {getInitials(volunteer.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div>
                        <h1 className="text-2xl font-bold">{volunteer.name}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>ID: {volunteer.volunteer_id}</span>
                            <Badge variant={volunteer.status === "active" ? "default" : "secondary"}>
                                {volunteer.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <ShareButton data={shareData} variant="outline" />

                    <Button variant="outline" onClick={() => router.push(`/admin/volunteers/${volunteer.id}/edit`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>

                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Volunteer</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete {volunteer.name}? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                    {isDeleting ? "Deleting..." : "Delete Volunteer"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Quick Stats Grid - High Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bottles</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {analyticsLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{analytics?.overview?.totalBottles || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    {(analytics?.performance?.goal?.progress || 0)}% of goal ({analytics?.performance?.goal?.target})
                                </p>
                                <Progress value={analytics?.performance?.goal?.progress || 0} className="h-1 mt-2" />
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {analyticsLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{formatCurrency(analytics?.overview?.totalRevenue)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Avg. Order: {formatCurrency(analytics?.performance?.avgOrderValue)}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Commission</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {analyticsLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{formatCurrency(analytics?.overview?.commission)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Pending payout
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Performance</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {analyticsLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{analytics?.performance?.conversionRate}%</div>
                                <p className="text-xs text-muted-foreground">
                                    Conversion Rate
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    {/* <TabsTrigger value="delivery">Delivery</TabsTrigger> */}
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Contact Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span>{volunteer.email || "No email"}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{volunteer.phone}</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                                    <span className="whitespace-pre-line">
                                        {[
                                            volunteer.address,
                                            volunteer.city,
                                            volunteer.state,
                                            volunteer.pincode
                                        ].filter(Boolean).join(", ") || "No address"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span>Joined {format(new Date(volunteer.created_at || new Date()), "PPP")}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Delivery Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Delivery Performance</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {analyticsLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Success Rate</span>
                                            <span className="font-medium">{analytics?.performance?.successRate}%</span>
                                        </div>
                                        <Progress value={analytics?.performance?.successRate || 0} className="h-2" />

                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                                                <CheckCircle2 className="w-5 h-5 text-green-500 mb-1" />
                                                <span className="text-xl font-bold">{analytics?.deliveryStats?.totalDeliveries}</span>
                                                <span className="text-xs text-muted-foreground">Delivered</span>
                                            </div>
                                            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                                                <XCircle className="w-5 h-5 text-red-500 mb-1" />
                                                <span className="text-xl font-bold">{analytics?.deliveryStats?.cancelledDeliveries}</span>
                                                <span className="text-xs text-muted-foreground">Cancelled</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="orders">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                            <CardDescription>
                                Total {analytics?.overview?.totalOrdersCount || 0} orders found
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ordersLoading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : ordersData?.orders?.length > 0 ? (
                                        ordersData.orders.map((order: any) => (
                                            <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                                                <TableCell className="font-mono text-xs">{order.order_id}</TableCell>
                                                <TableCell>{format(new Date(order.created_at), "MMM d, yyyy")}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`
                                                        ${order.status === 'delivered' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
                                                        ${order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : ''}
                                                        ${order.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
                                                    `}>
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{order.total_quantity} bottles</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(order.total_amount)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No orders found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
