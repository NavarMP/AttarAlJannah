import { z } from "zod";

export const studentLoginSchema = z.object({
    identifier: z.string().min(1, "Please enter your phone number or student ID"),
});

export type StudentLoginData = z.infer<typeof studentLoginSchema>;

export const otpSchema = z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
});

export type OTPData = z.infer<typeof otpSchema>;
