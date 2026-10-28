import { env } from "../../env";
import { cached, fetchJson } from "../cache";

export interface MediaData {
  provider: "youtube" | "spotify" | "twitch";
  title: string;
  author: string | null;
  thumbnailUrl: string | null;
  live: boolean | null;
  url: string;
}

interface OEmbed {
  title: string;
  author_name?: string;
  thumbnail_url?: string;
}

let twitchToken: { value: string; expiresAt: number } | null = null;

async function twitchAppToken() {
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
