import { z } from "@/lib/zod";

export const loginSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email")),
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required")
    .max(200, "Invalid email or password"),
});

export const registerSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email")),
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    // bcrypt only reads the first 72 bytes; anything past that would be ignored.
    .refine((value) => new TextEncoder().encode(value).length <= 72, {
      message: "Password must be at most 72 characters",
    }),
  inviteCode: z
    .string({ error: "Invite code is required" })
    .trim()
    .min(1, "Invite code is required")
    .max(64, "This invite code is invalid or has already been used"),
});

export const registerFormSchema = registerSchema
  .extend({
    passwordConfirm: z.string({ error: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });
