"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { UserPlus, Shield, ShieldAlert, Eye, Users, Loader2, Trash2 } from "lucide-react";

interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: "super_admin" | "admin" | "viewer";
    is_active: boolean;
    created_at: string;
    last_login_at: string | null;
}

const ROLE_CONFIG = {
    super_admin: { label: "Super Admin", color: "destructive" as const, icon: ShieldAlert },
    admin: { label: "Admin", color: "default" as const, icon: Shield },
    viewer: { label: "Viewer", color: "secondary" as const, icon: Eye },
};

export default function AdminUsersPage() {
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newUser, setNewUser] = useState({ email: "", name: "", role: "viewer" });

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            } else {
                toast.error("Failed to fetch admin users");
            }
        } catch {
            toast.error("Failed to fetch admin users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAdd = async () => {
        if (!newUser.email || !newUser.name) {
            toast.error("Email and name are required");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });
            if (res.ok) {
                toast.success("Admin user created");
                setIsAddOpen(false);
                setNewUser({ email: "", name: "", role: "viewer" });
                fetchUsers();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to create user");
            }
        } catch {
            toast.error("Failed to create user");
        } finally {
            setSaving(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) {
                toast.success("Role updated");
                fetchUsers();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to update role");
            }
        } catch {
            toast.error("Failed to update role");
        }
    };

    const handleToggleActive = async (userId: string, currentActive: boolean) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !currentActive }),
            });
            if (res.ok) {
                toast.success(currentActive ? "User deactivated" : "User activated");
                fetchUsers();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to update user");
            }
        } catch {
            toast.error("Failed to update user");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Admin user deleted");
                fetchUsers();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to delete user");
            }
        } catch {
            toast.error("Failed to delete user");
        }
    };

    if (!hasPermission("super_admin")) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                        <p className="text-muted-foreground">
                            Only Super Admins can manage admin users.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        Admin Users
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage who has access to the admin panel and their permissions
                    </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Admin User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Committee Member Name"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="member@example.com"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    This email must also exist in Supabase Authentication → Users
                                </p>
                            </div>
                            <div>
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={newUser.role}
                                    onValueChange={(val) => setNewUser({ ...newUser, role: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                                        <SelectItem value="admin">Admin (Full access)</SelectItem>
                                        <SelectItem value="super_admin">Super Admin (All permissions)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleAdd} className="w-full" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Admin User
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Role Legend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-destructive" />
                            Super Admin
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Full access. Can manage admins, view audit logs, permanently delete from trash.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            Admin
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Can manage orders, volunteers, customers. Cannot manage other admins.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            Viewer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Read-only access. Can view dashboards and data but cannot modify.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Login</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((admin) => {
                                    const roleConfig = ROLE_CONFIG[admin.role];
                                    return (
                                        <TableRow key={admin.id} className={!admin.is_active ? "opacity-50" : ""}>
                                            <TableCell className="font-medium">{admin.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={admin.role}
                                                    onValueChange={(val) => handleRoleChange(admin.id, val)}
                                                >
                                                    <SelectTrigger className="w-[140px] h-8">
                                                        <Badge variant={roleConfig.color} className="text-xs">
                                                            {roleConfig.label}
                                                        </Badge>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="viewer">Viewer</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={admin.is_active ? "outline" : "destructive"}>
                                                    {admin.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {admin.last_login_at
                                                    ? new Date(admin.last_login_at).toLocaleDateString("en-IN", {
                                                        day: "numeric",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : "Never"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        variant={admin.is_active ? "outline" : "default"}
                                                        size="sm"
                                                        className="rounded-xl"
                                                        onClick={() => handleToggleActive(admin.id, admin.is_active)}
                                                    >
                                                        {admin.is_active ? "Deactivate" : "Activate"}
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="rounded-xl px-2"
                                                                title="Permanently Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Admin User?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently remove {admin.name} from the admin users list.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    onClick={() => handleDeleteUser(admin.id)}
                                                                >
                                                                    Delete Forever
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
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
        </div>
    );
}
