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
    goal: z.number().min(1, "Goal must be at least 1").default(20),
});

export type VolunteerFormData = z.infer<typeof volunteerSchema>;
