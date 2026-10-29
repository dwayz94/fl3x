import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { env } from "../env";
import { requireUser } from "../lib/auth";
import { badRequest, notFound } from "../lib/errors";
import { cached, fetchJson } from "../lib/cache";
import type { MediaData } from "../lib/providers/media";
import { decrypt, encrypt, readState, signState } from "../lib/secrets";

const SPOTIFY_SCOPES = "user-read-currently-playing user-read-recently-played";
const redirectUri = () => `${env.API_PUBLIC_URL}/connections/spotify/callback`;
const basic = () => `Basic ${Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`;
const web = () => env.WEB_ORIGIN.split(",")[0]!.trim();

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number };
type SpotifyTrack = { name: string; artists: { name: string }[]; album: { images: { url: string }[] }; external_urls: { spotify: string } };

async function spotifyToken(body: Record<string, string>) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { authorization: basic(), "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Spotify token ${res.status}`);
  return (await res.json()) as TokenResponse;
}

/** A valid access token for the member's Spotify, refreshed when needed. */
async function accessToken(userId: string): Promise<string | null> {
  const [c] = await db.select().from(schema.connections).where(and(eq(schema.connections.userId, userId), eq(schema.connections.provider, "spotify"))).limit(1);
  if (!c) return null;
  if (c.accessToken && c.expiresAt && c.expiresAt.getTime() > Date.now() + 30_000) return decrypt(c.accessToken);
  let t: TokenResponse;
  try {
    t = await spotifyToken({ grant_type: "refresh_token", refresh_token: decrypt(c.refreshToken) });
  } catch (err) {
    // 400 = the member revoked FL3X in Spotify: drop the connection instead of retrying on every view.
    if (String(err).includes("token 400")) {
      await db.delete(schema.connections).where(and(eq(schema.connections.userId, userId), eq(schema.connections.provider, "spotify")));
      return null;
    }
    throw err;
  }
  await db
    .update(schema.connections)
    .set({
      accessToken: encrypt(t.access_token),
      expiresAt: new Date(Date.now() + t.expires_in * 1000),
      ...(t.refresh_token ? { refreshToken: encrypt(t.refresh_token) } : {}),
    })
    .where(and(eq(schema.connections.userId, userId), eq(schema.connections.provider, "spotify")));
  return t.access_token;
}

const toMedia = (track: SpotifyTrack, nowPlaying: boolean): MediaData => ({
  provider: "spotify",
  title: track.name,
  author: track.artists.map((a) => a.name).join(", "),
  thumbnailUrl: track.album.images[0]?.url ?? null,
  live: null,
  nowPlaying,
  url: track.external_urls.spotify,
});

/** What the member is listening to right now, or the last track they played. */
function nowPlaying(userId: string) {
  return cached<MediaData | null>(`spotify-now:${userId}`, 20, async () => {
    const token = await accessToken(userId);
    if (!token) return null;
    const headers = { authorization: `Bearer ${token}` };
    const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", { headers, signal: AbortSignal.timeout(8000) });
    if (res.status === 200) {
      const now = (await res.json()) as { is_playing: boolean; item: SpotifyTrack | null };
      if (now.item && now.is_playing) return toMedia(now.item, true);
    }
    const recent = await fetchJson<{ items: { track: SpotifyTrack }[] }>("https://api.spotify.com/v1/me/player/recently-played?limit=1", { headers });
    return recent.items[0] ? toMedia(recent.items[0].track, false) : null;
  });
}

/**
 * Accounts a member connects to feed widgets automatically. Today: Spotify
 * for the music widget (now playing, or last played).
 */
export async function connectionRoutes(app: FastifyInstance) {
  const configured = () => Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET);

  app.get("/me/connections", async (req) => {
    const user = await requireUser(req);
    const rows = await db.select({ provider: schema.connections.provider, accountName: schema.connections.accountName }).from(schema.connections).where(eq(schema.connections.userId, user.id));
    return { available: { spotify: configured() }, connected: rows };
  });

  app.post("/me/connections/spotify", async (req) => {
    const user = await requireUser(req);
    if (!configured()) throw badRequest("Spotify isn't set up on this server yet", "not_configured");
    const q = new URLSearchParams({
      client_id: env.SPOTIFY_CLIENT_ID,
      response_type: "code",
      redirect_uri: redirectUri(),
      scope: SPOTIFY_SCOPES,
      state: signState({ u: user.id }),
    });
    return { url: `https://accounts.spotify.com/authorize?${q}` };
  });

  app.get("/connections/spotify/callback", async (req, reply) => {
    const q = z.object({ code: z.string().optional(), state: z.string(), error: z.string().optional() }).parse(req.query);
    const state = readState<{ u: string }>(q.state);
    const back = (status: string) => reply.redirect(`${web()}/dashboard/settings?spotify=${status}`);
    if (!state || q.error || !q.code) return back("cancelled");
    try {
      const t = await spotifyToken({ grant_type: "authorization_code", code: q.code, redirect_uri: redirectUri() });
      const me = await fetchJson<{ display_name: string | null; id: string }>("https://api.spotify.com/v1/me", { headers: { authorization: `Bearer ${t.access_token}` } });
      const values = {
        accountName: me.display_name ?? me.id,
        refreshToken: encrypt(t.refresh_token!),
        accessToken: encrypt(t.access_token),
        expiresAt: new Date(Date.now() + t.expires_in * 1000),
      };
      await db
        .insert(schema.connections)
        .values({ userId: state.u, provider: "spotify", ...values })
        .onConflictDoUpdate({ target: [schema.connections.userId, schema.connections.provider], set: values });
      return back("connected");
    } catch (err) {
      req.log.warn(err);
      return back("error");
    }
  });

  app.delete("/me/connections/spotify", async (req) => {
    const user = await requireUser(req);
    await db.delete(schema.connections).where(and(eq(schema.connections.userId, user.id), eq(schema.connections.provider, "spotify")));
    return { ok: true };
  });

  /** Editor preview of the music widget in "my Spotify" mode. */
  app.get("/me/spotify", async (req) => {
    const user = await requireUser(req);
    const data = await nowPlaying(user.id);
    if (!data) throw notFound("Connect Spotify in Settings");
    return data;
  });

  /** Public: now playing for a profile's music widget. */
  app.get<{ Params: { widgetId: string } }>("/data/spotify/:widgetId", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (req) => {
    if (!z.uuid().safeParse(req.params.widgetId).success) throw notFound();
    const [w] = await db
      .select({ userId: schema.widgets.userId, type: schema.widgets.type, settings: schema.widgets.settings })
      .from(schema.widgets)
      .where(eq(schema.widgets.id, req.params.widgetId))
      .limit(1);
    // Only widgets set to "My Spotify" expose what the member listens to (older ones with a link are link mode).
    const source = w?.settings.source ?? (w?.settings.url ? "link" : "spotify");
    if (!w || w.type !== "music" || source !== "spotify") throw notFound();
    const data = await nowPlaying(w.userId);
    if (!data) throw notFound("Nothing played yet");
    return data;
  });
}
