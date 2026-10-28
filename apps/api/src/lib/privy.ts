import { PrivyClient } from "@privy-io/node";
import { env } from "../env";

export const privy = env.PRIVY_APP_ID
  ? new PrivyClient({ appId: env.PRIVY_APP_ID, appSecret: env.PRIVY_APP_SECRET })
  : null;

/** Returns the Privy user id for a valid access token, or null. */
export async function verifyAccessToken(token: string): Promise<string | null> {
  if (!privy) return null;
  try {
    const claims = await privy.utils().auth().verifyAccessToken(token);
    return claims.user_id;
  } catch {
    return null;
  }
}

export interface PrivyIdentity {
  xHandle: string | null;
  xAvatarUrl: string | null;
  wallets: string[];
}

/**
 * Pulls linked accounts straight from Privy so X handles and wallet
 * addresses are never taken from the client.
 */
export async function fetchIdentity(privyId: string): Promise<PrivyIdentity> {
  if (!privy) throw new Error("Privy is not configured");
  const user = await privy.users()._get(privyId);
  let xHandle: string | null = null;
  let xAvatarUrl: string | null = null;
  const wallets: string[] = [];
  for (const acc of user.linked_accounts) {
    if (acc.type === "twitter_oauth") {
      xHandle = acc.username;
      xAvatarUrl = acc.profile_picture_url;
    } else if (acc.type === "wallet" && "chain_type" in acc && acc.chain_type === "solana") {
      wallets.push(acc.address);
    }
  }
  return { xHandle, xAvatarUrl, wallets };
}
