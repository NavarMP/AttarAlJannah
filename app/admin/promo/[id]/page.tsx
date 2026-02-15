"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PromoForm } from "@/components/admin/promo-form";
import { PromoContent } from "@/types";
import { Loader2 } from "lucide-react";

export default function EditPromoPage() {
    const params = useParams();
    const [data, setData] = useState<PromoContent | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchContent = async () => {
            const { data, error } = await supabase
                .from("promo_content")
                .select("*")
                .eq("id", params.id)
                .single();

            if (!error && data) {
                setData(data);
            }
            setLoading(false);
        };

        if (params.id) {
            fetchContent();
        }
    }, [params.id, supabase]);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) {
        return <div>Content not found</div>;
    }

    return <PromoForm initialData={data} isEditing />;
}
