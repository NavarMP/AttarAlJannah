"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Phone, Mail, MapPin } from "lucide-react";
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

export function OrderBill({ order }: OrderBillProps) {
    const billRef = useRef<HTMLDivElement>(null);

    const downloadPDF = async () => {
        const element = billRef.current;
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

    const unitPrice = order.total_price / order.quantity;

    return (
        <div className="space-y-4">
            {/* Bill Container */}
            <Card className="rounded-3xl overflow-hidden border-2 border-border">
                <div ref={billRef} className="p-8 bg-white" style={{ backgroundColor: '#ffffff' }}>
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
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
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
                                    <span className="text-gray-700 uppercase">{order.payment_method}</span>
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
            </Card>

            {/* Download Button */}
            <Button
                onClick={downloadPDF}
                className="w-full bg-gradient-to-r from-primary to-gold-500 hover:from-primary/90 hover:to-gold-600 rounded-2xl"
                size="lg"
            >
                <Download className="w-4 h-4 mr-2" />
                Download Bill (PDF)
            </Button>
        </div>
    );
}
