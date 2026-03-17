import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ORDER_COLUMNS: Record<string, { key: string; label: string; dbCol: string }> = {
    id: { key: "id", label: "Order ID", dbCol: "id" },
    customer_name: { key: "customer_name", label: "Customer Name", dbCol: "customer_name" },
    customer_phone: { key: "customer_phone", label: "Phone", dbCol: "customer_phone" },
    whatsapp_number: { key: "whatsapp_number", label: "WhatsApp", dbCol: "whatsapp_number" },
    customer_address: { key: "customer_address", label: "Address", dbCol: "customer_address" },
    product_name: { key: "product_name", label: "Product", dbCol: "product_name" },
    quantity: { key: "quantity", label: "Quantity", dbCol: "quantity" },
    total_price: { key: "total_price", label: "Total Price", dbCol: "total_price" },
    payment_method: { key: "payment_method", label: "Payment Method", dbCol: "payment_method" },
    payment_status: { key: "payment_status", label: "Payment Status", dbCol: "payment_status" },
    order_status: { key: "order_status", label: "Status", dbCol: "order_status" },
    delivery_method: { key: "delivery_method", label: "Delivery Method", dbCol: "delivery_method" },
    referred_by: { key: "referred_by", label: "Referred By", dbCol: "referred_by" },
    created_at: { key: "created_at", label: "Date", dbCol: "created_at" },
};

const CUSTOMER_COLUMNS: Record<string, { key: string; label: string; dbCol: string }> = {
    id: { key: "id", label: "ID", dbCol: "id" },
    name: { key: "name", label: "Name", dbCol: "name" },
    phone: { key: "phone", label: "Phone", dbCol: "phone" },
    whatsapp_number: { key: "whatsapp_number", label: "WhatsApp", dbCol: "whatsapp_number" },
    email: { key: "email", label: "Email", dbCol: "email" },
    address: { key: "address", label: "Address", dbCol: "address" },
    total_orders: { key: "total_orders", label: "Orders", dbCol: "total_orders" },
    total_bottles: { key: "total_bottles", label: "Bottles", dbCol: "total_bottles" },
    last_order_at: { key: "last_order_at", label: "Last Order", dbCol: "last_order_at" },
    created_at: { key: "created_at", label: "Joined", dbCol: "created_at" },
};

function escapeCSV(val: any): string {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function convertToCSV(data: Record<string, any>[], columns: string[], columnDefs: Record<string, { key: string; label: string }>): string {
    const headers = columns.map(col => columnDefs[col]?.label || col);
    const csvRows = [headers.join(",")];
    
    for (const row of data) {
        const values = columns.map(col => {
            let val = row[col];
            if (val instanceof Date) val = val.toISOString();
            if (typeof val === "object") val = JSON.stringify(val);
            return escapeCSV(val);
        });
        csvRows.push(values.join(","));
    }
    return csvRows.join("\n");
}

function convertToExcel(data: Record<string, any>[], columns: string[], columnDefs: Record<string, { key: string; label: string }>): string {
    const headers = columns.map(col => columnDefs[col]?.label || col);
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
    xml += '<Worksheet ss:Name="Sheet1"><Table>';
    
    xml += '<Row>';
    for (const header of headers) {
        xml += `<Cell><Data ss:Type="String">${escapeCSV(header)}</Data></Cell>`;
    }
    xml += '</Row>';
    
    for (const row of data) {
        xml += '<Row>';
        for (const col of columns) {
            let val = row[col];
            if (val instanceof Date) val = val.toISOString();
            if (typeof val === "object") val = JSON.stringify(val);
            
            const numVal = Number(val);
            const isNum = !isNaN(numVal) && val !== "" && val !== null && val !== undefined;
            
            xml += `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeCSV(val)}</Data></Cell>`;
        }
        xml += '</Row>';
    }
    
    xml += '</Table></Worksheet></Workbook>';
    return xml;
}

export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") as "orders" | "customers" | "volunteers" | "feedback";
        const ids = searchParams.get("ids");
        const format = searchParams.get("format") as "csv" | "excel" | "pdf" || "csv";
        const columnsParam = searchParams.get("columns");
        
        const sortBy = searchParams.get("sortBy");
        const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" || "desc";

        if (!type || !["orders", "customers", "volunteers", "feedback"].includes(type)) {
            return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
        }

        const columnDefs = type === "orders" ? ORDER_COLUMNS : type === "customers" ? CUSTOMER_COLUMNS : {};
        
        let requestedColumns: string[];
        if (columnsParam) {
            requestedColumns = columnsParam.split(",");
        } else {
            requestedColumns = Object.keys(columnDefs);
        }

        let data: Record<string, any>[] = [];
        let error: any = null;

        if (type === "orders") {
            const selectCols = requestedColumns.filter(c => ORDER_COLUMNS[c]).map(c => ORDER_COLUMNS[c].dbCol);
            if (!selectCols.includes("id")) selectCols.push("id");
            
            let query = supabase
                .from("orders")
                .select(selectCols.join(", "))
                .is("deleted_at", null);

            if (ids) {
                const idArray = ids.split(",").map(id => id.trim());
                query = query.in("id", idArray);
            }

            if (sortBy && ORDER_COLUMNS[sortBy]) {
                query = query.order(ORDER_COLUMNS[sortBy].dbCol, { ascending: sortOrder === "asc" });
            } else {
                query = query.order("created_at", { ascending: false });
            }

            const result = await query;
            data = result.data || [];
            error = result.error;
        } 
        else if (type === "customers") {
            const { data: customersData } = await supabase
                .from("customers")
                .select("*")
                .is("deleted_at", null)
                .order("created_at", { ascending: false });

            const { data: ordersData } = await supabase
                .from("orders")
                .select("customer_phone, quantity, created_at")
                .is("deleted_at", null);

            const ordersByPhone = new Map<string, { count: number; bottles: number; lastOrder: string | null }>();
            
            ordersData?.forEach(o => {
                const existing = ordersByPhone.get(o.customer_phone) || { count: 0, bottles: 0, lastOrder: null };
                ordersByPhone.set(o.customer_phone, {
                    count: existing.count + 1,
                    bottles: existing.bottles + (o.quantity || 0),
                    lastOrder: existing.lastOrder || o.created_at
                });
            });

            data = (customersData || []).map(c => {
                const orderStats = ordersByPhone.get(c.phone) || { count: 0, bottles: 0, lastOrder: null };
                return {
                    ...c,
                    total_orders: orderStats.count,
                    total_bottles: orderStats.bottles,
                    last_order_at: orderStats.lastOrder,
                };
            });

            if (sortBy && CUSTOMER_COLUMNS[sortBy]) {
                const sortKey = CUSTOMER_COLUMNS[sortBy].dbCol;
                data.sort((a, b) => {
                    const aVal = a[sortKey];
                    const bVal = b[sortKey];
                    if (aVal === bVal) return 0;
                    if (aVal === null || aVal === undefined) return 1;
                    if (bVal === null || bVal === undefined) return -1;
                    const cmp = aVal < bVal ? -1 : 1;
                    return sortOrder === "asc" ? cmp : -cmp;
                });
            }

            if (ids) {
                const idArray = ids.split(",").map(id => id.trim());
                data = data.filter(d => idArray.includes(d.id));
            }
        }
        else if (type === "volunteers") {
            let query = supabase
                .from("volunteers")
                .select("id, name, email, phone, volunteer_id, address, status, confirmed_bottles, created_at")
                .order("created_at", { ascending: false });

            if (ids) {
                const idArray = ids.split(",").map(id => id.trim());
                query = query.in("id", idArray);
            }

            const result = await query;
            data = result.data || [];
            error = result.error;
        }
        else if (type === "feedback") {
            let query = supabase
                .from("feedback")
                .select("id, name, email, rating_overall, rating_ordering, rating_delivery, rating_packing, message, category, status, priority, created_at")
                .order("created_at", { ascending: false });

            if (ids) {
                const idArray = ids.split(",").map(id => id.trim());
                query = query.in("id", idArray);
            }

            const result = await query;
            data = result.data || [];
            error = result.error;
        }

        if (error) {
            console.error("Export query error:", error);
            return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: "No data to export" }, { status: 404 });
        }

        const exportColumns = requestedColumns.filter(c => columnDefs[c] || type !== "orders" && type !== "customers");
        const contentType = format === "excel" 
            ? "application/vnd.ms-excel" 
            : format === "pdf"
            ? "application/pdf"
            : "text/csv";
            
        let content: string;
        let filename: string;

        if (format === "excel") {
            content = convertToExcel(data, exportColumns, columnDefs);
            filename = `${type}_export_${new Date().toISOString().slice(0, 10)}.xls`;
        } else if (format === "pdf") {
            const { jsPDF } = await import("jspdf");
            const doc = new jsPDF({ orientation: "landscape" });
            
            const headers = exportColumns.map(col => columnDefs[col]?.label || col);
            const rows = data.map(row => 
                exportColumns.map(col => {
                    let val = row[col];
                    if (val instanceof Date) val = val.toISOString().split("T")[0];
                    if (typeof val === "object") val = "";
                    return String(val ?? "");
                })
            );
            
            (doc as any).autoTable({
                head: [headers],
                body: rows,
                startY: 10,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 66, 66] },
            });
            
            const pdfBuffer = doc.output("arraybuffer");
            return new Response(pdfBuffer, {
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="${type}_export_${new Date().toISOString().slice(0, 10)}.pdf"`,
                },
            });
        } else {
            content = convertToCSV(data, exportColumns, columnDefs);
            filename = `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
        }

        const BOM = "\uFEFF";
        return new Response(BOM + content, {
            headers: {
                "Content-Type": contentType + "; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
