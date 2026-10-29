"use client";

import type { CSSProperties, ReactNode } from "react";
import { BADGES, type WidgetSettings, type WidgetSize, type WidgetType } from "@fl3x/shared";
import { BadgeIcon } from "@/components/profile/Badges";
import { ProfileView } from "@/components/profile/ProfileView";
import { Brand, Verified } from "@/components/ui";
import { WidgetView } from "@/components/widgets";
import { DEMO_LAYOUTS, DEMO_WIDGETS, demoProfile, demoWidget, resolveDemo } from "@/lib/demo";
import { DemoDataProvider } from "@/lib/use-data";

// Images for the X account (tweets, article cover, banner, avatars). Rendered
// by /x-kit/[slug] in dev and captured to PNG by scripts/x-kit.sh. Every
// visual carries the logo bottom-left and the domain bottom-right.
// Illustrations only: demo personas and sample data, no real members or stats.

const PINK = "#FF97CB";
const DOMAIN = "fl3x.lol";

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
      <span className="rounded-xl bg-white/10 leading-none text-white backdrop-blur" style={{ fontSize: 24 * size, padding: `${10 * size}px ${16 * size}px` }}>
        {DOMAIN}
      </span>
    </div>
  );
}

/** Black canvas, optional FL3X art behind (darkened), pink glow, footer. */
function Frame({ children, art, glow = "top-right", footer = true }: { children: ReactNode; art?: string; glow?: "top-right" | "center" | "left" | "none"; footer?: boolean }) {
  const glows = {
    "top-right": "radial-gradient(60% 70% at 85% 10%, rgba(255,151,203,0.22), transparent 70%)",
    center: "radial-gradient(50% 60% at 50% 45%, rgba(255,151,203,0.22), transparent 70%)",
    left: "radial-gradient(60% 80% at 10% 50%, rgba(255,151,203,0.18), transparent 70%)",
    none: "none",
  };
  return (
    <DemoDataProvider resolve={resolveDemo}>
      {/* Moga's ligatures (OU, CH…) read as odd glyphs at poster size: off. */}
      <div className="relative h-full w-full overflow-hidden bg-black font-secondary text-white" style={{ fontVariantLigatures: "none", fontFeatureSettings: '"liga" 0, "dlig" 0, "clig" 0' }}>
        {art && <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${art})` }} />}
        <div className="absolute inset-0" style={{ background: glows[glow] }} />
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

/** A widget at its real profile footprint (large 172×204, long 356×96), scaled. */
function W({ type, size, scale = 1, nth = 0, settings, style, className = "" }: { type: WidgetType; size: WidgetSize; scale?: number; nth?: number; settings?: WidgetSettings; style?: CSSProperties; className?: string }) {
  const demo = DEMO_WIDGETS.filter((d) => d.type === type)[nth] ?? DEMO_WIDGETS.find((d) => d.type === type)!;
  const w = demoWidget(type, size, { ...demo.settings, ...settings }, `xk-${type}-${size}-${nth}`);
  const [width, height] = size === "large" ? [172, 204] : [356, 96];
  return (
    <div className={`shrink-0 ${className}`} style={{ zoom: scale, width, height, ...style }}>
      <WidgetView w={w} interactive={false} />
    </div>
  );
}

/** The demo profile card at a given width, scaled. */
function Card({ layout = "classic", scale = 1, width }: { layout?: string; scale?: number; width?: number }) {
  const widgets = DEMO_LAYOUTS.find((l) => l.id === layout)!.widgets;
  return (
    <div style={{ zoom: scale, width }}>
      <ProfileView profile={demoProfile(widgets, null)} tier="premium" views={456_432} />
    </div>
  );
}

function Chip({ children, active = false, size = 22 }: { children: ReactNode; active?: boolean; size?: number }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-2xl leading-none ${active ? "bg-brand text-black" : "border border-white/15 bg-white/[0.06] text-white"}`}
      style={{ fontSize: size, padding: `${size * 0.6}px ${size * 0.8}px` }}
    >
      {children}
    </span>
  );
}

/** Left column of text, right column of art. */
function Split({ left, right, art, glow = "top-right", leftWidth = "48%" }: { left: ReactNode; right: ReactNode; art?: string; glow?: "top-right" | "center" | "left" | "none"; leftWidth?: string }) {
  return (
    <Frame art={art} glow={glow}>
      <div className="flex h-full">
        <div className="flex flex-col justify-center gap-7 pb-16 pl-14" style={{ width: leftWidth }}>
          {left}
        </div>
        <div className="relative flex flex-1 items-center justify-center">{right}</div>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ visuals */

const bag = (filter?: string, size = 440) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={filter ? "/brand/fl3x-icon-white.svg" : "/brand/fl3x-icon.svg"} alt="" style={{ width: size, height: size * (32 / 30), filter, imageRendering: "pixelated" }} />
);

export const VISUALS: Record<string, Visual> = {
  avatar: {
    width: 800,
    height: 800,
    render: () => (
      <div className="flex h-full w-full items-center justify-center bg-black" style={{ background: "radial-gradient(60% 60% at 50% 45%, #2a0f1e, #000 75%)" }}>
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

  banner: {
    width: 1500,
    height: 500,
    // Bottom-left (profile picture) and bottom-right (buttons on mobile) stay empty.
    render: () => (
      <Frame art="/images/backgrounds/sign-bg.png" glow="center" footer={false}>
        <div className="absolute top-[70px] left-[120px] flex flex-col gap-5">
          <Big size={112}>FL[3]X ON ALL</Big>
          <Big size={112}>SCREENS</Big>
          <Line size={26}>Your crypto profile, live. One link.</Line>
        </div>
        <div className="absolute top-[40px] right-[90px] flex gap-4" style={{ transform: "rotate(-4deg)" }}>
          <div className="flex flex-col gap-4">
            <W type="pnl" size="large" scale={1.05} />
          </div>
          <div className="flex flex-col gap-4 pt-10">
            <W type="music" size="long" scale={0.95} />
            <W type="community" size="long" scale={0.95} />
            <W type="video" size="long" nth={1} scale={0.95} />
          </div>
        </div>
      </Frame>
    ),
  },

  launch: {
    width: 1200,
    height: 675,
    render: () => (
      <Split
        art="/images/backgrounds/hero-bg.png"
        left={
          <>
            <Big size={118}>FL[3]X ON ALL SCREENS</Big>
            <Line>Live widgets, verified wallets and your badges. One link: fl3x.lol/@you</Line>
          </>
        }
        right={
          <div className="absolute top-[70px] left-[10px]" style={{ transform: "rotate(-3deg)" }}>
            <Card layout="classic" scale={0.82} width={740} />
          </div>
        }
      />
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
        <div className="absolute top-[60px] right-[70px] grid grid-cols-2 gap-4" style={{ transform: "rotate(-5deg)" }}>
          <W type="pnl" size="large" scale={1.15} />
          <W type="token" size="large" scale={1.15} />
          <W type="video" size="long" nth={1} scale={1.15} style={{ gridColumn: "span 2" }} />
        </div>
      </Frame>
    ),
  },

  widgets: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame glow="center">
        <div className="flex h-full flex-col items-center pt-14">
          <Big size={92} className="text-center">
            W[i]DGETS THAT M[o]VE
          </Big>
          <Line size={26} className="mt-4 text-center">
            Your P&L, your token, your community, your live. Updated on their own.
          </Line>
          <div className="mt-10 flex items-start gap-4">
            <W type="pnl" size="large" scale={1.26} />
            <div className="flex flex-col gap-[15px]">
              <W type="community" size="long" scale={1.26} />
              <W type="video" size="long" nth={1} scale={1.26} />
            </div>
            <W type="clock" size="large" scale={1.26} />
          </div>
        </div>
      </Frame>
    ),
  },

  wallets: {
    width: 1200,
    height: 675,
    render: () => (
      <Split
        left={
          <>
            <Big size={110}>S[i]GN. D[o]N&apos;T C[o]NNECT.</Big>
            <Line>Link every wallet with one free signature. No transaction, no approval. Your widgets add them all up.</Line>
            <div className="flex flex-wrap gap-2">
              {["Solana", "Ethereum", "Base", "Arbitrum", "BNB", "Polygon"].map((c) => (
                <Chip key={c} size={18}>
                  {c}
                </Chip>
              ))}
            </div>
          </>
        }
        right={
          <div className="flex flex-col items-center gap-5 pb-16">
            <div className="w-[440px] rounded-[28px] border border-white/10 bg-[#141414] p-6">
              <p className="text-[15px] text-white/50">Signature request</p>
              <p className="mt-2 font-mono text-[15px] leading-relaxed text-white/85">
                Link this wallet to FL3X
                <br />
                Account: @solamies
                <br />
                Nonce: 7f3a…c19e
              </p>
              <div className="mt-5 flex gap-3">
                <span className="flex-1 rounded-xl bg-white/10 py-3 text-center text-[16px]">Cancel</span>
                <span className="flex-1 rounded-xl bg-brand py-3 text-center text-[16px] text-black">Sign</span>
              </div>
            </div>
            <W type="portfolio" size="long" scale={1.24} />
          </div>
        }
      />
    ),
  },

  badges: {
    width: 1200,
    height: 675,
    render: () => (
      <Frame glow="center">
        <div className="flex h-full flex-col items-center pt-14">
          <Big size={100}>EARN Y[o]UR BADGES</Big>
          <Line size={26} className="mt-4">
            Early, OG, Contributor, Builder… they show under your name.
          </Line>
          <div className="mt-10 grid w-[1040px] grid-cols-4 gap-3">
            {BADGES.slice(0, 12).map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111] px-4 py-3.5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-white/5" style={{ boxShadow: `0 0 26px ${b.color}44` }}>
                  <BadgeIcon id={b.id} size={26} />
                </span>
                <span className="font-primary text-[24px] leading-none uppercase" style={{ color: b.color }}>
                  {b.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Frame>
    ),
  },

  verified: {
    width: 1200,
    height: 675,
    render: () => (
      <Split
        glow="none"
        left={
          <>
            <Big size={116}>H[o]LD. GET THE CHECK.</Big>
            <Line>The FL3X checkmark is for Premium holders only. It follows your wallet, not a subscription.</Line>
          </>
        }
        right={
          <div className="flex flex-col items-center gap-14 pb-16">
            <div style={{ filter: "drop-shadow(0 0 60px rgba(0,246,255,0.35))" }}>
              <Verified size={220} />
            </div>
            <div className="flex items-center gap-4 rounded-full bg-white/[0.06] py-3 pr-7 pl-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/creators/solamies.jpg" alt="" className="size-14 rounded-full object-cover" />
              <span className="font-primary text-[40px] leading-none uppercase">Solamies</span>
              <Verified size={30} />
            </div>
          </div>
        }
      />
    ),
  },

  referral: {
    width: 1200,
    height: 675,
    render: () => (
      <Split
        left={
          <>
            <Big size={104}>Y[o]UR HANDLE IS THE INV[i]TE</Big>
            <Line>No code to remember. Share your link, climb the leaderboard.</Line>
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-[#111] px-5 py-4 text-[24px]">
              fl3x.lol/invite/<span className="text-brand">you</span>
            </div>
          </>
        }
        right={
          <div className="w-[440px] rounded-[28px] border border-white/10 bg-[#0d0d0d] p-6 pb-4">
            <p className="text-[15px] text-white/45">Top recruiters</p>
            <p className="mb-4 border-b border-white/10 pb-4 font-primary text-[34px] leading-none uppercase">Leaderboard</p>
            {[
              ["solamies", "/images/creators/solamies.jpg", "#FFD66B"],
              ["bi0", "/images/creators/bi0.jpg", "#D9DEE8"],
              ["swifzui", "/images/creators/swifzui.jpg", "#E9A77A"],
              ["yash", "/images/creators/yash.jpg", undefined],
              ["you", null, undefined],
            ].map(([name, img, medal], i) => (
              <div key={name} className={`flex items-center gap-4 rounded-2xl px-3 py-2.5 ${name === "you" ? "bg-brand/10 ring-1 ring-brand/50" : ""}`}>
                <span className="w-7 text-center font-primary text-[26px] leading-none" style={{ color: medal ?? "rgba(255,255,255,0.4)" }}>
                  {name === "you" ? "?" : i + 1}
                </span>
                <span className="size-11 overflow-hidden rounded-full bg-white/10" style={medal ? { boxShadow: `0 0 0 2px ${medal}` } : undefined}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {img && <img src={img} alt="" className="size-full object-cover" />}
                </span>
                <span className="flex-1 font-primary text-[24px] leading-none uppercase">{name === "you" ? "You, next" : name}</span>
                {i < 3 && <BadgeIcon id="contributor" size={24} />}
              </div>
            ))}
          </div>
        }
      />
    ),
  },

  "invite-only": {
    width: 1200,
    height: 675,
    render: () => (
      <Frame art="/images/backgrounds/sign-bg.png" glow="center">
        <div className="flex h-full flex-col items-center justify-center gap-8 pb-20">
          <Big size={150}>INV[i]TE [o]NLY</Big>
          <Line size={28} className="text-center">
            Got an invite? Claim your name. No invite? Sign in with X and get on the waitlist.
          </Line>
          <div className="flex items-center gap-3">
            <div className="flex h-[68px] w-[420px] items-center rounded-2xl border border-white/15 bg-black/70 px-5 text-[24px]">
              <span className="text-white/45">fl3x.lol/@</span>
              <span>yourname</span>
            </div>
            <span className="flex h-[68px] items-center rounded-2xl bg-brand px-7 text-[22px] text-black">Join with 𝕏</span>
          </div>
        </div>
      </Frame>
    ),
  },

  customize: {
    width: 1200,
    height: 675,
    render: () => (
      <Split
        leftWidth="42%"
        left={
          <>
            <Big size={112}>DRAG. DR[o]P. FL[e]X.</Big>
            <Line>Pick a widget, drop it on your card, the others make room. Click your name to change it.</Line>
          </>
        }
        right={
          <div className="relative flex gap-4 pb-14" style={{ zoom: 1.12 }}>
            <div className="flex flex-col gap-4">
              <W type="pnl" size="large" />
              <div className="flex h-[204px] w-[172px] items-center justify-center rounded-[28px] border-2 border-dashed border-white/30 bg-white/[0.04] text-[15px] text-white/45">
                Drop here
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <W type="community" size="long" />
              <W type="community" size="long" nth={1} />
              <W type="video" size="long" />
              <W type="music" size="long" />
            </div>
            {/* The widget being dragged, lifted above the grid. */}
            <div className="absolute top-[262px] left-[34px] rounded-[28px] bg-[#1c1c1c] shadow-[0_30px_70px_rgba(0,0,0,0.75)] ring-1 ring-white/10" style={{ transform: "rotate(-6deg) scale(1.08)" }}>
              <W type="token" size="large" />
            </div>
          </div>
        }
      />
    ),
  },

  spotify: {
    width: 1200,
    height: 675,
    render: () => (
      <Split
        left={
          <>
            <Big size={112}>WHAT Y[o]U&apos;RE PLAY[i]NG, LIVE</Big>
            <Line>Connect Spotify once. Your card shows the track you&apos;re on, or the last one you played.</Line>
          </>
        }
        right={
          <div className="flex flex-col items-center gap-5 pb-16" style={{ transform: "rotate(-3deg)" }}>
            <W type="music" size="large" scale={1.7} />
          </div>
        }
      />
    ),
  },

  analytics: {
    width: 1200,
    height: 675,
    render: () => {
      const sources = [
        ["X", 0.92],
        ["Telegram", 0.66],
        ["Discord", 0.48],
        ["Direct", 0.3],
      ] as const;
      const colors = ["#FFB547", "#4FC3F7", "#8B5CF6", "#2FE3AC"];
      return (
        <Split
          left={
            <>
              <Big size={108}>SEE WH[o]&apos;S L[oo]KING</Big>
              <Line>Views, clicks on your links, countries, devices, and the site that sent each visitor.</Line>
            </>
          }
          right={
            <div className="mb-16 w-[470px] rounded-[28px] border border-white/10 bg-[#0d0d0d] p-6">
              <p className="text-[15px] text-white/45">Where visitors come from</p>
              <p className="mb-5 border-b border-white/10 pb-4 font-primary text-[34px] leading-none uppercase">Sources</p>
              <div className="flex flex-col gap-2.5">
                {sources.map(([name, share], i) => (
                  <div key={name} className="relative flex h-14 items-center overflow-hidden rounded-2xl bg-white/[0.04] px-4 text-[20px]">
                    <span className="absolute inset-y-0 left-0 rounded-2xl opacity-30" style={{ width: `${share * 100}%`, background: colors[i] }} />
                    <span className="relative">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          }
        />
      );
    },
  },
};
