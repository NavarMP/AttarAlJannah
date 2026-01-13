"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, Package, Trophy, Award, LogOut } from "lucide-react";
import Link from "next/link";

export default function VolunteerLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [volunteerId, setVolunteerId] = useState<string>("");
    const [volunteerName, setVolunteerName] = useState<string>("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const id = localStorage.getItem("volunteerId");
        const name = localStorage.getItem("volunteerName");

        if (!id) {
            router.push("/volunteer/login");
            return;
        }

        setVolunteerId(id);
        setVolunteerName(name || "Volunteer");
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("volunteerId");
        localStorage.removeItem("volunteerName");
        router.push("/volunteer/login");
    };

    if (!volunteerId) {
        return null;
    }

    return (
        <div className="min-h-screen flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex md:flex-col w-64 border-r border-border bg-card/50 backdrop-blur-sm">
                <div className="p-6 border-b border-border">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-gold-500 bg-clip-text text-transparent">
                        Volunteer Portal
                    </h2>
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
                        <div className="p-6 border-b border-border">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-gold-500 bg-clip-text text-transparent">
                                Volunteer Portal
                            </h2>
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
