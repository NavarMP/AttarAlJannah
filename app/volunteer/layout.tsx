"use client";


import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, Package, Trophy, Award, LogOut } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import Image from "next/image";

export default function VolunteerLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [volunteerId, setVolunteerId] = useState<string>("");
    const [volunteerName, setVolunteerName] = useState<string>("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        // Skip auth check on login page
        if (pathname === "/volunteer/login") return;

        const id = localStorage.getItem("volunteerId");
        const name = localStorage.getItem("volunteerName");

        if (!id) {
            router.push("/volunteer/login");
            return;
        }

        setVolunteerId(id);
        setVolunteerName(name || "Volunteer");
    }, [router, pathname]);

    const handleLogout = () => {
        localStorage.removeItem("volunteerId");
        localStorage.removeItem("volunteerName");
        router.push("/volunteer/login");
    };

    // If on login page, render children directly without layout/checks
    if (pathname === "/volunteer/login") {
        return <>{children}</>;
    }

    if (!volunteerId) {
        return null;
    }

    return (
        <div className="min-h-screen flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border">
                <div className="flex flex-col flex-1">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-border">
                        <Image
                            src="/assets/typography.svg"
                            alt="Attar Al Jannah"
                            width={150}
                            height={40}
                            className="h-8 w-auto"
                        />
                        <ThemeToggle />
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        <Link href="/volunteer/dashboard">
                            <Button
                                variant="ghost"
                                className={`w-full justify-start rounded-xl ${pathname === "/volunteer/dashboard" ? "bg-primary text-primary-foreground" : ""}`}
                            >
                                <LayoutDashboard className="mr-2 h-5 w-5" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/volunteer/orders">
                            <Button
                                variant="ghost"
                                className={`w-full justify-start rounded-xl ${pathname === "/volunteer/orders" ? "bg-primary text-primary-foreground" : ""}`}
                            >
                                <Package className="mr-2 h-5 w-5" />
                                My Orders
                            </Button>
                        </Link>
                        <Link href="/volunteer/leaderboard">
                            <Button
                                variant="ghost"
                                className={`w-full justify-start rounded-xl ${pathname === "/volunteer/leaderboard" ? "bg-primary text-primary-foreground" : ""}`}
                            >
                                <Trophy className="mr-2 h-5 w-5" />
                                Leaderboard
                            </Button>
                        </Link>
                    </nav>

                    <div className="p-4 border-t border-border space-y-2">
                        <div className="px-3 py-2 rounded-xl bg-primary/10">
                            <p className="text-sm font-medium text-foreground truncate">{volunteerName}</p>
                            <p className="text-xs text-muted-foreground">{volunteerId}</p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full justify-start rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Menu Button */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Sidebar - Mobile */}
            {isSidebarOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}>
                    <aside className="w-64 h-full bg-card border-r border-border flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col">
                            {/* Mobile Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <Image
                                    src="/assets/typography.svg"
                                    alt="Attar Al Jannah"
                                    width={120}
                                    height={32}
                                    className="h-6 w-auto"
                                />
                                <ThemeToggle />
                            </div>
                        </div>

                        <nav className="flex-1 p-4 space-y-2">
                            <Link href="/volunteer/dashboard" onClick={() => setIsSidebarOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start rounded-xl">
                                    <LayoutDashboard className="mr-2 h-5 w-5" />
                                    Dashboard
                                </Button>
                            </Link>
                            <Link href="/volunteer/orders" onClick={() => setIsSidebarOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start rounded-xl">
                                    <Package className="mr-2 h-5 w-5" />
                                    My Orders
                                </Button>
                            </Link>
                            <Link href="/volunteer/leaderboard" onClick={() => setIsSidebarOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start rounded-xl">
                                    <Trophy className="mr-2 h-5 w-5" />
                                    Leaderboard
                                </Button>
                            </Link>
                        </nav>

                        <div className="p-4 border-t border-border space-y-2">
                            <div className="px-3 py-2 rounded-xl bg-primary/10">
                                <p className="text-sm font-medium text-foreground truncate">{volunteerName}</p>
                                <p className="text-xs text-muted-foreground">{volunteerId}</p>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full justify-start rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
