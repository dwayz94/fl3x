/**
 * invite_only: pre-launch, signing up requires an invite code; everyone
 *              else lands on the waitlist.
 * public:      open registration (invite codes still give referral credit).
 */
export const LAUNCH_PHASES = ["invite_only", "public"] as const;
export type LaunchPhase = (typeof LAUNCH_PHASES)[number];
