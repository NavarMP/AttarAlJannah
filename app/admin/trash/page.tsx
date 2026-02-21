"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
    Trash2,
    RotateCcw,
    Package,
    Award,
    Users,
    Loader2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Clock,
    MessageSquare,
    Image as ImageIcon,
} from "lucide-react";

interface TrashItem {
    // Common
    id: string;
    deleted_at: string;
    deleted_by: string;
    created_at: string;

    // orders
    customer_name?: string;
    customer_phone?: string;
    product_name?: string;
    volunteer_id?: string;
    quantity?: number;
    total_price?: number;
    order_status?: string;

    // volunteers & customers
    name?: string;
    phone?: string;
    total_orders?: number;
    total_sales?: number;

    // feedback
    category?: string;
    status?: string;
    rating_overall?: number;

    // promo_content
    title?: string;
    type?: string;
    is_active?: boolean;
}

const TAB_CONFIG = {
    orders: { label: "Orders", icon: Package },
    volunteers: { label: "Volunteers", icon: Award },
    customers: { label: "Customers", icon: Users },
    feedback: { label: "Feedback", icon: MessageSquare },
    promo_content: { label: "Promo", icon: ImageIcon },
};

export default function TrashPage() {
    const { hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState<"orders" | "volunteers" | "customers" | "feedback" | "promo_content">("orders");
    const [items, setItems] = useState<TrashItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [restoring, setRestoring] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchTrash = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/trash?type=${activeTab}&page=${page}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
                setTotalPages(data.totalPages);
                setTotalCount(data.totalCount);
            }
        } catch {
            toast.error("Failed to fetch trash");
        } finally {
            setLoading(false);
        }
    }, [activeTab, page]);

    useEffect(() => {
        setSelectedIds([]);
        setPage(1);
    }, [activeTab]);

    useEffect(() => {
        fetchTrash();
    }, [fetchTrash]);

    const handleRestore = async (ids: string[]) => {
        setRestoring(true);
        try {
            const res = await fetch("/api/admin/trash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entityType: activeTab, ids }),
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(`Restored ${data.restoredCount} item(s)`);
                setSelectedIds([]);
                fetchTrash();
            } else {
                const err = await res.json();
                toast.error(err.error || "Restore failed");
            }
        } catch {
            toast.error("Restore failed");
        } finally {
            setRestoring(false);
        }
    };

    const handlePermanentDelete = async (ids: string[]) => {
        setDeleting(true);
        try {
            const res = await fetch("/api/admin/trash", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entityType: activeTab, ids }),
            });
            if (res.ok) {
                toast.success("Permanently deleted");
                setSelectedIds([]);
                fetchTrash();
            } else {
                const err = await res.json();
                toast.error(err.error || "Delete failed");
            }
        } catch {
            toast.error("Delete failed");
        } finally {
            setDeleting(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map((i) => i.id));
        }
    };

    const getDisplayName = (item: TrashItem) => {
        if (activeTab === "orders") return `${item.product_name} (${item.customer_name})`;
        if (activeTab === "promo_content") return item.title;
        return item.name || "Unknown";
    };

    const getDisplayPhone = (item: TrashItem) => {
        if (activeTab === "promo_content") return item.type || "N/A";
        return item.phone || item.customer_phone || "N/A";
    };

    const daysUntilPurge = (deletedAt: string) => {
        const deleted = new Date(deletedAt);
        const purgeDate = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const days = Math.ceil((purgeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, days);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Trash2 className="h-6 w-6" />
                    Trash / Bin
                </h1>
                <p className="text-muted-foreground mt-1">
                    Deleted items can be restored within 30 days
                </p>
            </div>

            {/* Warning Banner */}
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        Items are automatically <strong>permanently deleted after 30 days</strong> in the trash.
                        Restore important items before they expire.
                    </p>
                </CardContent>
            </Card>

            {/* Tab Buttons */}
            <div className="flex gap-2">
                {(Object.keys(TAB_CONFIG) as Array<keyof typeof TAB_CONFIG>).map((tab) => {
                    const config = TAB_CONFIG[tab];
                    const Icon = config.icon;
                    return (
                        <Button
                            key={tab}
                            variant={activeTab === tab ? "default" : "outline"}
                            className="rounded-xl"
                            onClick={() => setActiveTab(tab)}
                        >
                            <Icon className="mr-2 h-4 w-4" />
                            {config.label}
                        </Button>
                    );
                })}
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <Card className="border-primary">
                    <CardContent className="py-3 flex items-center justify-between">
                        <span className="text-sm font-medium">
                            {selectedIds.length} item(s) selected
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => handleRestore(selectedIds)}
                                disabled={restoring}
                            >
                                {restoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                                Restore Selected
                            </Button>
                            {hasPermission("super_admin") && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive" className="rounded-xl">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Forever
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                                Permanently Delete?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. {selectedIds.length} item(s)
                                                will be permanently removed from the database.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                onClick={() => handlePermanentDelete(selectedIds)}
                                                disabled={deleting}
                                            >
                                                {deleting ? "Deleting..." : "Delete Forever"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Items Table */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                        {totalCount} deleted {activeTab}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Trash is empty for {activeTab}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        <Checkbox
                                            checked={selectedIds.length === items.length}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Deleted By</TableHead>
                                    <TableHead>Deleted At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => {
                                    const daysRemaining = daysUntilPurge(item.deleted_at);
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(item.id)}
                                                    onCheckedChange={() => toggleSelect(item.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-medium text-lg leading-tight">
                                                        {getDisplayName(item)}
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={daysRemaining <= 3 ? "text-destructive border-destructive" : "text-muted-foreground"}
                                                    >
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {daysRemaining}d left
                                                    </Badge>
                                                </div>

                                                <div className="text-sm text-muted-foreground flex items-center justify-between mb-2">
                                                    <span>{getDisplayPhone(item)}</span>
                                                    {activeTab === "orders" && (
                                                        <span className="font-medium text-foreground">
                                                            RM {(item.total_price || 0).toFixed(2)}
                                                        </span>
                                                    )}
                                                    {activeTab === "feedback" && (
                                                        <span className="font-medium text-foreground capitalize">
                                                            {item.category || "General"}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {item.deleted_by?.split("@")[0] || "Unknown"}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(item.deleted_at).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-xl"
                                                        onClick={() => handleRestore([item.id])}
                                                        disabled={restoring}
                                                    >
                                                        <RotateCcw className="h-3 w-3 mr-1" />
                                                        Restore
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
