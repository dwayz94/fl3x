import { cached, fetchJson } from "../cache";

/**
 * Real follower counts, from free public sources (no paid X API):
 * - X: fxtwitter's public API, vxtwitter as a fallback (open-source X embed services);
 * - YouTube: the channel page (rounded, e.g. "524M subscribers");
 * - Twitch: decapi.me;
 * - TikTok: the profile page's embedded data.
 * Cached an hour: counts move slowly and these hosts deserve some respect.
 */
export type FollowerPlatform = "x" | "youtube" | "twitch" | "tiktok";
export interface FollowersData {
  platform: FollowerPlatform;
  handle: string;
  count: number;
  /** YouTube rounds its numbers (524M): shown as such. */
  approximate: boolean;
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

async function page(url: string, cookie?: string) {
  const res = await fetch(url, {
    headers: { "user-agent": UA, "accept-language": "en-US,en", ...(cookie ? { cookie } : {}) },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

const unit: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9 };

async function fromX(handle: string) {
  try {
    const fx = await fetchJson<{ user?: { followers?: number } }>(`https://api.fxtwitter.com/${handle}`);
    if (typeof fx.user?.followers === "number") return fx.user.followers;
  } catch {
    // fall through to vxtwitter
  }
  const vx = await fetchJson<{ followers_count?: number }>(`https://api.vxtwitter.com/${handle}`);
  if (typeof vx.followers_count !== "number") throw new Error("X account not found");
  return vx.followers_count;
}

async function fromYouTube(handle: string) {
  // The consent cookie skips the EU consent page (the API runs in Frankfurt).
  const html = await page(`https://www.youtube.com/@${handle}`, "CONSENT=YES+1; SOCS=CAI");
  const m = html.match(/"content":"([\d.]+)([KMB]?) subscribers"/) ?? html.match(/"simpleText":"([\d.]+)([KMB]?) subscribers"/);
  if (!m) throw new Error("YouTube channel not found");
  return Math.round(Number(m[1]) * (unit[m[2]!] ?? 1));
}

async function fromTwitch(handle: string) {
  const res = await fetch(`https://decapi.me/twitch/followcount/${handle}`, { signal: AbortSignal.timeout(8000) });
  const n = Number((await res.text()).trim());
  if (!res.ok || !Number.isFinite(n)) throw new Error("Twitch channel not found");
  return n;
}

async function fromTikTok(handle: string) {
  const html = await page(`https://www.tiktok.com/@${handle}`);
  const m = html.match(/"followerCount":(\d+)/);
  if (!m) throw new Error("TikTok account not found");
  return Number(m[1]);
}

export function getFollowers(platform: FollowerPlatform, handle: string): Promise<FollowersData> {
  const h = handle.replace(/^@/, "");
  return cached<FollowersData>(`followers:${platform}:${h.toLowerCase()}`, 3600, async () => {
    const count =
      platform === "x" ? await fromX(h) : platform === "youtube" ? await fromYouTube(h) : platform === "twitch" ? await fromTwitch(h) : await fromTikTok(h);
    return { platform, handle: h, count, approximate: platform === "youtube" };
  });
}
