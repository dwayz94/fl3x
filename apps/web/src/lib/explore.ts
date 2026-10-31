import type { ExploreProfile } from "@fl3x/shared";
import { site } from "@/config/site";

/** Public directory from the API, cached 5 min. Never breaks the page: an empty list on failure. */
export async function getExplore(sort: "popular" | "new", limit = 60): Promise<ExploreProfile[]> {
  try {
    const res = await fetch(`${site.apiUrl}/explore?sort=${sort}&limit=${limit}`, {
      next: { revalidate: 300 },
      // Server calls all come from Vercel's shared IPs: the internal key skips the per-IP limit.
      headers: process.env.INTERNAL_API_KEY ? { "x-internal-key": process.env.INTERNAL_API_KEY } : undefined,
    });
    return res.ok ? ((await res.json()) as ExploreProfile[]) : [];
  } catch {
    return [];
  }
}
