"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Phone, Mail, MapPin, Printer } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Image from "next/image";

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    whatsapp_number: string;
    customer_email: string | null;
    customer_address: string;
    product_name: string;
    quantity: number;
    total_price: number;
    payment_method: string;
    payment_status: string;
    order_status: string;
    created_at: string;
}

interface OrderBillProps {
    order: Order;
}

const BillContent = React.forwardRef<HTMLDivElement, { order: Order }>(({ order }, ref) => {
    const unitPrice = order.total_price / order.quantity;

    return (
        <div ref={ref} className="p-8 min-w-[700px] md:min-w-0 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-primary/30">
                <div>
                    <Image
                        src="/assets/dars logo.svg"
                        alt="Minhajul Janna Dars"
                        width={80}
                        height={80}
                        className="dark:brightness-[180%] dark:contrast-75"
                    />
                </div>
                <div className="text-right">
                    <h1 className="text-3xl font-bold text-primary">ORDER INVOICE</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                </div>
            </div>

            {/* Order Info and Customer Info Grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Order Date */}
                <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Order Date</h3>
                    <p className="text-gray-600">
                        {new Date(order.created_at).toLocaleString("en-IN", {
                            dateStyle: "long",
                            timeStyle: "short",
                        })}
                    </p>
                </div>

                {/* Order Status */}
                <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Status</h3>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 capitalize">
                            {order.order_status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                            {order.payment_status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Customer Details */}
            <div className="mb-8">
                <h3 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-300">
                    Customer Details
                </h3>
                <div className="space-y-2">
                    <p className="text-gray-700">
                        <span className="font-medium">Name:</span> {order.customer_name}
                    </p>
                    <p className="text-gray-700">
                        <span className="font-medium">Phone:</span> {order.customer_phone}
                    </p>
                    <p className="text-gray-700">
                        <span className="font-medium">WhatsApp:</span> {order.whatsapp_number}
                    </p>
                    {order.customer_email && (
                        <p className="text-gray-700">
                            <span className="font-medium">Email:</span> {order.customer_email}
                        </p>
                    )}
                    <p className="text-gray-700">
                        <span className="font-medium">Delivery Address:</span> {order.customer_address}
                    </p>
                </div>
            </div>

            {/* Order Items Table */}
            <div className="mb-8">
                <h3 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-300">
                    Order Items
                </h3>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-300">
                            <th className="text-left py-2 font-semibold text-gray-800">Product</th>
                            <th className="text-center py-2 font-semibold text-gray-800">Quantity</th>
                            <th className="text-right py-2 font-semibold text-gray-800">Unit Price</th>
                            <th className="text-right py-2 font-semibold text-gray-800">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-gray-300">
                            <td className="py-3 text-gray-700">{order.product_name}</td>
                            <td className="py-3 text-center text-gray-700">{order.quantity}</td>
                            <td className="py-3 text-right text-gray-700">₹{unitPrice.toFixed(2)}</td>
                            <td className="py-3 text-right font-semibold text-gray-800">₹{order.total_price}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Payment & Total */}
            <div className="mb-8">
                <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between py-2 border-t border-gray-300">
                            <span className="font-semibold text-gray-800">Payment Method:</span>
                            <span className="text-gray-700">{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method === 'volunteer_cash' ? 'Cash (Volunteer)' : order.payment_method === 'qr' ? 'UPI' : order.payment_method === 'razorpay' ? 'Razorpay' : order.payment_method}</span>
                        </div>
                        <div className="flex justify-between py-2 border-t-2 border-primary">
                            <span className="font-bold text-lg text-gray-800">Grand Total:</span>
                            <span className="font-bold text-lg text-primary">₹{order.total_price}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Company Info */}
            <div className="pt-6 border-t-2 border-gray-300">
                <h3 className="font-semibold text-gray-800 mb-3">Minhajul Janna Dars</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 mt-0.5 text-primary" />
                        <div>
                            <p>+91 907 235 8001</p>
                            <p>+91 907 235 8002</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Mail className="w-4 h-4 mt-0.5 text-primary" />
                        <p className="break-all">minhajuljanna786@gmail.com</p>
                    </div>
                    <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                        <div>
                            <p>Naduvannur, Pullaloor,</p>
                            <p>Koduvally, Kerala</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Note */}
            <div className="mt-6 pt-4 border-t border-gray-300 text-center">
                <p className="text-xs text-gray-600 italic">
                    Thank you for your order! For any queries, please contact us at the above details.
                </p>
                <p className="text-xs text-gray-600 mt-1">
                    This is a computer-generated invoice and does not require a signature.
                </p>
            </div>
        </div>
    );
});
BillContent.displayName = "BillContent";

export function OrderBill({ order }: OrderBillProps) {
    const hiddenBillRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handlePrint = async () => {
        const element = hiddenBillRef.current;
        if (!element) return;

        try {
            toast.loading("Preparing print view...");

            // Capture the bill as canvas
            const canvas = await html2canvas(element, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL("image/png");

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head><title>Invoice - ${order.id.slice(0, 8)}</title></head>
                        <body style="margin:0; display:flex; justify-content:center; padding: 20px;">
                            <img src="${imgData}" style="max-width:100%; height:auto; box-shadow: 0 0 10px rgba(0,0,0,0.1);" />
                            <script>
                                window.onload = () => { 
                                    setTimeout(() => { 
                                        window.print(); 
                                        // window.close(); // Optional: close after print
                                    }, 500); 
                                };
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
                toast.dismiss();
            } else {
                toast.error("Please allow popups to print");
                toast.dismiss();
            }
        } catch (error) {
            console.error("Print generation error:", error);
            toast.dismiss();
            toast.error("Failed to generate print view");
        }
    };

    const downloadPDF = async () => {
        const element = hiddenBillRef.current;
        if (!element) return;

        try {
            toast.loading("Generating PDF...");

            // Capture the bill as canvas
            const canvas = await html2canvas(element, {
                scale: 2,
                logging: false,
                useCORS: true,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
            pdf.save(`invoice-${order.id.slice(0, 8)}.pdf`);

            toast.dismiss();
            toast.success("PDF downloaded successfully!");
        } catch (error) {
            console.error("PDF generation error:", error);
            toast.dismiss();
            toast.error("Failed to generate PDF");
        }
    };

    return (
        <div className="space-y-4">
            <Card className="glass-strong rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardHeader className="border-b border-border/50 bg-secondary/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                Invoice #{order.id.slice(0, 8).toUpperCase()}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {new Date(order.created_at).toLocaleDateString()} • ₹{order.total_price}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsOpen(!isOpen)}
                                className="rounded-xl"
                            >
                                {isOpen ? "Hide Invoice" : "View Invoice"}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                                className="rounded-xl"
                            >
                                <span className="sr-only sm:not-sr-only sm:mr-2">Print</span>
                                <Printer className="w-4 h-4 sm:hidden" />
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={downloadPDF}
                                className="rounded-xl bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600"
                            >
                                <Download className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Download PDF</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {isOpen && (
                    <CardContent className="p-0 bg-white">
                        <div className="overflow-x-auto">
                            <BillContent order={order} />
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Hidden Bill for Capture */}
            <div style={{ position: 'absolute', top: 0, left: '-9999px', width: '794px' }}>
                <BillContent ref={hiddenBillRef} order={order} />
            </div>
        </div>
    );
}
