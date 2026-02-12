
"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Edit,
    Trash2,
    Share2,
    Package,
    TrendingUp,
    DollarSign,
    Award,
    Calendar,
    Mail,
    Phone,
    MapPin,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Share } from "@/components/sections/share"; // Assuming generic Share component or I'll use Share dialog from volunteer profile?
// Wait, I should use the one I implemented for volunteer profile if generic, or the Share component.
// The task said "Add Share Profile button with share dialog".
// I'll reuse the Share component if it exists or generic share logic.
// `components/sections/share` seems to be the one.

import { toast } from "sonner";
import { getInitials } from "@/lib/utils/image-utils";
import Link from "next/link";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch data");
    return res.json();
});

interface VolunteerDetailClientProps {
    volunteerId: string;
}

export function VolunteerDetailClient({ volunteerId }: VolunteerDetailClientProps) {
    const router = useRouter();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    // Fetch analytics and details
    const { data: analyticsData, error: analyticsError, isLoading: analyticsLoading } = useSWR(
        `/api/admin/volunteers/${volunteerId}/analytics`,
        fetcher
    );

    // Fetch orders (with pagination - simplified for now to first page)
    const [page, setPage] = useState(1);
    const { data: ordersData, error: ordersError, isLoading: ordersLoading } = useSWR(
        `/api/admin/volunteers/${volunteerId}/orders?page=${page}&limit=10`,
        fetcher
    );

    // Fetch volunteer basic info (although analytics returns some, we might want direct DB fetch or pass from server?)
    // Actually analytics endpoint returns only stats. We need basic details (name, email etc).
    // The analytics endpoint I created:
    // It verifies volunteer exists and then returns { overview, performance, deliveryStats, timeline }.
    // It DOES NOT return the volunteer object itself (name, email, etc).
    // I should update the analytics endpoint or fetch volunteer details separately.
    // Or I can fetch volunteer details here.

    // Let's use a separate SWR for volunteer details or modify analytics to return it.
    // Modifying analytics is better to reduce requests.
    // BUT I already wrote the analytics endpoint.
    // I'll make a separate request to `/api/admin/volunteers/${volunteerId}`?
    // I haven't created that endpoint yet.
    // I should create GET /api/admin/volunteers/[id]/route.ts
    // OR I can use the same server component to fetch the volunteer details and pass as initial data?
    // Yes, Server Component can fetch the volunteer record and pass it to Client Component.

    // So `VolunteerDetailClient` will accept `initialVolunteer` prop.

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            {/* I will assume `volunteer` is passed as prop, but for now I'll stub it or fetch it if I modify the page.tsx */}
            {/* Let's wait for page.tsx to pass the volunteer data. */}
            {/* I will update the Props interface below when I write page.tsx */}
            <p>Error: Volunteer data not provided</p>
        </div>
    );
}
