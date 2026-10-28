import { z } from "zod";
import { validateUsername } from "./username";

export const usernameSchema = z
  .string()
  .superRefine((v, ctx) => {
    const r = validateUsername(v);
    if (!r.valid) ctx.addIssue({ code: "custom", message: r.message });
  });

export const inviteCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{4,24}$/, "Invalid invite code");

export const claimRequest = z.object({
  username: usernameSchema,
  inviteCode: inviteCodeSchema.optional(),
});

export const waitlistRequest = z.object({
  email: z.email().optional(),
  xHandle: z.string().trim().regex(/^@?[A-Za-z0-9_]{1,15}$/, "Invalid X handle").optional(),
  desiredUsername: usernameSchema.optional(),
  ref: inviteCodeSchema.optional(),
}).refine((v) => v.email || v.xHandle, { message: "Email or X handle required" });

export type ClaimRequest = z.infer<typeof claimRequest>;
export type WaitlistRequest = z.infer<typeof waitlistRequest>;
