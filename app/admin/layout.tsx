"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Package, Menu, X, Users, Trophy, MessageSquare, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { NotificationComposer } from "@/components/notifications/notification-composer";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showComposer, setShowComposer] = useState(false);

    // Don't apply layout protection to login page
    const isLoginPage = pathname === "/admin/login";

    useEffect(() => {
        if (!loading && !isLoginPage) {
            // Check if user exists and has admin role
            if (!user || user.role !== "admin") {
                router.push("/admin/login");
            }
        }
    }, [user, loading, router, isLoginPage]);

    // Close sidebar when route changes on mobile
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        try {
            await signOut();
            toast.success("Logged out successfully");
            router.push("/admin/login");
        } catch (error) {
            toast.error("Failed to log out");
        }
    };

    // Render login page without layout
    if (isLoginPage) {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen flex">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    w-64 bg-card border-r border-border flex flex-col
                    transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex justify-start mb-2">
                            <Image
                                src="/assets/typography.svg"
                                alt="عطر الجنّة"
                                width={150}
                                height={40}
                                className="h-8 w-auto"
                            />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Admin Panel</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden rounded-xl"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin/dashboard">
                        <Button variant="ghost" className="w-full justify-start rounded-xl">
                            <LayoutDashboard className="mr-2 h-5 w-5" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/admin/volunteers">
                        <Button variant="ghost" className="w-full justify-start rounded-xl">
                            <Users className="mr-2 h-5 w-5" />
                            Volunteers
                        </Button>
                    </Link>
                    <Link href="/admin/leaderboard">
                        <Button variant="ghost" className="w-full justify-start rounded-xl">
                            <Trophy className="mr-2 h-5 w-5" />
                            Leaderboard
                        </Button>
                    </Link>
                    <Link href="/admin/orders">
                        <Button variant="ghost" className="w-full justify-start rounded-xl">
                            <Package className="mr-2 h-5 w-5" />
                            Orders
                        </Button>
                    </Link>
                    <Link href="/admin/customers">
                        <Button variant="ghost" className="w-full justify-start rounded-xl">
                            <Users className="mr-2 h-5 w-5" />
                            Customers
                        </Button>
                    </Link>
                    <Link href="/admin/feedback">
                        <Button
                            variant="ghost"
                            className={`w-full justify-start rounded-xl ${pathname.startsWith("/admin/feedback") ? "bg-primary/10 text-primary" : ""}`}
                        >
                            <MessageSquare className="mr-2 h-5 w-5" />
                            Feedback
                        </Button>
                    </Link>
                </nav>

                <div className="p-4 border-t border-border space-y-2">
                    <div className="px-3 py-2 rounded-xl bg-primary/10">
                        <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground">Administrator</p>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full justify-start rounded-xl"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden rounded-xl"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <h2 className="text-xl font-semibold">Admin Dashboard</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowComposer(true)}
                            className="rounded-xl"
                        >
                            <Bell className="h-4 w-4 mr-2" />
                            Send Notification
                        </Button>
                        <NotificationBell />
                        <ThemeToggle />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 lg:p-6 bg-background">
                    {children}
                </main>
            </div>

            {/* Notification Composer Dialog */}
            <NotificationComposer open={showComposer} onOpenChange={setShowComposer} />
        </div>
    );
}
