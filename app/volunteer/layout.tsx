"use client";


import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, Package, Trophy, Award, LogOut, Truck, Map, Bell, } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import Image from "next/image";
import { NotificationBell } from "@/components/notifications/notification-bell";
import Home from "../page";

export default function VolunteerLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [volunteerId, setVolunteerId] = useState<string>("");
    const [volunteerName, setVolunteerName] = useState<string>("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        // Skip auth check on login and signup pages
        if (pathname === "/volunteer/login" || pathname === "/volunteer/signup") return;

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

    // If on login or signup page, render children directly without layout/checks
    if (pathname === "/volunteer/login" || pathname === "/volunteer/signup") {
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
                        <Link href="/volunteer/delivery" onClick={() => setIsSidebarOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start rounded-xl">
                                <Truck className="mr-2 h-5 w-5" />
                                Delivery
                            </Button>
                        </Link>
                        <Link href="/volunteer/zones">
                            <Button
                                variant="ghost"
                                className={`w-full justify-start rounded-xl ${pathname === "/volunteer/zones" ? "bg-primary text-primary-foreground" : ""}`}
                            >
                                <Map className="mr-2 h-5 w-5" />
                                Zones
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
                            <Link href="/volunteer/delivery" onClick={() => setIsSidebarOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start rounded-xl">
                                    <Truck className="mr-2 h-5 w-5" />
                                    Delivery
                                </Button>
                            </Link>
                            <Link href="/volunteer/zones" onClick={() => setIsSidebarOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start rounded-xl">
                                    <Map className="mr-2 h-5 w-5" />
                                    Zones
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
            <main className="flex-1 bg-background">
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
                        <h2 className="text-xl font-semibold">Volunteer</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <ThemeToggle />
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="mr-2">
                                <span className="sr-only">Home</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                            </Button>
                        </Link>
                    </div>
                </header>
                {children}
            </main>
        </div>
    );
}
