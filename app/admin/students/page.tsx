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
import { Users, Plus, Search, Edit, Trash2, TrendingUp, Award, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Student {
    id: string;
    name: string;
    email: string;
    phone: string;
    student_id: string;
    address: string | null;
    verified_sales: number;
    goal: number;
    progress_percentage: number;
    created_at: string;
}

export default function StudentsPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        topPerformer: null as Student | null,
    });

    const fetchStudents = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            params.append("page", currentPage.toString());
            params.append("limit", "50"); // Show 50 per page
            if (searchQuery) params.append("search", searchQuery);

            const response = await fetch(`/api/admin/students?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to fetch students");

            const data = await response.json();
            setStudents(data.students || []);
            setTotalPages(data.pagination.totalPages || 1);

            // Calculate stats
            const total = data.pagination.total;
            const active = data.students.filter((s: Student) => s.verified_sales > 0).length;
            const topPerformer = data.students.reduce((top: Student | null, current: Student) =>
                (!top || current.verified_sales > top.verified_sales) ? current : top,
                null
            );

            setStats({ total, active, topPerformer });

        } catch (error) {
            console.error("Error fetching students:", error);
            toast.error("Failed to load students");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, searchQuery]);

    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 when search changes
        fetchStudents();
    }, [searchQuery, fetchStudents]);

    useEffect(() => {
        fetchStudents();
    }, [currentPage, fetchStudents]);

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            setIsDeleting(true);
            const response = await fetch(`/api/admin/students/${deleteId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete student");

            toast.success("Student deleted successfully");
            setDeleteId(null);
            fetchStudents();

        } catch (error) {
            console.error("Error deleting student:", error);
            toast.error("Failed to delete student");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Students Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage student accounts and track their progress
                    </p>
                </div>
                <Link href="/admin/students/new">
                    <Button className="bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Student
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Students
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
                            Active Students
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{stats.active}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            With verified sales
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
                                    {stats.topPerformer.verified_sales} verified sales
                                </p>
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground">No data yet</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card className="glass-strong">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, student ID, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Students Table */}
            <Card className="glass-strong">
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : !students || students.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                            <p className="mt-4 text-lg font-medium">No students found</p>
                            <p className="text-sm text-muted-foreground">
                                {searchQuery ? "Try a different search term" : "Add your first student to get started"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Sales</TableHead>
                                        <TableHead>Goal</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-mono font-semibold">
                                                {student.student_id}
                                            </TableCell>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {student.email}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {student.phone}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold">{student.verified_sales}</span>
                                            </TableCell>
                                            <TableCell>{student.goal}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-primary to-gold-500"
                                                            style={{ width: `${Math.min(student.progress_percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        {student.progress_percentage}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/admin/students/${student.id}/edit`}>
                                                        <Button variant="ghost" size="sm" className="h-8">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteId(student.id)}
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
            {!isLoading && students.length > 0 && totalPages > 1 && (
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
                            This action cannot be undone. This will permanently delete the student
                            account and their challenge progress. Orders referred by this student will be kept.
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
                                "Delete Student"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
