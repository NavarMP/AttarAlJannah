"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Button } from "@/components/ui/button";
import { ScrollText, ShieldAlert, Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react";

interface AuditLog {
    id: string;
    admin_email: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    details: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
    create: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    update: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    bulk_delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    restore: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    permanent_delete: "bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-100",
    login: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    deactivate: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    bulk_update: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export default function AuditLogsPage() {
    const { hasPermission } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Filters
    const [actionFilter, setActionFilter] = useState("all");
    const [entityFilter, setEntityFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString() });
            if (actionFilter !== "all") params.set("action", actionFilter);
            if (entityFilter !== "all") params.set("entityType", entityFilter);
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);

            const res = await fetch(`/api/admin/audit-logs?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setTotalPages(data.totalPages);
            }
        } catch {
            // Silently fail
        } finally {
            setLoading(false);
        }
    }, [page, actionFilter, entityFilter, startDate, endDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    if (!hasPermission("super_admin")) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                        <p className="text-muted-foreground">Only Super Admins can view audit logs.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ScrollText className="h-6 w-6" />
                    Audit Logs
                </h1>
                <p className="text-muted-foreground mt-1">
                    Track all admin actions — who did what and when
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="create">Create</SelectItem>
                                    <SelectItem value="update">Update</SelectItem>
                                    <SelectItem value="delete">Delete</SelectItem>
                                    <SelectItem value="bulk_delete">Bulk Delete</SelectItem>
                                    <SelectItem value="restore">Restore</SelectItem>
                                    <SelectItem value="login">Login</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Entity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Entities</SelectItem>
                                <SelectItem value="order">Order</SelectItem>
                                <SelectItem value="volunteer">Volunteer</SelectItem>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="admin_user">Admin User</SelectItem>
                                <SelectItem value="auth">Auth</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="w-[160px]"
                            placeholder="Start Date"
                        />
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="w-[160px]"
                            placeholder="End Date"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No audit logs found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Entity</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <>
                                        <TableRow
                                            key={log.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                        >
                                            <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                                                {new Date(log.created_at).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </TableCell>
                                            <TableCell className="font-medium text-sm">
                                                {log.admin_email.split("@")[0]}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"}`}>
                                                    {log.action.replace(/_/g, " ")}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {log.entity_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                                {log.entity_id
                                                    ? `ID: ${log.entity_id.substring(0, 8)}...`
                                                    : "—"}
                                            </TableCell>
                                        </TableRow>
                                        {expandedId === log.id && log.details && (
                                            <TableRow key={`${log.id}-details`}>
                                                <TableCell colSpan={5} className="bg-muted/30">
                                                    <pre className="text-xs overflow-x-auto p-2 rounded bg-muted">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                    {log.ip_address && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            IP: {log.ip_address}
                                                        </p>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))}
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
