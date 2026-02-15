"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PromoContent } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MediaUpload } from "@/components/admin/media-upload";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface PromoFormProps {
    initialData?: PromoContent;
    isEditing?: boolean;
}

export function PromoForm({ initialData, isEditing = false }: PromoFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState<Partial<PromoContent>>({
        title: initialData?.title || "",
        type: initialData?.type || "image",
        url: initialData?.url || "",
        aspect_ratio: initialData?.aspect_ratio || "16:9",
        is_active: initialData?.is_active ?? true,
        display_order: initialData?.display_order || 0,
    });

    const [mediaFile, setMediaFile] = useState<File | null>(null);

    const handleMediaChange = (file: File | null, preview: string | null, type: 'image' | 'video') => {
        setMediaFile(file);
        if (preview) {
            // For preview purposes only, actual URL set after upload
        } else {
            // If removed
            setFormData(prev => ({ ...prev, url: "" }));
        }
    };

    const uploadMedia = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('promo-assets')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('promo-assets')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let finalUrl = formData.url;

            // Handle file upload if new file is selected
            if (mediaFile) {
                if (formData.type === 'image' || formData.type === 'video') {
                    finalUrl = await uploadMedia(mediaFile);
                }
            }

            const payload = {
                title: formData.title,
                type: formData.type,
                url: finalUrl,
                aspect_ratio: formData.aspect_ratio,
                is_active: formData.is_active,
                display_order: formData.display_order,
            };

            if (isEditing && initialData?.id) {
                const { error } = await supabase
                    .from("promo_content")
                    .update(payload)
                    .eq("id", initialData.id);

                if (error) throw error;
                toast.success("Promo content updated");
            } else {
                const { error } = await supabase
                    .from("promo_content")
                    .insert([payload]);

                if (error) throw error;
                toast.success("Promo content created");
            }

            router.push("/admin/promo");
            router.refresh();

        } catch (error) {
            console.error("Form submission error:", error);
            toast.error("Failed to save promo content");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/promo">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">{isEditing ? "Edit Promo Content" : "New Promo Content"}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-xl border">

                {/* Title */}
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="e.g. Summer Collection Teaser"
                    />
                </div>

                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Content Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                            disabled={isEditing} // Prevent type change on edit to avoid complications
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="youtube">YouTube</SelectItem>
                                <SelectItem value="instagram">Instagram</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Aspect Ratio</Label>
                        <Select
                            value={formData.aspect_ratio}
                            onValueChange={(val: any) => setFormData({ ...formData, aspect_ratio: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select ratio" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                                <SelectItem value="9:16">9:16 (Portrait/Story)</SelectItem>
                                <SelectItem value="4:5">4:5 (Social Post)</SelectItem>
                                <SelectItem value="1:1">1:1 (Square)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Content Input */}
                <div className="space-y-2">
                    <Label>Media</Label>
                    {formData.type === 'youtube' || formData.type === 'instagram' ? (
                        <div className="space-y-2">
                            <Input
                                placeholder={formData.type === 'youtube' ? "https://youtube.com/watch?v=..." : "https://instagram.com/p/..."}
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Paste the full URL to the {formData.type === 'youtube' ? 'YouTube video' : 'Instagram post'}.
                            </p>
                        </div>
                    ) : (
                        <MediaUpload
                            type={formData.type as 'image' | 'video'}
                            currentUrl={formData.url}
                            onMediaChange={handleMediaChange}
                            aspectRatio={
                                formData.aspect_ratio === '16:9' ? 16 / 9 :
                                    formData.aspect_ratio === '9:16' ? 9 / 16 :
                                        formData.aspect_ratio === '4:5' ? 4 / 5 : 1
                            }
                        />
                    )}
                </div>

                {/* Display Order */}
                <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                        id="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">
                        Lower numbers appear first.
                    </p>
                </div>

                {/* Active Switch */}
                <div className="flex items-center space-x-2">
                    <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="pt-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Update Content" : "Create Content"}
                    </Button>
                </div>

            </form>
        </div>
    );
}
