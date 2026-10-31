"use client";

import type { CSSProperties, ReactNode } from "react";
import { BADGES, REFERRAL_REWARDS, TIER_LIMITS, type Widget, type WidgetSettings, type WidgetSize, type WidgetType } from "@fl3x/shared";
import { BadgeIcon } from "@/components/profile/Badges";
import { ProfileView } from "@/components/profile/ProfileView";
import { Brand, Verified } from "@/components/ui";
import { WidgetView } from "@/components/widgets";
import { DEMO_LAYOUTS, DEMO_WIDGETS, demoProfile, demoWidget, resolveDemo } from "@/lib/demo";
import type { MediaData } from "@/lib/types";
import { DemoDataProvider } from "@/lib/use-data";

// Images for the X account (tweets, article cover, banner, avatars). Rendered
// by /x-kit/[slug] in dev and captured to PNG by scripts/x-kit.sh. Every
// visual carries the logo bottom-left and the domain bottom-right.
// The profile shown is FL3X's own; tokens, channels and the track are real
// (lib/demo.ts). No invented people, no flat glows behind the content.

const PINK = "#FF97CB";
const DOMAIN = "fl3x.lol";
const FL3X_AVATAR = "/brand/fl3x-app-icon-pink.svg";
/** The demo track (real song, real cover), as the music widget shows it. */
const TRACK = resolveDemo("spotify-now", {}) as MediaData;

export interface Visual {
  width: number;
  height: number;
  render: () => ReactNode;
}

/* ------------------------------------------------------------ building blocks */

function Footer({ size = 1 }: { size?: number }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between" style={{ padding: `${36 * size}px ${48 * size}px` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/fl3x-logo.svg" alt="FL3X" style={{ height: 34 * size, width: "auto" }} />
      <span className="rounded-xl bg-[#161616] leading-none text-white" style={{ fontSize: 24 * size, padding: `${10 * size}px ${16 * size}px` }}>
        {DOMAIN}
      </span>
    </div>
  );
}

/** Black canvas, optional FL3X art behind (darkened), footer. No glow: flat black reads less generated. */
function Frame({ children, art, footer = true, bg = "#000" }: { children: ReactNode; art?: string; footer?: boolean; bg?: string }) {
  return (
    <DemoDataProvider resolve={resolveDemo}>
      {/* Moga's ligatures (OU, CH…) read as odd glyphs at poster size: off. */}
      <div className="relative h-full w-full overflow-hidden font-secondary text-white" style={{ background: bg, fontVariantLigatures: "none", fontFeatureSettings: '"liga" 0, "dlig" 0, "clig" 0' }}>
        {art && <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: `url(${art})` }} />}
        <div className="relative z-10 h-full w-full">{children}</div>
        {footer && <Footer />}
      </div>
    </DemoDataProvider>
  );
}

function Big({ children, size = 120, className = "", style }: { children: string; size?: number; className?: string; style?: CSSProperties }) {
  return (
    <h1 className={`m-0 font-primary uppercase ${className}`} style={{ fontSize: size, lineHeight: 0.86, ...style }}>
      <Brand>{children}</Brand>
    </h1>
  );
}

function Line({ children, size = 28, className = "" }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <p className={`m-0 text-white/70 ${className}`} style={{ fontSize: size, lineHeight: 1.3 }}>
      {children}
    </p>
  );
}

function demo(type: WidgetType, size: WidgetSize, nth = 0, settings?: WidgetSettings): Widget {
  const d = DEMO_WIDGETS.filter((x) => x.type === type)[nth] ?? DEMO_WIDGETS.find((x) => x.type === type)!;
  return demoWidget(type, size, { ...d.settings, ...settings }, `xk-${type}-${size}-${nth}`);
}

/** A widget at its real profile footprint (large 172×204, long 356×96), scaled. */
function W({ type, size, scale = 1, nth = 0, settings, style, className = "" }: { type: WidgetType; size: WidgetSize; scale?: number; nth?: number; settings?: WidgetSettings; style?: CSSProperties; className?: string }) {
  const [width, height] = size === "large" ? [172, 204] : [356, 96];
  return (
    <div className={`shrink-0 ${className}`} style={{ zoom: scale, width, height, ...style }}>
      <WidgetView w={demo(type, size, nth, settings)} interactive={false} />
    </div>
  );
}

/** The demo profile card, scaled. */
function Card({ widgets, scale = 1, width }: { widgets: Widget[]; scale?: number; width?: number }) {
  return (
    <div style={{ zoom: scale, width }}>
      <ProfileView profile={demoProfile(widgets, null)} tier="premium" views={12_480} />
    </div>
  );
}

const layout = (id: string) => DEMO_LAYOUTS.find((l) => l.id === id)!.widgets;

function Avatar({ src, size, ring }: { src: string | null; size: number; ring?: string }) {
  return (
    <span className="block shrink-0 overflow-hidden rounded-full bg-white/10" style={{ width: size, height: size, boxShadow: ring ? `0 0 0 3px ${ring}` : undefined }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" className="size-full object-cover" />}
    </span>
  );
}

const bag = (filter?: string, size = 440) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={filter ? "/brand/fl3x-icon-white.svg" : "/brand/fl3x-icon.svg"} alt="" style={{ width: size, height: size * (32 / 30), filter }} />
);

/**
 * Falling pixel money bags in three depths: far ones small, blurred and dim,
 * near ones big, sharp and cut by the edge. Fixed positions so renders match.
 */
const RAIN: [x: number, y: number, size: number, rot: number, depth: 0 | 1 | 2][] = [
  [40, -30, 70, -18, 0], [170, 60, 120, 12, 1], [330, -50, 90, 25, 0], [430, 150, 60, -10, 0],
  [560, 20, 150, -22, 1], [70, 300, 90, 30, 0], [250, 250, 60, -28, 0], [620, 300, 80, 16, 0],
  [720, -60, 70, 8, 0], [880, 360, 110, -14, 1], [1010, -40, 90, 20, 0], [1180, 330, 70, -30, 0],
  [1300, -70, 210, 18, 2], [1380, 250, 120, -12, 1], [470, 380, 230, -20, 2], [-60, 120, 200, 22, 2],
  [930, 160, 50, 34, 0], [1240, 160, 50, -8, 0], [780, 230, 45, 22, 0],
];
const DEPTH = [
  { opacity: 0.22, blur: 3 },
  { opacity: 0.4, blur: 1 },
  { opacity: 0.9, blur: 0 },
];

function BagRain({ dim = false, tone = "pink" }: { dim?: boolean; tone?: "pink" | "black" }) {
  return (
    <div className="absolute inset-0">
      {RAIN.map(([x, y, size, rot, depth], i) => {
        const d = DEPTH[depth]!;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src="/brand/fl3x-icon.svg"
            alt=""
            className="absolute"
            style={{
              left: x,
              top: y,
              width: size,
              height: size * (32 / 30),
              transform: `rotate(${rot}deg)`,
              opacity: d.opacity * (dim ? 0.55 : 1) * (tone === "black" ? 0.22 : 1),
              filter: `${tone === "black" ? "brightness(0)" : ""} blur(${d.blur}px)`.trim(),
            }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ visuals */

export const VISUALS: Record<string, Visual> = {
  avatar: {
    width: 800,
    height: 800,
    render: () => (
      <div className="flex h-full w-full items-center justify-center bg-black">
        {bag(undefined, 420)}
      </div>
    ),
  },

  "avatar-pink": {
    width: 800,
    height: 800,
    render: () => (
      <div className="flex h-full w-full items-center justify-center" style={{ background: PINK }}>
        {bag("brightness(0)", 420)}
      </div>
    ),
  },

  // X banners. Bottom-left (profile picture) stays empty; the lockup sits right
  // of center, inside the band phones keep when they crop top and bottom.
  banner: {
    width: 1500,
    height: 500,
    render: () => (
      <div className="relative h-full w-full overflow-hidden bg-black font-secondary text-white">
        <BagRain />
        <div className="absolute top-[118px] left-[790px] flex flex-col items-start gap-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/fl3x-logo.svg" alt="FL3X" style={{ height: 112, width: "auto" }} />
          <p className="m-0 font-primary text-[46px] leading-none uppercase">
            Your onchain profile, elevated.
          </p>
          <div className="flex items-center gap-3 text-[22px]">
            <span className="rounded-xl bg-white px-4 py-2 leading-none text-black">fl3x.lol/@you</span>
            <span className="rounded-xl border border-white/25 px-4 py-2 leading-none text-white/75">Invite-only</span>
          </div>
        </div>
      </div>
    ),
  },

  // Typographic: the profile URL is the whole banner.
  "banner-url": {
    width: 1500,
    height: 500,
    render: () => (
      <div className="relative h-full w-full overflow-hidden bg-black font-secondary text-white">
        <BagRain dim />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 pl-[220px]">
          <p className="m-0 font-primary leading-[0.85] uppercase" style={{ fontSize: 196, fontVariantLigatures: "none" }}>
            <span className="text-white/90">FL3X.LOL/</span>
            <span className="text-brand">@YOU</span>
          </p>
          <p className="m-0 text-[28px] text-white/60">Your onchain profile, elevated. Now you can FL3X.</p>
        </div>
      </div>
    ),
  },

  // Pink: black bags on the brand pink, like the pink avatar.
  "banner-pink": {
    width: 1500,
    height: 500,
    render: () => (
      <div className="relative h-full w-full overflow-hidden font-secondary text-black" style={{ background: PINK }}>
        <BagRain tone="black" />
        <div className="absolute top-[130px] left-[800px] flex flex-col items-start gap-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/fl3x-logo-mono-black.svg" alt="FL3X" style={{ height: 112, width: "auto" }} />
          <p className="m-0 font-primary text-[46px] leading-none uppercase">Your onchain profile, elevated.</p>
          <span className="rounded-xl bg-black px-4 py-2 text-[22px] leading-none text-white">fl3x.lol/@you</span>
        </div>
      </div>
    ),
  },

  // Pinned tweet: the card itself, full bleed, title over the top-left.
  launch: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame art="/images/backgrounds/hero-bg.png">
        <div className="absolute top-[170px] left-[560px]" style={{ transform: "rotate(-4deg)" }}>
          <Card widgets={layout("classic")} scale={1.02} width={780} />
        </div>
        {/* Fade the card out under the title. */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(100deg, #000 38%, rgba(0,0,0,0.4) 52%, transparent 62%)" }} />
        <div className="absolute top-[86px] left-[64px] flex w-[480px] flex-col gap-6">
          <Big size={120}>FL[3]X ON ALL SCREENS</Big>
          <Line size={27}>Live widgets, wallets, badges.<br />One link: fl3x.lol/@you</Line>
        </div>
      </Frame>
    ),
  },

  "article-cover": {
    width: 1500,
    height: 600,
    render: () => (
      <Frame art="/images/backgrounds/footer-bg.png">
        <div className="absolute top-[110px] left-[72px] flex w-[640px] flex-col gap-6">
          <Big size={124}>Y[o]UR CRYPT[o] PROFILE, LIVE</Big>
        </div>
        <div className="absolute top-[50px] right-[70px] grid grid-cols-2 gap-4" style={{ transform: "rotate(-5deg)" }}>
          <W type="pnl" size="large" scale={1.15} />
          <W type="music" size="large" scale={1.15} />
          <W type="community" size="long" nth={1} scale={1.15} style={{ gridColumn: "span 2" }} />
        </div>
      </Frame>
    ),
  },

  // A wall of widgets, tilted, with the statement on a dark band.
  widgets: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame>
        <div className="absolute -top-[120px] -left-[160px] flex flex-col gap-4" style={{ transform: "rotate(-9deg)" }}>
          {[
            [["pnl", "large"], ["community", "long"], ["music", "large"], ["video", "long", 1], ["token", "large"]],
            [["portfolio", "long"], ["clock", "large"], ["video", "long"], ["countdown", "large"], ["community", "long", 1]],
            [["holdings", "large"], ["link", "long", 1], ["music", "long"], ["pnl", "large"], ["image", "large"]],
          ].map((row, r) => (
            <div key={r} className="flex items-start gap-4" style={{ marginLeft: r * 90 }}>
              {row.map(([type, size, nth], i) => (
                <W key={i} type={type as WidgetType} size={size as WidgetSize} nth={(nth as number) ?? 0} scale={1.05} />
              ))}
            </div>
          ))}
        </div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.88) 62%, #000 82%)" }} />
        <div className="absolute inset-x-0 bottom-[118px] flex flex-col items-center gap-4">
          <Big size={104} className="text-center">
            Y[o]UR B[i]O, BUT IT M[o]VES
          </Big>
          <Line size={26} className="text-center">
            P&amp;L, music, community, streams. Every widget updates on its own.
          </Line>
        </div>
      </Frame>
    ),
  },

  // The real signature request, next to the line.
  wallets: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame>
        <div className="flex h-full items-center gap-14 pr-16 pb-20 pl-16">
          <div className="flex w-[500px] flex-col gap-6">
            <Big size={100}>ONE SIGN[a]TURE. NO TR[a]NSACTION.</Big>
            <Line size={26}>Solana and EVM wallets, as many as you want. Your addresses never reach your public page.</Line>
          </div>
          <div className="flex w-[520px] flex-col gap-5 rounded-[32px] bg-[#141414] p-8">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/fl3x-app-icon.svg" alt="" className="size-12 rounded-2xl" />
              <div>
                <p className="text-[22px] leading-tight">Signature request</p>
                <p className="text-[17px] text-white/45">fl3x.lol</p>
              </div>
            </div>
            <div className="rounded-2xl bg-black/50 p-5 font-mono text-[16px] leading-relaxed whitespace-pre-line text-white/75">
              {"FL3X wants to check that you own this wallet.\n\nWallet: 7xKX…9fGh\n\nSigning is free. It does not send a transaction and gives FL3X no access to your funds."}
            </div>
            <div className="flex gap-3">
              <span className="flex-1 rounded-2xl bg-white/[0.06] py-4 text-center text-[20px] text-white/60">Cancel</span>
              <span className="flex-1 rounded-2xl bg-brand py-4 text-center text-[20px] text-black">Sign</span>
            </div>
          </div>
        </div>
      </Frame>
    ),
  },

  // The badges, big, in their colors.
  badges: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame>
        <div className="flex h-full flex-col items-center pt-[64px]">
          <Big size={104}>EARN Y[o]UR BADGES</Big>
          <Line size={26} className="mt-4">
            They sit right under your name. Hover one to see how it was earned.
          </Line>
          <div className="mt-12 flex w-[1040px] flex-wrap justify-center gap-x-9 gap-y-7">
            {BADGES.slice(0, 13).map((b) => (
              <div key={b.id} className="flex w-[110px] flex-col items-center gap-3">
                <span className="flex size-[84px] items-center justify-center rounded-[26px] bg-[#141414]">
                  <BadgeIcon id={b.id} size={44} />
                </span>
                <span className="text-center font-primary text-[19px] leading-none uppercase" style={{ color: b.color }}>
                  {b.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Frame>
    ),
  },

  // Centered: the name and its checkmark, huge.
  verified: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame>
        <div className="flex h-full flex-col items-center justify-center gap-8 pb-24">
          <div className="flex items-center gap-7">
            <Avatar src={FL3X_AVATAR} size={150} />
            <span className="font-primary leading-none uppercase" style={{ fontSize: 170 }}>
              <Brand>FL[3]X</Brand>
            </span>
            <Verified size={120} />
          </div>
          <Line size={30} className="text-center">
            The checkmark is for Premium holders.
            <br />
            It follows your wallet, not a subscription.
          </Line>
        </div>
      </Frame>
    ),
  },

  referral: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame>
        <div className="flex h-full">
          <div className="flex w-[54%] flex-col justify-center gap-7 pb-16 pl-14">
            <Big size={104}>Y[o]UR HANDLE IS THE INV[i]TE</Big>
            <Line>No code to remember. Share your link, climb the leaderboard.</Line>
            <div className="w-fit rounded-2xl bg-[#141414] px-6 py-4 text-[26px]">
              fl3x.lol/invite/<span className="text-brand">you</span>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center pb-16">
            <div className="flex w-[440px] flex-col gap-3">
              <p className="mb-1 text-[20px] text-white/55">Bring friends, earn badges</p>
              {REFERRAL_REWARDS.map(({ badge, count }) => (
                <div key={badge.id} className="flex items-center gap-5 rounded-2xl bg-[#141414] px-5 py-4">
                  <BadgeIcon id={badge.id} size={40} />
                  <span className="flex-1 font-primary text-[28px] leading-none uppercase" style={{ color: badge.color }}>
                    {badge.name}
                  </span>
                  <span className="text-[20px] text-white/60">{count} friends</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Frame>
    ),
  },

  "invite-only": {
    width: 1200,
    height: 675,
    render: () => (
      <Frame art="/images/backgrounds/sign-bg.png">
        <div className="flex h-full flex-col items-center justify-center gap-8 pb-20">
          <Big size={156}>INV[i]TE [o]NLY</Big>
          <Line size={28} className="text-center">
            Got an invite? Claim your name. No invite? Sign in with X, you&apos;re on the waitlist.
          </Line>
          <div className="flex items-center gap-3">
            <div className="flex h-[68px] w-[420px] items-center rounded-2xl bg-[#141414] px-5 text-[24px]">
              <span className="text-white/45">fl3x.lol/@</span>
              <span>yourname</span>
              <span className="ml-auto text-[17px] text-[#2FE3AC]">Available</span>
            </div>
            <span className="flex h-[68px] items-center rounded-2xl bg-brand px-7 text-[22px] text-black">Claim now</span>
          </div>
        </div>
      </Frame>
    ),
  },

  // Close-up on a grid mid-drag: one widget lifted, the slot it leaves.
  customize: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame bg="#0b0b0b">
        <div className="absolute top-[56px] left-[56px] z-10 flex w-[440px] flex-col gap-5">
          <Big size={104}>DRAG. DR[o]P. FL[e]X.</Big>
          <Line size={26}>Grab a widget, the others make room. Click your name to rename it.</Line>
        </div>
        <div className="absolute top-[60px] left-[540px] rounded-[40px] bg-[#1a1a1a] p-7">
          <div className="grid grid-cols-[172px_172px_356px] grid-rows-[96px_96px_96px_96px] gap-3">
            <div className="row-span-2">
              <W type="pnl" size="large" />
            </div>
            <div className="row-span-2 rounded-[28px] border-2 border-dashed border-white/25 bg-white/[0.03]" />
            <W type="community" size="long" />
            <W type="community" size="long" nth={1} />
            <div className="col-span-2 row-span-2 flex gap-3">
              <W type="clock" size="large" />
              <W type="token" size="large" />
            </div>
            <W type="followers" size="long" />
            <W type="video" size="long" />
          </div>
          {/* The widget being dragged, lifted above the grid. */}
          <div className="absolute top-[54px] left-[236px] rounded-[28px] bg-[#1c1c1c] shadow-[0_30px_70px_rgba(0,0,0,0.8)]" style={{ transform: "rotate(-7deg) scale(1.08)" }}>
            <W type="music" size="large" />
          </div>
        </div>
      </Frame>
    ),
  },

  // Full bleed on the cover, the music widget huge.
  spotify: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame>
        {TRACK.thumbnailUrl && <div className="absolute inset-0 scale-125 bg-cover bg-center opacity-60 blur-[70px]" style={{ backgroundImage: `url(${TRACK.thumbnailUrl})` }} />}
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative flex h-full items-center gap-14 pb-16 pl-16">
          <div style={{ transform: "rotate(-4deg)" }}>
            <W type="music" size="large" scale={1.85} />
          </div>
          <div className="flex w-[520px] flex-col gap-6">
            <Big size={104}>N[o]W PLAY[i]NG, [o]N Y[o]UR CARD</Big>
            <Line size={26}>Connect Spotify once. Not playing? It shows the last track.</Line>
          </div>
        </div>
      </Frame>
    ),
  },

  // Oversized views number, sources below.
  analytics: {
    width: 1200,
    height: 675,
    render: () => {
      const sources = [
        ["X", 38, "#FFB547"],
        ["Telegram", 24, "#4FC3F7"],
        ["Discord", 19, "#8B5CF6"],
        ["Direct", 12, "#2FE3AC"],
        ["Google", 7, "#FF97CB"],
      ] as const;
      return (
        <Frame>
          <div className="flex h-full gap-16 pt-[70px] pl-16">
            <div className="flex w-[520px] flex-col">
              <p className="text-[24px] text-white/55">Profile views · 30 days</p>
              <p className="font-primary leading-[0.9]" style={{ fontSize: 200 }}>
                12,480
              </p>
              <Big size={78} className="mt-6">
                SEE WH[o] CAME, AND FR[o]M WHERE
              </Big>
            </div>
            <div className="flex w-[480px] flex-col gap-3 pt-6">
              <p className="mb-2 text-[20px] text-white/55">Where visitors come from</p>
              {sources.map(([name, pct, color]) => (
                <div key={name} className="relative flex h-[62px] items-center overflow-hidden rounded-2xl bg-[#121212] px-5 text-[22px]">
                  <span className="absolute inset-y-0 left-0 opacity-35" style={{ width: `${Math.max(0.24, pct / 38) * 100}%`, background: color }} />
                  <span className="relative flex-1">{name}</span>
                  <span className="relative font-primary text-[28px]">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Frame>
      );
    },
  },

  // A plain list of links vs the FL3X card.
  "before-after": {
    width: 1200,
    height: 675,
    render: () => (
      <Frame>
        <div className="flex h-full items-center gap-10 px-14 pb-20">
          <div className="flex w-[330px] flex-col items-center gap-4">
            <p className="mb-2 font-primary text-[34px] leading-none text-white/40 uppercase">Before</p>
            <Avatar src={null} size={84} />
            <p className="text-[20px] text-white/60">@you</p>
            {["My X", "My Telegram", "My Discord", "My wallet", "My stream"].map((l) => (
              <span key={l} className="w-full rounded-full bg-[#1a1a1a] py-3.5 text-center text-[19px] text-white/55">
                {l}
              </span>
            ))}
          </div>
          <span className="font-primary text-[80px] text-brand">→</span>
          <div className="flex flex-1 flex-col items-center gap-4">
            <p className="font-primary text-[34px] leading-none text-brand uppercase">After</p>
            <Card widgets={layout("classic")} scale={0.82} width={760} />
          </div>
        </div>
      </Frame>
    ),
  },

  // The card in a phone, next to the line.
  phone: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame art="/images/backgrounds/hero-bg.png">
        <div className="flex h-full items-center gap-20 pl-20">
          <div className="flex w-[560px] flex-col gap-6 pb-16">
            <Big size={120}>ONE LINK. EVERY SCREEN.</Big>
            <Line size={27}>Built for the phone your visitors tap it on. fl3x.lol/@you</Line>
          </div>
          <div className="relative mt-[170px] h-[820px] w-[400px] shrink-0 rounded-[64px] bg-[#1c1c1c] p-3.5">
            <div className="flex h-full flex-col gap-5 overflow-hidden rounded-[52px] bg-[#0b0b0b] px-5 pt-14" >
              <div className="flex flex-col items-center gap-3 text-center">
                <Avatar src={FL3X_AVATAR} size={92} />
                <p className="flex items-center gap-2 font-primary text-[40px] leading-none uppercase">
                  <Brand>FL[3]X</Brand> <Verified size={26} />
                </p>
                <div className="flex gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5">
                  {["premium", "og", "early-adopter", "whale", "contributor"].map((b) => (
                    <BadgeIcon key={b} id={b} size={18} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3" style={{ zoom: 0.94 }}>
                <div className="flex gap-3">
                  <W type="pnl" size="large" />
                  <W type="music" size="large" />
                </div>
                <W type="community" size="long" nth={1} />
              </div>
            </div>
          </div>
        </div>
      </Frame>
    ),
  },
  // Giveaway: reply with a Solana address, winners get Premium.
  giveaway: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame art="/images/backgrounds/sign-bg.png">
        <div className="flex h-full flex-col items-center justify-center gap-8 pb-20">
          <Big size={136} className="text-center">
            DR[o]P Y[o]UR S[o]L ADDRESS
          </Big>
          <Line size={30} className="text-center">
            We pick wallets in the replies. Winners get FL3X Premium.
          </Line>
          <div className="flex items-center gap-4 rounded-2xl bg-[#141414] px-6 py-4">
            <Verified size={34} />
            <span className="font-mono text-[22px] text-white/70">7xKX…9fGh</span>
            <span className="text-[22px] text-white/40">→</span>
            <span className="font-primary text-[30px] leading-none text-brand uppercase">Premium</span>
          </div>
        </div>
      </Frame>
    ),
  },

  // Invite codes dropped in the post, half hidden.
  "invite-codes": {
    width: 1200,
    height: 675,
    render: () => (
      <Frame>
        <div className="flex h-full items-center gap-16 pr-16 pb-20 pl-16">
          <div className="flex w-[520px] flex-col gap-6">
            <Big size={116}>F[i]VE INV[i]TE C[o]DES</Big>
            <Line size={27}>First come, first served. Use one at fl3x.lol/join before someone else does.</Line>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            {["K7Q2", "M4XW", "P9ZD", "T3HN", "V8RC"].map((c, i) => (
              <div key={c} className="flex items-center justify-between rounded-2xl bg-[#141414] px-6 py-4">
                <span className="font-mono text-[30px] tracking-[0.12em]">
                  {c}-<span className="text-white/25">••••</span>
                </span>
                <span className={`text-[18px] ${i < 2 ? "text-white/35 line-through" : "text-[#2FE3AC]"}`}>{i < 2 ? "Claimed" : "Open"}</span>
              </div>
            ))}
          </div>
        </div>
      </Frame>
    ),
  },

  // fl3x.lol/@you, the handle as the hook.
  claim: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame>
        <div className="flex h-full flex-col items-center justify-center gap-10 pb-20">
          <p className="font-primary leading-none uppercase" style={{ fontSize: 150 }}>
            <span className="text-white/35">fl3x.lol/@</span>
            <span className="text-brand">you</span>
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-[68px] w-[460px] items-center rounded-2xl bg-[#141414] px-5 text-[24px]">
              <span className="text-white/45">fl3x.lol/@</span>
              <span>yourname</span>
              <span className="ml-auto text-[17px] text-[#2FE3AC]">Available</span>
            </div>
            <span className="flex h-[68px] items-center rounded-2xl bg-brand px-7 text-[22px] text-black">Claim</span>
          </div>
          <Line size={26}>Short names go first.</Line>
        </div>
      </Frame>
    ),
  },

  // The three tiers with their real limits.
  tiers: {
    width: 1200,
    height: 675,
    render: () => {
      const rows = [
        ["Free", TIER_LIMITS.none, "Hold nothing"],
        ["Starter", TIER_LIMITS.starter, "Hold $FL3X"],
        ["Premium", TIER_LIMITS.premium, "Hold more $FL3X"],
      ] as const;
      return (
        <Frame>
          <div className="flex h-full flex-col items-center pt-[60px]">
            <Big size={96}>H[o]LD. UNL[o]CK.</Big>
            <Line size={24} className="mt-3">
              Your tier follows your wallet. No subscription.
            </Line>
            <div className="mt-10 flex gap-5">
              {rows.map(([name, l, hold]) => (
                <div key={name} className={`flex w-[320px] flex-col gap-4 rounded-[28px] p-7 ${name === "Premium" ? "bg-brand text-black" : "bg-[#141414]"}`}>
                  <p className="flex items-center gap-3 font-primary text-[44px] leading-none uppercase">
                    {name} {name === "Premium" && <Verified size={30} />}
                  </p>
                  <p className={`text-[18px] ${name === "Premium" ? "text-black/60" : "text-white/45"}`}>{hold}</p>
                  <div className="flex flex-col gap-2 text-[21px]">
                    <span>{l.widgets} widgets</span>
                    <span>{l.links} links</span>
                    <span>{l.analyticsDays}-day analytics</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Frame>
      );
    },
  },
};
