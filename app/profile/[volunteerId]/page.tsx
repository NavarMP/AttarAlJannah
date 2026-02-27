
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Award, Clock, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getVolunteerRank } from "@/lib/services/leaderboard-service";
import { ProfileActions } from "@/components/volunteer/profile-actions";
import { Progress } from "@/components/ui/progress";
import { ShareButton } from "@/components/ui/share-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/custom";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Force dynamic rendering since we're using parameters and database
export const dynamic = "force-dynamic";

// Initialize admin client for public access (bypassing RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

interface Props {
    params: Promise<{ volunteerId: string }>;
}

async function getVolunteerData(volunteerId: string) {
    // 1. Fetch volunteer basic info
    const { data: volunteer, error } = await supabase
        .from("volunteers")
        .select("id, volunteer_id, name, profile_photo, status, created_at, role")
        .ilike("volunteer_id", volunteerId)
        .single();

    if (error || !volunteer) {
        return null;
    }

    // 2. Fetch goal and calculate dynamic order stats
    const { data: progress } = await supabase
        .from("challenge_progress")
        .select("goal")
        .eq("volunteer_id", volunteer.id)
        .maybeSingle();

    const { data: orders } = await supabase
        .from("orders")
        .select("quantity, order_status")
        .eq("volunteer_id", volunteer.id);

    const confirmedOrders = orders?.filter(o => o.order_status === "confirmed" || o.order_status === "delivered") || [];
    const totalBottles = confirmedOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);
    const goal = progress?.goal || 20;
    const goalProgress = Math.min(100, Math.round((totalBottles / goal) * 100));

    // Calculate active days
    const createdAt = new Date(volunteer.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const activeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
        ...volunteer,
        stats: {
            totalBottles,
            goal,
            goalProgress,
            activeDays
        }
    };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { volunteerId } = await params;
    const volunteer = await getVolunteerData(volunteerId);

    if (!volunteer) {
        return {
            title: "Volunteer Not Found",
        };
    }

    return {
        title: `${volunteer.name} - Volunteer Profile | Attar Al Jannah`,
        description: `Check out ${volunteer.name}'s achievements as a volunteer at Attar Al Jannah. They have ordered ${volunteer.stats.totalBottles} bottles!`,
        openGraph: {
            title: `${volunteer.name} - Volunteer Profile`,
            description: `Help ${volunteer.name} reach their goal! Current progress: ${volunteer.stats.goalProgress}%`,
            images: volunteer.profile_photo ? [volunteer.profile_photo] : [],
        },
    };
}

export default async function PublicProfilePage({ params }: Props) {
    const { volunteerId } = await params;
    const volunteer = await getVolunteerData(volunteerId);

    if (!volunteer) {
        notFound();
    }

    const { name, profile_photo, status, volunteer_id, stats } = volunteer;

    const rank = await getVolunteerRank(volunteer_id, "overall", "all");

    // Get initials for avatar fallback
    const initials = name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://attaraljannah.com"}/profile/${volunteer_id}`;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Section / Header Background */}
            <div className="h-48 bg-gradient-to-b from-border/30 to-background relative overflow-hidden">
                <div className="flex justify-end p-4 gap-2">
                    <ThemeToggle />
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <span className="sr-only">Home</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="container max-w-lg mx-auto px-4 -mt-20 relative z-10">
                <div className="space-y-6">
                    {/* Profile Header Card */}
                    <Card id="profile-card-export" className="glass-strong border-gold-200/20 shadow-xl overflow-visible pt-0 mt-20 bg-background/50 backdrop-blur-md rounded-[40px]">
                        <CardContent className="pt-0 relative">
                            {/* Profile Photo */}
                            <div className="flex justify-center pt-8 mb-4">
                                <div className="rounded-full p-1.5 bg-background shadow-2xl ring-4 ring-primary/20">
                                    <Avatar className="h-32 w-32 border-4 border-background">
                                        <AvatarImage src={profile_photo || undefined} alt={name} className="object-cover" />
                                        <AvatarFallback className="text-2xl font-bold bg-primary/5 text-primary">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="text-center space-y-2 mb-6">
                                <h1 className="text-2xl font-bold text-foreground">{name}</h1>
                                <div className="flex items-center justify-center gap-2">
                                    <Badge variant="outline" className="font-mono text-muted-foreground border-gold-200/30">
                                        @{volunteer_id}
                                    </Badge>
                                    <Badge
                                        variant={status === 'active' ? 'default' : 'secondary'}
                                        className={status === 'active' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20' : ''}
                                    >
                                        {status === 'active' ? 'Active Volunteer' : status}
                                    </Badge>
                                </div>
                                {rank && (
                                    <Link href="/leaderboard" className="inline-flex items-center justify-center gap-1.5 mt-2 group">
                                        <Trophy className="w-4 h-4 text-gold-500 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                            Rank <span className="text-foreground font-bold underline-offset-2 group-hover:underline">#{rank}</span>
                                        </span>
                                    </Link>
                                )}
                            </div>

                            {/* Primary Stat: Bottles Ordered */}
                            <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-border/50">
                                <div className="text-center space-y-1">
                                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                                        Bottles Ordered
                                    </p>
                                    <p className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                                        <Award className="h-5 w-5 text-gold-500" />
                                        {stats.totalBottles}
                                    </p>
                                </div>
                                <div className="text-center space-y-1 border-l border-border/50">
                                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                                        Active Days
                                    </p>
                                    <p className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                                        <Clock className="h-5 w-5 text-blue-500/70" />
                                        {stats.activeDays}
                                    </p>
                                </div>
                            </div>

                            {/* Goal Progress */}
                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground">Current Goal</p>
                                        <p className="text-xs text-muted-foreground">
                                            Help {name.split(' ')[0]} reach {stats.goal} bottles!
                                        </p>
                                    </div>
                                    <span className="text-lg font-bold text-primary">
                                        {stats.goalProgress}%
                                    </span>
                                </div>
                                <Progress value={stats.goalProgress} className="h-3 bg-secondary/50" indicatorClassName="bg-gradient-to-r from-primary to-gold-400" />
                                <p className="text-center text-xs text-muted-foreground pt-2">
                                    {stats.totalBottles} / {stats.goal} bottles ordered
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Achievements / Badges (Placeholder for future) */}
                    {stats.goalProgress >= 100 && (
                        <Card className="bg-gradient-to-br from-gold-500/10 to-transparent border-gold-200/30">
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className="h-12 w-12 rounded-full bg-gold-100 flex items-center justify-center shrink-0">
                                    <Award className="h-6 w-6 text-gold-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gold-900 dark:text-gold-100">
                                        Goal Achiever
                                    </h3>
                                    <p className="text-sm text-gold-800/80 dark:text-gold-200/70">
                                        Successfully reached their sales goal!
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Footer / Profile Actions */}
                    <div className="text-center pt-2">
                        <ProfileActions
                            volunteerName={name}
                            volunteerId={volunteer_id}
                            totalBottles={stats.totalBottles}
                            shareUrl={shareUrl}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
