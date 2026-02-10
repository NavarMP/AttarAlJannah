import { z } from "zod";

export const volunteerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phoneCountry: z.string().default("+91"),
    phone: z
        .string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number is too long"),
    volunteer_id: z.string().min(3, "Volunteer ID is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
    goal: z.number().min(1, "Goal must be at least 1").default(20),

    // Optional address fields for delivery assignment
    houseBuilding: z.string().optional().or(z.literal("")),
    town: z.string().optional().or(z.literal("")),
    pincode: z.string().optional().or(z.literal("")),
    post: z.string().optional().or(z.literal("")),
    city: z.string().optional().or(z.literal("")),
    district: z.string().optional().or(z.literal("")),
    state: z.string().optional().or(z.literal("")),
    locationLink: z.string().optional().or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type VolunteerFormData = z.infer<typeof volunteerSchema>;
