"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PromoContent } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Edit, Video, Image as ImageIcon, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function AdminPromoPage() {
    const [content, setContent] = useState<PromoContent[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchContent = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("promo_content")
            .select("*")
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Failed to fetch promo content");
            console.error(error);
        } else {
            setContent(data || []);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handleDelete = async (id: string, url: string, type: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;

        try {
            // 1. Delete file from storage if it's an upload
            if (type === 'video' || type === 'image') {
                // Extract path from URL
                // URL format: .../promo-assets/filename
                const path = url.split('/promo-assets/')[1];
                if (path) {
                    const { error: storageError } = await supabase.storage
                        .from('promo-assets')
                        .remove([path]);

                    if (storageError) {
                        console.error("Storage delete error:", storageError);
                        // Continue to delete record even if storage delete fails
                    }
                }
            }

            // 2. Delete record from database
            const { error } = await supabase
                .from("promo_content")
                .delete()
                .eq("id", id);

            if (error) throw error;

            toast.success("Content deleted successfully");
            fetchContent();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete content");
        }
    };

    // Helper to get icon based on type
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="w-4 h-4" />;
            case 'image': return <ImageIcon className="w-4 h-4" />;
            case 'youtube':
            case 'instagram': return <ExternalLink className="w-4 h-4" />;
            default: return <ImageIcon className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Promo Content</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage videos and images displayed in the promo section.
                    </p>
                </div>
                <Link href="/admin/promo/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Content
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : content.length === 0 ? (
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Video className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No content yet</h3>
                        <p className="text-muted-foreground mb-4 max-w-sm">
                            Add videos, images, or social media embeds to showcase them on the homepage.
                        </p>
                        <Link href="/admin/promo/new">
                            <Button>Add Content</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {content.map((item) => (
                        <Card key={item.id} className="overflow-hidden group">
                            <div className="relative aspect-video bg-muted">
                                {item.type === 'image' && (
                                    <Image
                                        src={item.url}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                    />
                                )}
                                {item.type === 'video' && (
                                    <video src={item.url} className="w-full h-full object-cover" />
                                )}
                                {(item.type === 'youtube' || item.type === 'instagram') && (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                        <ExternalLink className="w-10 h-10 text-muted-foreground" />
                                    </div>
                                )}

                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/admin/promo/${item.id}`}>
                                        <Button size="icon" variant="secondary" className="h-8 w-8">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="h-8 w-8"
                                        onClick={() => handleDelete(item.id, item.url, item.type)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <Badge
                                    className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border-0"
                                >
                                    {getTypeIcon(item.type)}
                                    <span className="ml-1 capitalize">{item.type}</span>
                                </Badge>
                            </div>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold truncate pr-4" title={item.title}>{item.title}</h3>
                                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                                            <span>{item.aspect_ratio}</span>
                                            <span>•</span>
                                            <span className={item.is_active ? "text-green-500" : "text-yellow-500"}>
                                                {item.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
