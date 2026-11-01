export interface AnalyticsSummary {
  range: { from: string; to: string };
  totalViews: number;
  uniqueVisitors: number;
  realtime: number; // visitors in the last 5 minutes
  daily: { date: string; views: number }[];
  clicks: { target: string; count: number }[];
  devices: { device: "desktop" | "mobile" | "tablet"; count: number }[];
  countries: { country: string; count: number }[];
  referrers: { referrer: string; count: number }[];
  /** Where visitors came from (referrer grouped by site), "direct" when there was none. */
  sources: { source: TrafficSource; count: number }[];
}

export const TRAFFIC_SOURCES = [
  { id: "x", label: "X", hosts: ["x.com", "twitter.com", "t.co"] },
  { id: "telegram", label: "Telegram", hosts: ["t.me", "telegram.org", "web.telegram.org"] },
  { id: "discord", label: "Discord", hosts: ["discord.com", "discord.gg", "discordapp.com"] },
  { id: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be"] },
  { id: "tiktok", label: "TikTok", hosts: ["tiktok.com"] },
  { id: "instagram", label: "Instagram", hosts: ["instagram.com", "l.instagram.com"] },
  { id: "twitch", label: "Twitch", hosts: ["twitch.tv"] },
  { id: "kick", label: "Kick", hosts: ["kick.com"] },
  { id: "google", label: "Google", hosts: ["google."] },
  { id: "other", label: "Other sites", hosts: [] },
  { id: "direct", label: "Direct", hosts: [] },
] as const;
export type TrafficSource = (typeof TRAFFIC_SOURCES)[number]["id"];

/** Referrer host (e.g. "t.co") → traffic source. */
export function sourceOf(host: string | null | undefined): TrafficSource {
  if (!host) return "direct";
  const h = host.toLowerCase();
  for (const s of TRAFFIC_SOURCES) {
    if (s.hosts.some((x) => (x.endsWith(".") ? h.startsWith(x) || h.includes(`.${x}`) : h === x || h.endsWith(`.${x}`)))) return s.id;
  }
  return "other";
}

export type TrackEvent = { kind: "view" } | { kind: "click"; target: string };
