"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Search, Trash2, Loader2, Phone, Mail, Package } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Customer {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    total_orders: number;
    last_order_at: string | null;
    created_at: string;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        withOrders: 0,
        newThisMonth: 0,
    });

    const fetchCustomers = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);

            const response = await fetch(`/api/admin/customers?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to fetch customers");

            const data = await response.json();
            setCustomers(data.customers || []);

            // Calculate stats
            const total = data.customers?.length || 0;
            const withOrders = data.customers?.filter((c: Customer) => c.total_orders > 0).length || 0;
            const now = new Date();
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const newThisMonth = data.customers?.filter((c: Customer) =>
                new Date(c.created_at) >= thisMonth
            ).length || 0;

            setStats({ total, withOrders, newThisMonth });
        } catch (error) {
            console.error("Error fetching customers:", error);
            toast.error("Failed to load customers");
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            setIsDeleting(true);
            const response = await fetch(`/api/admin/customers/${deleteId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete customer");

            toast.success("Customer deleted successfully");
            setDeleteId(null);
            fetchCustomers();
        } catch (error) {
            console.error("Error deleting customer:", error);
            toast.error("Failed to delete customer");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Customers Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage customer accounts and view order history
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="glass-strong">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Customers
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            All registered customers
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-strong">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            With Orders
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.withOrders}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Customers who placed orders
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-strong">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            New This Month
                        </CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{stats.newThisMonth}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Joined this month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card className="glass-strong">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, phone, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Customers Table */}
            <Card className="glass-strong">
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : !customers || customers.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                            <p className="mt-4 text-lg font-medium">No customers found</p>
                            <p className="text-sm text-muted-foreground">
                                {searchQuery ? "Try a different search term" : "Customers will appear here after their first order"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Orders</TableHead>
                                        <TableHead>Last Order</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-medium">
                                                {customer.name || <span className="text-muted-foreground italic">No name</span>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                    <span className="font-mono text-sm">{customer.phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {customer.email ? (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-sm">{customer.email}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic text-sm">No email</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold">{customer.total_orders}</span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {customer.last_order_at
                                                    ? new Date(customer.last_order_at).toLocaleDateString()
                                                    : <span className="italic">Never</span>}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(customer.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteId(customer.id)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the customer
                            profile. Their past orders will remain in the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Customer"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
