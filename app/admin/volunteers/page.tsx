"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Users, Plus, Search, Edit, Trash2, TrendingUp, Award, Loader2, Trash, Link2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { calculateCommission } from "@/lib/utils/commission-utils";
import { Checkbox } from "@/components/ui/checkbox";

interface Volunteer {
    id: string;
    name: string;
    email: string;
    phone: string;
    volunteer_id: string;
    address: string | null;
    confirmed_bottles: number;
    goal: number;
    progress_percentage: number;
    created_at: string;
}

export default function VolunteersPage() {
    const router = useRouter();
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sort, setSort] = useState("created_at");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        topPerformer: null as Volunteer | null,
    });

    // Bulk delete state
    const [selectedVolunteers, setSelectedVolunteers] = useState<Set<string>>(new Set());
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    const fetchVolunteers = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            params.append("page", currentPage.toString());
            params.append("limit", "50"); // Show 50 per page
            if (searchQuery) params.append("search", searchQuery);
            params.append("sort", sort);

            const response = await fetch(`/api/admin/volunteers?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to fetch volunteers");

            const data = await response.json();
            setVolunteers(data.volunteers || []);
            setTotalPages(data.pagination.totalPages || 1);

            // Calculate stats
            const total = data.pagination.total;
            const active = data.volunteers.filter((s: Volunteer) => s.confirmed_bottles > 0).length;
            const topPerformer = data.volunteers.reduce((top: Volunteer | null, current: Volunteer) =>
                (!top || current.confirmed_bottles > top.confirmed_bottles) ? current : top,
                null
            );

            setStats({ total, active, topPerformer });

        } catch (error) {
            console.error("Error fetching volunteers:", error);
            toast.error("Failed to load volunteers");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, searchQuery, sort]);

    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 when search or sort changes
        fetchVolunteers();
        // Clear selection when search changes
        setSelectedVolunteers(new Set());
    }, [searchQuery, sort, fetchVolunteers]);

    useEffect(() => {
        fetchVolunteers();
        // Clear selection when page changes
        setSelectedVolunteers(new Set());
    }, [currentPage, fetchVolunteers]);

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            setIsDeleting(true);
            const response = await fetch(`/api/admin/volunteers/${deleteId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete volunteer");

            toast.success("Volunteer deleted successfully");
            setDeleteId(null);
            fetchVolunteers();

        } catch (error) {
            console.error("Error deleting volunteer:", error);
            toast.error("Failed to delete volunteer");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedVolunteers.size === 0) return;

        setBulkDeleting(true);
        try {
            const response = await fetch("/api/admin/volunteers/bulk-delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ volunteerIds: Array.from(selectedVolunteers) }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || `Deleted ${data.deletedCount} volunteer(s) from database`);
                setSelectedVolunteers(new Set());
                fetchVolunteers();
            } else {
                toast.error(data.error || "Failed to bulk delete volunteers");
            }
        } catch (error) {
            console.error("Bulk delete error:", error);
            toast.error("An error occurred while deleting volunteers");
        } finally {
            setBulkDeleting(false);
            setBulkDeleteDialogOpen(false);
        }
    };

    const toggleVolunteerSelection = (volunteerId: string) => {
        const newSelection = new Set(selectedVolunteers);
        if (newSelection.has(volunteerId)) {
            newSelection.delete(volunteerId);
        } else {
            newSelection.add(volunteerId);
        }
        setSelectedVolunteers(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedVolunteers.size === volunteers.length) {
            setSelectedVolunteers(new Set());
        } else {
            setSelectedVolunteers(new Set(volunteers.map(v => v.id)));
        }
    };

    const handleCopyReferralLink = (volunteerId: string) => {
        const link = `${window.location.origin}/order?ref=${volunteerId}`;
        navigator.clipboard.writeText(link);
        toast.success("Referral link copied to clipboard");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Volunteers Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage volunteer accounts and track their progress
                    </p>
                </div>
                <Link href="/admin/volunteers/new">
                    <Button className="bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Volunteer
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Volunteers
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Volunteers
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{stats.active}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            With confirmed bottles
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass border-gold-300 dark:border-gold-700">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Top Performer
                        </CardTitle>
                        <Award className="h-4 w-4 text-gold-500" />
                    </CardHeader>
                    <CardContent>
                        {stats.topPerformer ? (
                            <>
                                <div className="text-lg font-bold truncate">{stats.topPerformer.name}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stats.topPerformer.confirmed_bottles} bottles sold
                                </p>
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground">No data yet</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Search and Sort */}
            <Card className="glass-strong">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, volunteer ID, email, or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                            >
                                <option value="created_at">Newest First</option>
                                <option value="name">Name (A-Z)</option>
                                <option value="bottles">Most Bottles</option>
                                <option value="goal">Highest Goal</option>
                                <option value="progress">Highest Progress</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Volunteers Table */}
            <Card className="glass-strong">
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : !volunteers || volunteers.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                            <p className="mt-4 text-lg font-medium">No volunteers found</p>
                            <p className="text-sm text-muted-foreground">
                                {searchQuery ? "Try a different search term" : "Add your first volunteer to get started"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <Checkbox
                                                checked={volunteers.length > 0 && selectedVolunteers.size === volunteers.length}
                                                onCheckedChange={toggleSelectAll}
                                                aria-label="Select all volunteers"
                                            />
                                        </TableHead>
                                        <TableHead>Volunteer ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Bottles</TableHead>
                                        <TableHead>Goal</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead>Commission</TableHead>
                                        <TableHead>Ref Link</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {volunteers.map((volunteer) => (
                                        <TableRow
                                            key={volunteer.id}
                                            className={selectedVolunteers.has(volunteer.id) ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
                                        >
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedVolunteers.has(volunteer.id)}
                                                    onCheckedChange={() => toggleVolunteerSelection(volunteer.id)}
                                                    aria-label={`Select ${volunteer.name}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-mono font-semibold">
                                                {volunteer.volunteer_id}
                                            </TableCell>
                                            <TableCell className="font-medium">{volunteer.name}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {volunteer.email}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {volunteer.phone}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold">{volunteer.confirmed_bottles}</span>
                                            </TableCell>
                                            <TableCell>{volunteer.goal}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-primary to-gold-500"
                                                            style={{ width: `${Math.min(volunteer.progress_percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        {volunteer.progress_percentage}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold text-gold-600 dark:text-gold-400">
                                                    ₹{calculateCommission(volunteer.confirmed_bottles, volunteer.goal)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopyReferralLink(volunteer.volunteer_id);
                                                    }}
                                                    title="Copy Referral Link"
                                                >
                                                    <Link2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/admin/volunteers/${volunteer.id}/edit`}>
                                                        <Button variant="ghost" size="sm" className="h-8">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteId(volunteer.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {!isLoading && volunteers.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the volunteer
                            account and their challenge progress. Orders referred by this volunteer will be kept.
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
                                "Delete Volunteer"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Button - Floating */}
            {selectedVolunteers.size > 0 && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <Button
                        onClick={() => setBulkDeleteDialogOpen(true)}
                        className="rounded-full shadow-lg bg-destructive hover:bg-destructive/90 text-white px-6 py-6 flex items-center gap-2"
                        size="lg"
                    >
                        <Trash className="w-5 h-5" />
                        Delete {selectedVolunteers.size} selected
                    </Button>
                </div>
            )}

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bulk Delete Volunteers</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete {selectedVolunteers.size} volunteer(s) from the database?
                            <br />
                            <strong className="text-destructive">This action will:</strong>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Delete volunteer accounts and challenge progress (CASCADE)</li>
                                <li>Keep orders but set referred_by to NULL</li>
                            </ul>
                            <strong className="text-destructive mt-2 block">This cannot be undone.</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkDelete}
                            disabled={bulkDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {bulkDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting from database...
                                </>
                            ) : (
                                `Delete ${selectedVolunteers.size} Volunteer(s)`
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
