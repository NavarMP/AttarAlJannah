import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Debug endpoint to check database connection and tables
export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        
        const results: any = {
            timestamp: new Date().toISOString(),
            checks: {},
        };

        // Check notifications table
        try {
            const { data: notifData, error: notifError, count } = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true });
            
            results.checks.notifications = {
                accessible: true,
                error: notifError?.message || null,
                count: count || 0,
            };
        } catch (e: any) {
            results.checks.notifications = {
                accessible: false,
                error: e.message,
            };
        }

        // Check scheduled_notifications table
        try {
            const { data: schedData, error: schedError, count } = await supabase
                .from("scheduled_notifications")
                .select("*", { count: "exact", head: true });
            
            results.checks.scheduled_notifications = {
                accessible: true,
                error: schedError?.message || null,
                count: count || 0,
            };
        } catch (e: any) {
            results.checks.scheduled_notifications = {
                accessible: false,
                error: e.message,
            };
        }

        // Check notification_templates table
        try {
            const { data: templateData, error: templateError, count } = await supabase
                .from("notification_templates")
                .select("*", { count: "exact", head: true });
            
            results.checks.notification_templates = {
                accessible: true,
                error: templateError?.message || null,
                count: count || 0,
            };
        } catch (e: any) {
            results.checks.notification_templates = {
                accessible: false,
                error: e.message,
            };
        }

        // Check customers table
        try {
            const { data: custData, error: custError, count } = await supabase
                .from("customers")
                .select("*", { count: "exact", head: true });
            
            results.checks.customers = {
                accessible: true,
                error: custError?.message || null,
                count: count || 0,
            };
        } catch (e: any) {
            results.checks.customers = {
                accessible: false,
                error: e.message,
            };
        }

        // Check volunteers table
        try {
            const { data: volData, error: volError, count } = await supabase
                .from("volunteers")
                .select("*", { count: "exact", head: true });
            
            results.checks.volunteers = {
                accessible: true,
                error: volError?.message || null,
                count: count || 0,
            };
        } catch (e: any) {
            results.checks.volunteers = {
                accessible: false,
                error: e.message,
            };
        }

        // Check environment variables
        results.environment = {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        };

        return NextResponse.json(results);
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack,
        }, { status: 500 });
    }
}

// POST - Test creating a notification
export async function POST(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        
        // Create a test notification
        const { data, error } = await supabase
            .from("notifications")
            .insert({
                user_id: null,
                user_role: "admin",
                type: "system_announcement",
                category: "test",
                title: "Test Notification",
                message: "This is a test notification created via debug endpoint",
                priority: "high",
                is_read: false,
                delivery_status: "sent",
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({
                success: false,
                error: error.message,
                details: error,
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            notification: data,
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
}
