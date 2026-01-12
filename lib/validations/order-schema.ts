import { z } from "zod";

export const orderSchema = z.object({
    customerName: z.string().min(2, "Name must be at least 2 characters"),
    customerPhone: z
        .string()
        .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"),
    whatsappNumber: z
        .string()
        .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit WhatsApp number"),
    customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),

    // Structured Address Fields
    houseBuilding: z.string().min(2, "House/Building name is required"),
    town: z.string().min(2, "Town is required"),
    post: z.string().min(2, "Post Office is required"),
    city: z.string().min(2, "City is required"),
    pincode: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit pincode"),
    district: z.string().min(2, "District is required"),
    state: z.string().min(2, "State is required"),

    quantity: z.number().min(1, "Quantity must be at least 1").max(50, "Maximum 50 bottles per order"),
    paymentMethod: z.enum(["cod", "upi"]),
    paymentScreenshot: z.any().optional(),
}).refine(
    (data) => {
        // If payment method is UPI, screenshot is required
        if (data.paymentMethod === "upi" && !data.paymentScreenshot) {
            return false;
        }
        return true;
    },
    {
        message: "Payment screenshot is required for UPI payments",
        path: ["paymentScreenshot"],
    }
);

export type OrderFormData = z.infer<typeof orderSchema>;
