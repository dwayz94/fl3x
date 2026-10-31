import { env } from "../../env";
import { cached, fetchJson } from "../cache";
import { badRequest } from "../errors";

export interface MediaData {
  provider: "youtube" | "spotify" | "twitch" | "apple" | "deezer" | "tidal";
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
  // Default ports only: whatever we fetch is rebuilt from the service's own address below.
  if (url.port) return Promise.reject(badRequest("Unsupported media link"));
  const host = url.hostname.replace(/^(www|m|open)\./, "");

  if (host === "youtube.com" || host === "youtu.be") {
    // Keyed by video id: query strings (?si=, tracking, junk) don't create new entries or upstream calls.
    const id = host === "youtu.be" ? url.pathname.slice(1) : (url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).pop() ?? "");
    if (!/^[\w-]{6,20}$/.test(id)) return Promise.reject(badRequest("Not a YouTube video link"));
    const clean = `https://www.youtube.com/watch?v=${id}`;
    return cached<MediaData>(`yt:${id}`, 3600, async () => {
      const o = await fetchJson<OEmbed>(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(clean)}`);
      return { provider: "youtube", title: o.title, author: o.author_name ?? null, thumbnailUrl: o.thumbnail_url ?? null, live: null, url: clean };
    });
  }

  if (host === "spotify.com") {
    // Rebuilt from type + id: the cache key, the fetch and the stored link never carry the asker's query or port.
    const m = /^(?:\/intl-[a-z-]+)?\/(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]{10,30})/.exec(url.pathname);
    if (!m) return Promise.reject(badRequest("Not a Spotify link"));
    const clean = `https://open.spotify.com/${m[1]}/${m[2]}`;
    return cached<MediaData>(`spotify:/${m[1]}/${m[2]}`, 3600, async () => {
      const o = await fetchJson<OEmbed>(`https://open.spotify.com/oembed?url=${encodeURIComponent(clean)}`);
      // oEmbed has no artist: the public page names it in its meta tags.
      const author = o.author_name ?? (await spotifyArtist(clean));
      return { provider: "spotify", title: o.title, author, thumbnailUrl: o.thumbnail_url ?? null, live: null, url: clean };
    });
  }

  // Music services without Spotify's oEmbed: each has a free public source for one track.
  if (host === "deezer.com" || host === "link.deezer.com" || host === "deezer.page.link") return deezerTrack(url);
  if (host === "music.apple.com") {
    // Album links name the track with ?i=, song links end with it.
    const id = url.searchParams.get("i") ?? (url.pathname.includes("/song/") ? url.pathname.split("/").pop() : undefined);
    if (!id || !/^\d{5,15}$/.test(id)) return Promise.reject(badRequest("Not an Apple Music track link"));
    return appleTrack(id);
  }
  if (host === "tidal.com" || host === "listen.tidal.com") {
    const id = url.pathname.match(/\/track\/(\d+)/)?.[1];
    if (!id) return Promise.reject(badRequest("Not a TIDAL track link"));
    return tidalTrack(id);
  }

  if (host === "twitch.tv") {
    const login = url.pathname.split("/")[1]?.toLowerCase();
    if (!login || !/^[a-z0-9_]{3,25}$/.test(login)) return Promise.reject(badRequest("Not a Twitch channel link"));
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

/** Deezer's public API (no key). Short share links (link.deezer.com) are followed to the track first. */
async function deezerTrack(url: URL) {
  let id = url.pathname.match(/\/track\/(\d+)/)?.[1];
  const short = /^\/(s\/)?[A-Za-z0-9]{4,20}$/.exec(url.pathname);
  if (!id && short && (url.hostname === "link.deezer.com" || url.hostname === "deezer.page.link")) {
    // Short share links: followed once, the track id they lead to is cached a day.
    id =
      (await cached<string | null>(`deezer-link:${url.hostname}${url.pathname}`, 86_400, async () => {
        const res = await fetch(`https://${url.hostname}${url.pathname}`, { redirect: "follow", headers: { "user-agent": BROWSER_UA }, signal: AbortSignal.timeout(8000) });
        return res.url.match(/\/track\/(\d+)/)?.[1] ?? null;
      })) ?? undefined;
  }
  if (!id) throw badRequest("Not a Deezer track link");
  return cached<MediaData | null>(`deezer:${id}`, 3600, async () => {
    const t = await fetchJson<{ title?: string; link?: string; artist?: { name: string }; album?: { cover_xl?: string }; error?: unknown }>(`https://api.deezer.com/track/${id}`);
    if (!t.title || t.error) return null;
    return { provider: "deezer", title: t.title, author: t.artist?.name ?? null, thumbnailUrl: t.album?.cover_xl ?? null, live: null, url: t.link ?? `https://www.deezer.com/track/${id}` };
  });
}

/** Apple's public iTunes lookup (no key), artwork asked in 600 px. */
function appleTrack(id: string) {
  return cached<MediaData | null>(`apple:${id}`, 3600, async () => {
    const r = await fetchJson<{ results: { kind?: string; trackName?: string; artistName?: string; artworkUrl100?: string; trackViewUrl?: string }[] }>(`https://itunes.apple.com/lookup?id=${id}`);
    const t = r.results.find((x) => x.trackName);
    if (!t?.trackName) return null;
    return {
      provider: "apple",
      title: t.trackName,
      author: t.artistName ?? null,
      thumbnailUrl: t.artworkUrl100?.replace(/\/\d+x\d+bb\./, "/600x600bb.") ?? null,
      live: null,
      url: t.trackViewUrl?.replace(/[?&]uo=\d+/, "") ?? `https://music.apple.com/song/${id}`,
    };
  });
}

/** TIDAL has no keyless API: the public track page names it in its meta tags ("Artist - Title"). */
function tidalTrack(id: string) {
  return cached<MediaData | null>(`tidal:${id}`, 3600, async () => {
    // An unknown track is a 404 page: cache it as not found, not as a failure.
    const html = await page(`https://tidal.com/browse/track/${id}`).catch((e: Error) => (e.message.endsWith("404") ? "" : Promise.reject(e)));
    const meta = (p: string) => html.match(new RegExp(`<meta property="${p}" content="([^"]*)"`))?.[1];
    const og = decodeXml(meta("og:title") ?? "");
    if (!og || og.startsWith("Not Found")) return null;
    const cut = og.indexOf(" - ");
    return {
      provider: "tidal",
      title: cut > 0 ? og.slice(cut + 3) : og,
      author: cut > 0 ? og.slice(0, cut) : null,
      thumbnailUrl: meta("og:image") ?? null,
      live: null,
      url: `https://tidal.com/browse/track/${id}`,
    };
  });
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

/** "Kanye West" from the track page (music:musician_description, or the first part of og:description). */
async function spotifyArtist(href: string): Promise<string | null> {
  try {
    const res = await fetch(href, { headers: { "user-agent": "Mozilla/5.0 (compatible; FL3X/1.0)" }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const page = await res.text();
    const musician = page.match(/name="music:musician_description" content="([^"]+)"/)?.[1];
    const desc = page.match(/property="og:description" content="([^"]+)"/)?.[1];
    const raw = musician ?? desc?.split(" · ")[0];
    return raw ? raw.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"') : null;
  } catch {
    return null;
  }
}

type DeezerTrack = { title: string; preview: string; artist: { name: string } };

/**
 * A playable 30 s preview for a track, from Deezer's public search (Spotify no
 * longer gives previews to new apps). Deezer's links expire after ~15 min,
 * hence the short cache. null when no confident match.
 */
export function getPreview(title: string, artist: string) {
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return cached<{ url: string | null }>(`deezer:${norm(artist)}|${norm(title)}`, 600, async () => {
    const res = await fetchJson<{ data: DeezerTrack[] }>(`https://api.deezer.com/search?q=${encodeURIComponent(`${artist} ${title}`)}&limit=10`);
    const a = norm(artist.split(",")[0]!);
    const t = norm(title);
    const hit = res.data.find((d) => d.preview && norm(d.artist.name).includes(a) && norm(d.title).startsWith(t));
    return { url: hit?.preview ?? null };
  });
}
