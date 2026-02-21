import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/middleware/auth-guard";
import { logAuditEvent, getClientIP } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

// GET - List all templates (system + custom)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");

        const supabase = await createClient();

        let query = supabase
            .from("notification_templates")
            .select("*")
            .order("is_system", { ascending: false })
            .order("created_at", { ascending: false });

        if (category) {
            query = query.eq("category", category);
        }

        const { data: templates, error } = await query;

        if (error) {
            console.error("Error fetching templates:", error);
            return NextResponse.json(
                { error: "Failed to fetch templates" },
                { status: 500 }
            );
        }

        return NextResponse.json({ templates: templates || [] });
    } catch (error) {
        console.error("Template API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create custom template
export async function POST(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const body = await request.json();
        const {
            category,
            name,
            title_template,
            message_template,
            action_url_template,
            priority = "medium",
            variables = [],
        } = body;

        if (!category || !name || !title_template || !message_template) {
            return NextResponse.json(
                { error: "Category, name, title, and message are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data: template, error } = await supabase
            .from("notification_templates")
            .insert({
                category,
                name,
                title_template,
                message_template,
                action_url_template,
                priority,
                variables,
                is_system: false,
                created_by: auth.admin.id,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating template:", error);
            return NextResponse.json(
                { error: "Failed to create template" },
                { status: 500 }
            );
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "create",
            entityType: "notification_template",
            entityId: template.id,
            details: { name: template.name, category: template.category },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ template });
    } catch (error) {
        console.error("Template creation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete custom template
export async function DELETE(request: NextRequest) {
    const auth = await requireAdmin("admin");
    if ("error" in auth) return auth.error;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Template ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Check if template is system template and fetch details for audit
        const { data: template, error: fetchError } = await supabase
            .from("notification_templates")
            .select("is_system, name, category")
            .eq("id", id)
            .single();

        if (fetchError || !template) {
            return NextResponse.json(
                { error: "Template not found" },
                { status: 404 }
            );
        }

        if (template.is_system) {
            return NextResponse.json(
                { error: "Cannot delete system templates" },
                { status: 403 }
            );
        }

        const { error } = await supabase
            .from("notification_templates")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting template:", error);
            return NextResponse.json(
                { error: "Failed to delete template" },
                { status: 500 }
            );
        }

        await logAuditEvent({
            actor: { id: auth.admin.id, email: auth.admin.email, name: auth.admin.name, role: auth.admin.role as any },
            action: "delete",
            entityType: "notification_template",
            entityId: id,
            details: { name: template.name, category: template.category },
            ipAddress: getClientIP(request),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Template deletion error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
