import { z } from "zod";

/**
 * invite_only: pre-launch, signing up requires an invite code; everyone
 *              else lands on the waitlist.
 * public:      open registration (invite codes still give referral credit).
 */
export const LAUNCH_PHASES = ["invite_only", "public"] as const;
export type LaunchPhase = (typeof LAUNCH_PHASES)[number];


/** Solana mint address (base58, 32–44 chars). */
export const mintSchema = z.string().trim().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Not a Solana token address");

/**
 * Live site settings, edited from /admin without a restart. Stored in the API's
 * database; anything never set falls back to the API env.
 */
export const siteSettingsSchema = z.object({
  phase: z.enum(LAUNCH_PHASES),
  tokenMint: mintSchema.nullable(),
  thresholds: z.object({ starter: z.number().int().min(0), premium: z.number().int().min(0) }).refine((t) => t.premium >= t.starter, "Premium must be at least Starter"),
  /** null = automatic text from the phase and token; "off" = hidden. */
  banner: z
    .union([
      z.literal("off"),
      z.object({
        text: z.string().trim().min(1).max(120),
        detail: z.string().trim().max(160).nullable(),
        link: z.object({ label: z.string().trim().min(1).max(40), url: z.string().trim().regex(/^(https?:\/\/|\/)/, "Link must start with https:// or /") }).nullable(),
      }),
    ])
    .nullable(),
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
