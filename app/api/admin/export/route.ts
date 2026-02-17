import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        // Verify admin
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // orders, volunteers, customers, feedback
        const ids = searchParams.get("ids"); // comma-separated IDs for "export selected"
        const format = searchParams.get("format") || "csv";

        if (!type || !["orders", "volunteers", "customers", "feedback"].includes(type)) {
            return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
        }

        let query;
        let headers: string[] = [];

        switch (type) {
            case "orders":
                query = supabase
                    .from("orders")
                    .select("id, customer_name, customer_phone, whatsapp_number, customer_address, product_name, quantity, total_price, payment_method, payment_status, order_status, delivery_method, created_at");
                headers = ["ID", "Customer Name", "Phone", "WhatsApp", "Address", "Product", "Quantity", "Total Price", "Payment Method", "Payment Status", "Order Status", "Delivery Method", "Created At"];
                break;

            case "volunteers":
                query = supabase
                    .from("volunteers")
                    .select("id, name, email, phone, volunteer_id, address, status, confirmed_bottles, created_at");
                headers = ["ID", "Name", "Email", "Phone", "Volunteer ID", "Address", "Status", "Confirmed Bottles", "Created At"];
                break;

            case "customers":
                query = supabase
                    .from("customers")
                    .select("id, name, phone, email, created_at");
                headers = ["ID", "Name", "Phone", "Email", "Created At"];
                break;

            case "feedback":
                query = supabase
                    .from("feedback")
                    .select("id, name, email, rating_overall, rating_ordering, rating_delivery, rating_packing, message, category, status, priority, created_at");
                headers = ["ID", "Name", "Email", "Overall Rating", "Ordering Rating", "Delivery Rating", "Packing Rating", "Message", "Category", "Status", "Priority", "Created At"];
                break;
        }

        if (!query) {
            return NextResponse.json({ error: "Query build failed" }, { status: 500 });
        }

        // Filter by selected IDs if provided
        if (ids) {
            const idArray = ids.split(",").map((id) => id.trim());
            query = query.in("id", idArray);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Export query error:", error);
            return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: "No data to export" }, { status: 404 });
        }

        // Convert to CSV
        const escapeCSV = (val: any): string => {
            if (val === null || val === undefined) return "";
            const str = String(val);
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvRows = [headers.join(",")];
        for (const row of data) {
            const values = Object.values(row).map(escapeCSV);
            csvRows.push(values.join(","));
        }
        const csvContent = csvRows.join("\n");

        return new Response(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${type}_export_${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
