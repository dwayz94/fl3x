import { env } from "../../env";
import { cached, fetchJson } from "../cache";

export interface MediaData {
  provider: "youtube" | "spotify" | "twitch";
  title: string;
  author: string | null;
  thumbnailUrl: string | null;
  live: boolean | null;
  url: string;
  /** Channel picture, when the media comes from a channel. */
  avatarUrl?: string | null;
  publishedAt?: string | null;
  viewers?: number | null;
  /** Spotify: true while the member is listening, false for their last played track. */
  nowPlaying?: boolean | null;
}

interface OEmbed {
  title: string;
  author_name?: string;
  thumbnail_url?: string;
}

let twitchToken: { value: string; expiresAt: number } | null = null;

export async function twitchAppToken() {
  if (twitchToken && twitchToken.expiresAt > Date.now()) return twitchToken.value;
  const res = await fetchJson<{ access_token: string; expires_in: number }>(
    `https://id.twitch.tv/oauth2/token?client_id=${env.TWITCH_CLIENT_ID}&client_secret=${env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" },
  );
  twitchToken = { value: res.access_token, expiresAt: Date.now() + (res.expires_in - 60) * 1000 };
  return twitchToken.value;
}

export function getMedia(rawUrl: string) {
  const url = new URL(rawUrl);
  const host = url.hostname.replace(/^(www|m|open)\./, "");

  if (host === "youtube.com" || host === "youtu.be") {
    return cached<MediaData>(`yt:${url.href}`, 3600, async () => {
      const o = await fetchJson<OEmbed>(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url.href)}`);
      return { provider: "youtube", title: o.title, author: o.author_name ?? null, thumbnailUrl: o.thumbnail_url ?? null, live: null, url: url.href };
    });
  }

  if (host === "spotify.com") {
    return cached<MediaData>(`spotify:${url.pathname}`, 3600, async () => {
      const o = await fetchJson<OEmbed>(`https://open.spotify.com/oembed?url=${encodeURIComponent(url.href)}`);
      return { provider: "spotify", title: o.title, author: o.author_name ?? null, thumbnailUrl: o.thumbnail_url ?? null, live: null, url: url.href };
    });
  }

  if (host === "twitch.tv") {
    const login = url.pathname.split("/")[1]?.toLowerCase();
    if (!login) return Promise.resolve(null);
    return cached<MediaData>(`twitch:${login}`, 120, async () => {
      const base: MediaData = { provider: "twitch", title: login, author: login, thumbnailUrl: null, live: null, url: `https://twitch.tv/${login}` };
      if (!env.TWITCH_CLIENT_ID) return base;
      const headers = { "client-id": env.TWITCH_CLIENT_ID, authorization: `Bearer ${await twitchAppToken()}` };
      const [streams, users] = await Promise.all([
        fetchJson<{ data: { title: string; thumbnail_url: string }[] }>(`https://api.twitch.tv/helix/streams?user_login=${login}`, { headers }),
        fetchJson<{ data: { display_name: string; profile_image_url: string }[] }>(`https://api.twitch.tv/helix/users?login=${login}`, { headers }),
      ]);
      const stream = streams.data[0];
      const user = users.data[0];
      return {
        ...base,
        title: stream?.title ?? user?.display_name ?? login,
        author: user?.display_name ?? login,
        thumbnailUrl: stream ? stream.thumbnail_url.replace("{width}", "640").replace("{height}", "360") : (user?.profile_image_url ?? null),
        live: Boolean(stream),
      };
    });
  }

  return Promise.resolve(null);
}

const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";

async function page(url: string) {
  const res = await fetch(url, { headers: { "user-agent": BROWSER_UA, "accept-language": "en-US,en" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`);
  return res.text();
}

const decodeXml = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/**
 * Latest video of a YouTube channel, or its live stream when it is live.
 * No API key: the channel page gives the channel id, the public RSS feed
 * gives the uploads.
 */
function youtubeChannel(handle: string) {
  return cached<MediaData | null>(`yt-channel:${handle.toLowerCase()}`, 600, async () => {
    const html = await page(`https://www.youtube.com/@${handle}`);
    const channelId = html.match(/channel_id=(UC[\w-]{22})/)?.[1];
    if (!channelId) return null;
    const meta = (p: string) => html.match(new RegExp(`<meta property="${p}" content="([^"]*)"`))?.[1];
    const avatarUrl = meta("og:image") ?? null;
    const name = decodeXml(meta("og:title") ?? handle);

    const live = await page(`https://www.youtube.com/@${handle}/live`).catch(() => "");
    const liveId = /"isLiveNow":true/.test(live) ? live.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/)?.[1] : undefined;
    if (liveId) {
      const title = decodeXml(live.match(/<meta property="og:title" content="([^"]*)"/)?.[1] ?? name);
      return { provider: "youtube", title, author: name, avatarUrl, thumbnailUrl: `https://i.ytimg.com/vi/${liveId}/hqdefault_live.jpg`, live: true, url: `https://www.youtube.com/watch?v=${liveId}` };
    }

    const feed = await page(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    const entry = feed.split("<entry>")[1];
    if (!entry) return { provider: "youtube", title: name, author: name, avatarUrl, thumbnailUrl: avatarUrl, live: false, url: `https://www.youtube.com/@${handle}` };
    const id = entry.match(/<yt:videoId>([^<]+)/)?.[1];
    return {
      provider: "youtube",
      title: decodeXml(entry.match(/<title>([^<]*)/)?.[1] ?? name),
      author: name,
      avatarUrl,
      thumbnailUrl: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : avatarUrl,
      live: false,
      publishedAt: entry.match(/<published>([^<]+)/)?.[1] ?? null,
      url: id ? `https://www.youtube.com/watch?v=${id}` : `https://www.youtube.com/@${handle}`,
    };
  });
}

type HelixVideo = { title: string; thumbnail_url: string; url: string; created_at: string };

/**
 * Twitch channel: the live stream if live, otherwise the latest VOD.
 * Uses Helix with TWITCH_CLIENT_ID/SECRET, else the free decapi.me endpoints.
 */
function twitchChannel(login: string) {
  return cached<MediaData | null>(`twitch-channel:${login.toLowerCase()}`, 120, async () => {
    const url = `https://twitch.tv/${login}`;
    const preview = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login.toLowerCase()}-640x360.jpg`;
    if (env.TWITCH_CLIENT_ID) {
      const headers = { "client-id": env.TWITCH_CLIENT_ID, authorization: `Bearer ${await twitchAppToken()}` };
      const users = await fetchJson<{ data: { id: string; display_name: string; profile_image_url: string }[] }>(`https://api.twitch.tv/helix/users?login=${login}`, { headers });
      const user = users.data[0];
      if (!user) return null;
      const streams = await fetchJson<{ data: { title: string; viewer_count: number }[] }>(`https://api.twitch.tv/helix/streams?user_id=${user.id}`, { headers });
      const stream = streams.data[0];
      if (stream) {
        return { provider: "twitch", title: stream.title, author: user.display_name, avatarUrl: user.profile_image_url, thumbnailUrl: preview, live: true, viewers: stream.viewer_count, url };
      }
      const videos = await fetchJson<{ data: HelixVideo[] }>(`https://api.twitch.tv/helix/videos?user_id=${user.id}&first=1&type=archive`, { headers });
      const v = videos.data[0];
      return {
        provider: "twitch",
        title: v?.title ?? `${user.display_name} on Twitch`,
        author: user.display_name,
        avatarUrl: user.profile_image_url,
        thumbnailUrl: v ? v.thumbnail_url.replace("%{width}", "640").replace("%{height}", "360") : user.profile_image_url,
        live: false,
        publishedAt: v?.created_at ?? null,
        url: v?.url ?? url,
      };
    }
    const text = (path: string) => page(`https://decapi.me/twitch/${path}/${login}`).then((t) => t.trim());
    const [uptime, title, avatar] = await Promise.all([text("uptime"), text("title"), text("avatar")]);
    if (/not found|error/i.test(avatar)) return null;
    const live = !/offline/i.test(uptime);
    return { provider: "twitch", title: title || `${login} on Twitch`, author: login, avatarUrl: avatar.startsWith("https://") ? avatar : null, thumbnailUrl: live ? preview : avatar, live, url };
  });
}

export function getChannel(platform: "youtube" | "twitch", handle: string) {
  return platform === "youtube" ? youtubeChannel(handle) : twitchChannel(handle);
}
