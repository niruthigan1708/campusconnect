import { z } from "zod";
import { EVENT_CATEGORIES } from "./types";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["STUDENT", "ORGANIZER"]),
    clubName: z.string().optional(),
    clubDescription: z.string().optional(),
    clubContactEmail: z.string().optional(),
  })
  .refine((data) => data.role !== "ORGANIZER" || (data.clubName?.trim().length ?? 0) > 0, {
    message: "Club name is required when registering as an organizer",
    path: ["clubName"],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const eventSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    eventDate: z.string().min(1, "Event date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    location: z.string().min(2, "Location is required"),
    capacity: z.coerce.number().int().positive("Capacity must be a positive number"),
    category: z.enum(EVENT_CATEGORIES as [string, ...string[]]),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Start time must be before end time",
    path: ["endTime"],
  })
  .refine((data) => data.eventDate >= new Date().toISOString().slice(0, 10), {
    message: "Event date cannot be in the past",
    path: ["eventDate"],
  });
export type EventFormValues = z.infer<typeof eventSchema>;

export const clubSchema = z.object({
  name: z.string().min(2, "Club name must be at least 2 characters").max(100, "Club name must not exceed 100 characters"),
  description: z.string().max(2000, "Description must not exceed 2000 characters").optional(),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
});
export type ClubFormValues = z.infer<typeof clubSchema>;
