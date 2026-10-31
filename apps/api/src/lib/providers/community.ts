import { cached, fetchJson } from "../cache";

export interface CommunityData {
  platform: "discord" | "telegram";
  name: string;
  iconUrl: string | null;
  members: number | null;
  online: number | null;
  url: string;
}

interface DiscordInvite {
  guild?: { id: string; name: string; icon: string | null };
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

function discordCode(url: URL) {
  if (url.hostname === "discord.gg") return url.pathname.slice(1);
  const m = url.pathname.match(/^\/invite\/([\w-]+)/);
  return m?.[1] ?? null;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const toInt = (s: string | undefined) => (s ? Number(s.replace(/[\s,]/g, "")) : null);

export function getCommunity(rawUrl: string) {
  const url = new URL(rawUrl);
  const host = url.hostname.replace(/^www\./, "");

  if (host === "discord.gg" || host === "discord.com") {
    const code = discordCode(url);
    // Same rules as the link field: anything else would only make new cache entries and upstream calls.
    if (!code || !/^[A-Za-z0-9_-]{2,32}$/.test(code)) return Promise.resolve(null);
    return cached<CommunityData | null>(`discord:${code}`, 600, async () => {
      const inv = await fetchJson<DiscordInvite>(`https://discord.com/api/v10/invites/${code}?with_counts=true`);
      if (!inv.guild) return null;
      return {
        platform: "discord",
        name: inv.guild.name,
        iconUrl: inv.guild.icon ? `https://cdn.discordapp.com/icons/${inv.guild.id}/${inv.guild.icon}.png?size=128` : null,
        members: inv.approximate_member_count ?? null,
        online: inv.approximate_presence_count ?? null,
        url: `https://discord.gg/${code}`,
      };
    });
  }

  if (host === "t.me" || host === "telegram.me") {
    const handle = url.pathname.split("/")[1];
    if (!handle || !/^[A-Za-z0-9_-]{2,32}$/.test(handle)) return Promise.resolve(null);
    // Public preview page; no bot token needed.
    return cached<CommunityData | null>(`telegram:${handle.toLowerCase()}`, 1800, async () => {
      const res = await fetch(`https://t.me/${handle}`, { signal: AbortSignal.timeout(8000) });
      const html = await res.text();
      const meta = (p: string) => html.match(new RegExp(`<meta property="${p}" content="([^"]*)"`))?.[1];
      const extra = html.match(/<div class="tgme_page_extra">([^<]*)<\/div>/)?.[1] ?? "";
      const members = extra.match(/([\d\s,]+)\s+(members|subscribers)/)?.[1];
      const online = extra.match(/([\d\s,]+)\s+online/)?.[1];
      const name = meta("og:title");
      // Unknown handles render a generic "Telegram: Contact @x" page.
      if (!name || name.startsWith("Telegram: Contact")) return null;
      return {
        platform: "telegram",
        name: decode(name),
        iconUrl: meta("og:image") ?? null,
        members: toInt(members),
        online: toInt(online),
        url: `https://t.me/${handle}`,
      };
    });
  }

  return Promise.resolve(null);
}
