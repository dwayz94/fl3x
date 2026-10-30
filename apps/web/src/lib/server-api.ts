import type { PublicConfig } from "@fl3x/shared";
import { site } from "@/config/site";

const fallbackConfig: PublicConfig = {
  phase: "invite_only",
  token: { symbol: "FL3X", mint: null },
  thresholds: { starter: 100_000, premium: 1_000_000 },
  banner: null,
};

/** Server-side fetch of the public config, cached 1 min (admin changes show up quickly). Never breaks the landing page. */
export async function getPublicConfig(): Promise<PublicConfig> {
  try {
    const res = await fetch(`${site.apiUrl}/config`, { next: { revalidate: 60 } });
    if (!res.ok) return fallbackConfig;
    return (await res.json()) as PublicConfig;
  } catch {
    return fallbackConfig;
  }
}
