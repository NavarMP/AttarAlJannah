import { z } from "zod";

export const orderSchema = z.object({
    customerName: z.string().min(2, "Name must be at least 2 characters"),
    customerPhoneCountry: z.string().default("+91"),
    customerPhone: z
        .string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number is too long"),
    whatsappNumberCountry: z.string().default("+91"),
    whatsappNumber: z
        .string()
        .min(10, "WhatsApp number must be at least 10 digits")
        .max(15, "WhatsApp number is too long"),
    customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),

    // Structured Address Fields
    houseBuilding: z.string().min(2, "House/Building name is required"),
    town: z.string().min(2, "Town is required"),
    post: z
        .string()
        .min(2, "Post Office is required")
        .regex(/^[a-zA-Z\s-]+$/, "Post Office should only contain letters"),
    city: z.string().min(2, "City is required"),
    pincode: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit pincode"),
    district: z
        .string()
        .min(2, "District is required")
        .regex(/^[a-zA-Z\s-]+$/, "District should only contain letters"),
    state: z
        .string()
        .min(2, "State is required")
        .regex(/^[a-zA-Z\s-]+$/, "State should only contain letters"),

    // Optional location link
    locationLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),

    quantity: z.number().min(1, "Quantity must be at least 1"),

    // Payment method removed - all orders use Razorpay
    // paymentScreenshot removed - not needed for Razorpay
});

export type OrderFormData = z.infer<typeof orderSchema>;
