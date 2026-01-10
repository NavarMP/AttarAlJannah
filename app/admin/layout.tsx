"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Package } from "lucide-react";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Don't apply layout protection to login page
    const isLoginPage = pathname === "/admin/login";

    useEffect(() => {
        if (!loading && !user && !isLoginPage) {
            router.push("/admin/login");
        }
    }, [user, loading, router, isLoginPage]);

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
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border flex flex-col">
                <div className="p-6 border-b border-border">
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold-500">
                        عطر الجنّة
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Admin Panel</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin/dashboard">
                        <Button variant="ghost" className="w-full justify-start rounded-xl">
                            <LayoutDashboard className="mr-2 h-5 w-5" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/admin/orders">
                        <Button variant="ghost" className="w-full justify-start rounded-xl">
                            <Package className="mr-2 h-5 w-5" />
                            Orders
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
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-16 border-b border-border flex items-center justify-between px-6">
                    <h2 className="text-xl font-semibold">Admin Dashboard</h2>
                    <ThemeToggle />
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6 bg-background">
                    {children}
                </main>
            </div>
        </div>
    );
}
