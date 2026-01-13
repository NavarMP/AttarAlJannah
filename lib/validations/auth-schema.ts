import { z } from "zod";

export const volunteerLoginSchema = z.object({
    identifier: z.string().min(1, "Please enter your phone number or volunteer ID"),
});

export type VolunteerLoginData = z.infer<typeof volunteerLoginSchema>;

export const otpSchema = z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
});

export type OTPData = z.infer<typeof otpSchema>;
