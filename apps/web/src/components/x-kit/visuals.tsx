"use client";

import type { CSSProperties, ReactNode } from "react";
import { BADGES, type Widget, type WidgetSettings, type WidgetSize, type WidgetType } from "@fl3x/shared";
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
// Illustrations only: the generic demo persona and art (lib/demo.ts,
// scripts/demo-art.py). No real people, no real members, no real stats.

const PINK = "#FF97CB";
const DOMAIN = "fl3x.lol";
const MEDALS = ["#FFD66B", "#D9DEE8", "#E9A77A"];
const PEOPLE = [
  ["nova", "/images/demo/avatar-1.svg"],
  ["kai", "/images/demo/avatar-2.svg"],
  ["mira", "/images/demo/avatar-3.svg"],
  ["zed", "/images/demo/avatar-4.svg"],
  ["juno", "/images/demo/avatar-5.svg"],
] as const;
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

type Glow = "top-right" | "center" | "left" | "bottom" | "none";
const GLOWS: Record<Glow, string> = {
  "top-right": "radial-gradient(60% 70% at 85% 10%, rgba(255,151,203,0.18), transparent 70%)",
  center: "radial-gradient(50% 60% at 50% 45%, rgba(255,151,203,0.16), transparent 70%)",
  left: "radial-gradient(60% 80% at 10% 50%, rgba(255,151,203,0.14), transparent 70%)",
  bottom: "radial-gradient(70% 60% at 50% 110%, rgba(255,151,203,0.22), transparent 70%)",
  none: "none",
};

/** Black canvas, optional FL3X art behind (darkened), soft ambient light, footer. */
function Frame({ children, art, glow = "top-right", footer = true, bg = "#000" }: { children: ReactNode; art?: string; glow?: Glow; footer?: boolean; bg?: string }) {
  return (
    <DemoDataProvider resolve={resolveDemo}>
      {/* Moga's ligatures (OU, CH…) read as odd glyphs at poster size: off. */}
      <div className="relative h-full w-full overflow-hidden font-secondary text-white" style={{ background: bg, fontVariantLigatures: "none", fontFeatureSettings: '"liga" 0, "dlig" 0, "clig" 0' }}>
        {art && <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: `url(${art})` }} />}
        <div className="absolute inset-0" style={{ background: GLOWS[glow] }} />
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

/* ------------------------------------------------------------------ visuals */

export const VISUALS: Record<string, Visual> = {
  avatar: {
    width: 800,
    height: 800,
    render: () => (
      <div className="flex h-full w-full items-center justify-center" style={{ background: "radial-gradient(60% 60% at 50% 45%, #2a0f1e, #000 75%)" }}>
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

  // Bottom-left (profile picture) and bottom-right (buttons on mobile) stay empty.
  banner: {
    width: 1500,
    height: 500,
    render: () => (
      <Frame art="/images/backgrounds/sign-bg.png" glow="center" footer={false}>
        <div className="absolute top-[78px] left-[120px] flex flex-col gap-5">
          <Big size={112}>FL[3]X ON ALL</Big>
          <Big size={112}>SCREENS</Big>
          <Line size={26}>Your crypto profile, live. One link.</Line>
        </div>
        <div className="absolute top-[36px] right-[90px] flex gap-4" style={{ transform: "rotate(-4deg)" }}>
          <W type="pnl" size="large" scale={1.05} />
          <div className="flex flex-col gap-4 pt-8">
            <W type="music" size="long" scale={0.95} />
            <W type="community" size="long" nth={1} scale={0.95} />
            <W type="video" size="long" nth={1} scale={0.95} />
          </div>
        </div>
      </Frame>
    ),
  },

  // Pinned tweet: the card itself, full bleed, title over the top-left.
  launch: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame art="/images/backgrounds/hero-bg.png" glow="top-right">
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
      <Frame art="/images/backgrounds/footer-bg.png" glow="left">
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
      <Frame glow="none">
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

  // Oversized total, the wallets underneath.
  wallets: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame glow="bottom">
        <div className="flex h-full flex-col items-center pt-[70px]">
          <p className="text-[24px] text-white/55">One total. Every wallet you sign for.</p>
          <p className="mt-3 font-primary leading-none" style={{ fontSize: 190 }}>
            $134,548<span className="text-white/35">.73</span>
          </p>
          <div className="mt-8 flex items-center gap-3">
            {[
              ["Solana", "#14F195"],
              ["Ethereum", "#8EA2FF"],
              ["Base", "#3C7CFF"],
              ["Arbitrum", "#4FC3F7"],
              ["BNB", "#F3BA2F"],
              ["Polygon", "#A57BFF"],
            ].map(([name, color]) => (
              <span key={name} className="flex items-center gap-2 rounded-full bg-[#141414] px-4 py-2.5 text-[19px]">
                <span className="size-2.5 rounded-full" style={{ background: color }} />
                {name}
              </span>
            ))}
          </div>
          <div className="mt-10 flex items-center gap-4 rounded-[24px] bg-[#141414] py-4 pr-4 pl-6">
            <span className="font-mono text-[18px] text-white/75">Link this wallet to FL3X · free signature, no transaction</span>
            <span className="rounded-xl bg-brand px-6 py-3 text-[18px] text-black">Sign</span>
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
      <Frame glow="center">
        <div className="flex h-full flex-col items-center pt-[64px]">
          <Big size={104}>EARN Y[o]UR BADGES</Big>
          <Line size={26} className="mt-4">
            They sit right under your name. Hover one to see how it was earned.
          </Line>
          <div className="mt-12 flex w-[1040px] flex-wrap justify-center gap-x-9 gap-y-7">
            {BADGES.slice(0, 13).map((b) => (
              <div key={b.id} className="flex w-[110px] flex-col items-center gap-3">
                <span className="flex size-[84px] items-center justify-center rounded-[26px]" style={{ background: `${b.color}1f` }}>
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
      <Frame glow="center">
        <div className="flex h-full flex-col items-center justify-center gap-8 pb-24">
          <div className="flex items-center gap-7">
            <Avatar src={PEOPLE[0][1]} size={150} />
            <span className="font-primary leading-none uppercase" style={{ fontSize: 170 }}>
              Nova
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
      <Frame glow="top-right">
        <div className="flex h-full">
          <div className="flex w-[54%] flex-col justify-center gap-7 pb-16 pl-14">
            <Big size={104}>Y[o]UR HANDLE IS THE INV[i]TE</Big>
            <Line>No code to remember. Share your link, climb the leaderboard.</Line>
            <div className="w-fit rounded-2xl bg-[#141414] px-6 py-4 text-[26px]">
              fl3x.lol/invite/<span className="text-brand">you</span>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center pb-16">
            <div className="w-[440px] rounded-[28px] bg-[#0f0f0f] p-6 pb-4">
              <p className="text-[15px] text-white/45">Top recruiters</p>
              <p className="mb-4 font-primary text-[34px] leading-none uppercase">Leaderboard</p>
              {[...PEOPLE.slice(0, 4).map(([n, img], i) => [n, img, [41, 27, 18, 9][i]] as const), ["you", null, 0] as const].map(([name, img, count], i) => (
                <div key={name} className={`flex items-center gap-4 rounded-2xl px-3 py-2.5 ${name === "you" ? "bg-brand/15" : ""}`}>
                  <span className="w-7 text-center font-primary text-[26px] leading-none" style={{ color: MEDALS[i] ?? "rgba(255,255,255,0.4)" }}>
                    {name === "you" ? "?" : i + 1}
                  </span>
                  <Avatar src={img} size={44} ring={name === "you" ? undefined : MEDALS[i]} />
                  <span className="flex-1 font-primary text-[24px] leading-none uppercase">{name === "you" ? "You, next" : name}</span>
                  <span className="font-primary text-[24px] leading-none text-white/80">{name === "you" ? "" : count}</span>
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
      <Frame art="/images/backgrounds/sign-bg.png" glow="center">
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
      <Frame glow="none" bg="#0b0b0b">
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
            <W type="music" size="long" />
            <W type="video" size="long" nth={1} />
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
      <Frame glow="none">
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
        <Frame glow="top-right">
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
      <Frame glow="none">
        <div className="flex h-full items-center gap-10 px-14 pb-20">
          <div className="flex w-[330px] flex-col items-center gap-4">
            <p className="mb-2 font-primary text-[34px] leading-none text-white/40 uppercase">Before</p>
            <Avatar src={PEOPLE[0][1]} size={84} />
            <p className="text-[20px] text-white/60">@nova</p>
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
      <Frame art="/images/backgrounds/hero-bg.png" glow="center">
        <div className="flex h-full items-center gap-20 pl-20">
          <div className="flex w-[560px] flex-col gap-6 pb-16">
            <Big size={120}>ONE LINK. EVERY SCREEN.</Big>
            <Line size={27}>Built for the phone your visitors tap it on. fl3x.lol/@you</Line>
          </div>
          <div className="relative mt-[170px] h-[820px] w-[400px] shrink-0 rounded-[64px] bg-[#1c1c1c] p-3.5">
            <div className="flex h-full flex-col gap-5 overflow-hidden rounded-[52px] bg-[#0b0b0b] px-5 pt-14" style={{ background: "radial-gradient(90% 50% at 50% 0%, #3a1830, #0b0b0b 70%)" }}>
              <div className="flex flex-col items-center gap-3 text-center">
                <Avatar src={PEOPLE[0][1]} size={92} />
                <p className="flex items-center gap-2 font-primary text-[40px] leading-none uppercase">
                  Nova <Verified size={26} />
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
};
