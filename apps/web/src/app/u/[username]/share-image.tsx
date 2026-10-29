import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { FullPublicProfile } from "@fl3x/shared";
import { site } from "@/config/site";

/**
 * The image X, Discord, Telegram… show when a profile link is shared
 * (1200×630): avatar, name, checkmark, badges, bio and the profile's own
 * background. Shared by opengraph-image.tsx and twitter-image.tsx.
 */

export const shareImageSize = { width: 1200, height: 630 };
export const shareImageType = "image/png";

const PINK = "#FF97CB";
const GLOW = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><radialGradient id="g" cx="0.17" cy="0.42" r="0.55"><stop offset="0" stop-color="${PINK}" stop-opacity="0.32"/><stop offset="1" stop-color="${PINK}" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>`,
).toString("base64")}`;

/** A file from /public: read from disk, or fetched from the site if the deploy doesn't ship it next to the function. */
async function publicAsset(rel: string): Promise<Buffer | null> {
  try {
    return await readFile(join(process.cwd(), "public", rel));
  } catch {
    const res = await fetch(`${site.url}${rel}`).catch(() => null);
    return res?.ok ? Buffer.from(await res.arrayBuffer()) : null;
  }
}

const svgUri = (buf: Buffer | null) => (buf ? `data:image/svg+xml;base64,${buf.toString("base64")}` : null);

/**
 * Any image URL (uploads are WebP, which the renderer can't read) → a PNG or
 * JPEG data URI, resized for the card. null if it can't be loaded.
 */
async function rasterUri(url: string | null | undefined, width: number, height: number): Promise<string | null> {
  if (!url) return null;
  try {
    const buf = url.startsWith("/") ? await publicAsset(url) : await fetch(url, { signal: AbortSignal.timeout(5000) }).then((r) => (r.ok ? r.arrayBuffer() : null)).then((b) => (b ? Buffer.from(b) : null));
    if (!buf) return null;
    const sharp = (await import("sharp")).default;
    const out = await sharp(buf).resize(width, height, { fit: "cover" }).jpeg({ quality: 78 }).toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function fetchShareProfile(username: string): Promise<FullPublicProfile | null> {
  const res = await fetch(`${site.apiUrl}/profiles/${encodeURIComponent(username)}`, {
    next: { revalidate: 3600 },
    headers: process.env.INTERNAL_API_KEY ? { "x-internal-key": process.env.INTERNAL_API_KEY } : undefined,
  }).catch(() => null);
  return res?.ok ? ((await res.json()) as FullPublicProfile) : null;
}

export async function renderShareImage(username: string) {
  const [profile, moga, outfit, logo, verified, bag] = await Promise.all([
    fetchShareProfile(username),
    publicAsset("/fonts/primary/moga.otf"),
    publicAsset("/fonts/secondary/Outfit-Regular.ttf"),
    publicAsset("/images/fl3x-logo.svg"),
    publicAsset("/images/verified.svg"),
    publicAsset("/images/fl3x-icon.svg"),
  ]);
  const fonts = [
    ...(moga ? [{ name: "Moga", data: moga, weight: 400 as const, style: "normal" as const }] : []),
    ...(outfit ? [{ name: "Outfit", data: outfit, weight: 400 as const, style: "normal" as const }] : []),
  ];
  const logoUri = svgUri(logo);
  const bagUri = svgUri(bag);

  // Unknown profile: the site's own card.
  if (!profile) return siteCard(logoUri, fonts);

  const premium = profile.tier === "premium";
  const name = (profile.displayName || profile.username).toUpperCase();
  const bio = profile.bio && profile.bio.length > 110 ? `${profile.bio.slice(0, 107).trimEnd()}…` : profile.bio;
  const bgUrl = profile.theme.background === "image" ? profile.theme.backgroundUrl : null;
  const [avatar, background, badges] = await Promise.all([
    rasterUri(profile.avatarUrl, 440, 440),
    rasterUri(bgUrl, 1200, 630),
    Promise.all(profile.badges.slice(0, 7).map(async (id) => svgUri(await publicAsset(`/images/badges/${id}.svg`)))),
  ]);
  const verifiedUri = premium ? svgUri(verified) : null;
  // Long names shrink so they stay on one line.
  const nameSize = name.length > 14 ? 72 : name.length > 10 ? 88 : 104;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0b0b0b", color: "#fff", fontFamily: "Outfit" }}>
        {background ? (
          <img src={background} width={1200} height={630} alt="" style={{ position: "absolute", inset: 0, objectFit: "cover" }} />
        ) : (
          // Pink glow behind the avatar, as an SVG (the renderer's CSS gradients are limited).
          <img src={GLOW} width={1200} height={630} alt="" style={{ position: "absolute", inset: 0 }} />
        )}
        {/* Darken the background so text always reads. */}
        <div style={{ position: "absolute", inset: 0, display: "flex", background: background ? "linear-gradient(90deg, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.78) 55%, rgba(5,5,5,0.55) 100%)" : "transparent" }} />

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 56, padding: "0 80px", width: "100%", height: "100%", paddingBottom: 40 }}>
          <div style={{ display: "flex", width: 240, height: 240, borderRadius: 999, overflow: "hidden", background: "#1c1c1c", border: "6px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
            {avatar ? (
              <img src={avatar} width={240} height={240} alt="" style={{ objectFit: "cover" }} />
            ) : (
              // No picture yet: the FL3X bag.
              bagUri && (
                <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#141414" }}>
                  <img src={bagUri} width={110} height={117} alt="" />
                </div>
              )
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22, minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ fontFamily: "Moga", fontSize: nameSize, lineHeight: 1, maxWidth: 640, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{name}</div>
              {/* The SVG carries padding for its glow: sized up, pulled in. */}
              {verifiedUri && <img src={verifiedUri} width={84} height={84} alt="" style={{ marginLeft: -6 }} />}
            </div>
            {badges.some(Boolean) && (
              <div style={{ display: "flex", alignSelf: "flex-start", gap: 14, padding: "12px 20px", borderRadius: 999, background: "rgba(255,255,255,0.10)" }}>
                {badges.map((b, i) => (b ? <img key={i} src={b} width={36} height={36} alt="" /> : null))}
              </div>
            )}
            {bio && <div style={{ fontSize: 30, lineHeight: 1.3, color: "rgba(255,255,255,0.72)", textTransform: "uppercase", maxWidth: 700 }}>{bio}</div>}
          </div>
        </div>

        <div style={{ position: "absolute", left: 80, right: 80, bottom: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {logoUri && <img src={logoUri} width={150} height={52} alt="" />}
          <div style={{ display: "flex", padding: "12px 22px", borderRadius: 16, background: "rgba(255,255,255,0.10)", fontSize: 28 }}>
            <span style={{ color: "rgba(255,255,255,0.6)" }}>fl3x.lol/</span>
            <span style={{ color: PINK }}>@{profile.username}</span>
          </div>
        </div>
      </div>
    ),
    { ...shareImageSize, fonts },
  );
}

type Fonts = ConstructorParameters<typeof ImageResponse>[1] extends infer O ? (O extends { fonts?: infer F } ? F : never) : never;

function siteCard(logoUri: string | null, fonts: Fonts) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26, background: "radial-gradient(80% 90% at 50% 0%, #3d1a2d 0%, #0b0709 60%, #000 100%)", color: "#fff", fontFamily: "Moga" }}>
        {logoUri && <img src={logoUri} width={440} height={153} alt="" />}
        <div style={{ fontSize: 60, textTransform: "uppercase" }}>Your on-chain identity</div>
        <div style={{ fontFamily: "Outfit", fontSize: 30, color: "rgba(255,255,255,0.7)" }}>Live widgets · Verified wallets · Free to start</div>
      </div>
    ),
    { ...shareImageSize, fonts },
  );
}

/** The image shown when fl3x.lol itself (or any page without its own) is shared. */
export async function renderSiteImage() {
  const [moga, outfit, logo] = await Promise.all([
    publicAsset("/fonts/primary/moga.otf"),
    publicAsset("/fonts/secondary/Outfit-Regular.ttf"),
    publicAsset("/images/fl3x-logo.svg"),
  ]);
  return siteCard(svgUri(logo), [
    ...(moga ? [{ name: "Moga", data: moga, weight: 400 as const, style: "normal" as const }] : []),
    ...(outfit ? [{ name: "Outfit", data: outfit, weight: 400 as const, style: "normal" as const }] : []),
  ]);
}
