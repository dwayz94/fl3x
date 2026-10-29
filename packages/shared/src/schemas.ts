import { z } from "zod";
import { validateUsername } from "./username";

export const usernameSchema = z
  .string()
  .superRefine((v, ctx) => {
    const r = validateUsername(v);
    if (!r.valid) ctx.addIssue({ code: "custom", message: r.message });
  });

/** An invite code (ABCD-2345) or the inviter's handle, from a referral link. */
export const inviteCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_.-]{2,32}$/, "Invalid invite code");

export const claimRequest = z.object({
  username: usernameSchema,
  inviteCode: inviteCodeSchema.optional(),
});

/** Joining the waitlist needs no form: the X account comes from the session. */
export const waitlistRequest = z.object({
  desiredUsername: usernameSchema.optional(),
  ref: inviteCodeSchema.optional(),
});

export type ClaimRequest = z.infer<typeof claimRequest>;
export type WaitlistRequest = z.infer<typeof waitlistRequest>;
