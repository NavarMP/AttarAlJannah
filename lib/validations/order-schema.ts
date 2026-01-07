import { z } from "zod";

export const orderSchema = z.object({
    customerName: z.string().min(2, "Name must be at least 2 characters"),
    customerPhone: z
        .string()
        .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"),
    customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    customerAddress: z.string().min(10, "Address must be at least 10 characters"),
    quantity: z.number().min(1, "Quantity must be at least 1").max(50, "Maximum 50 bottles per order"),
    paymentMethod: z.enum(["cod", "upi"]),
    paymentScreenshot: z.any().optional(),
});

export type OrderFormData = z.infer<typeof orderSchema>;
