"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft01Icon, ArrowRight01Icon, PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { ProfileView } from "@/components/profile/ProfileView";
import { Icon } from "@/components/ui";
import { DEMO_BACKGROUNDS, DEMO_LAYOUTS, demoProfile, resolveDemo } from "@/lib/demo";
import { DemoDataProvider } from "@/lib/use-data";
import { cn } from "@/lib/cn";

const SLIDE_MS = 5000;

function Seg<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl bg-black/55 p-1 backdrop-blur-md">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn("rounded-xl px-3 py-1.5 text-xs transition-colors", value === o.id ? "bg-brand text-bg" : "text-fg-2 hover:text-fg")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * A sample profile to judge the design for real: flip through the Figma
 * layout variants and background images (or a slideshow).
 */
export function ExampleProfile() {
  const [layout, setLayout] = useState(DEMO_LAYOUTS[0]!.id);
  const [bg, setBg] = useState(0);
  const [custom, setCustom] = useState("");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setBg((i) => (i + 1) % DEMO_BACKGROUNDS.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [playing]);

  const widgets = DEMO_LAYOUTS.find((l) => l.id === layout)!.widgets;
  const current = custom.startsWith("https://") ? null : DEMO_BACKGROUNDS[bg]!;
  const profile = demoProfile(widgets, current ? current.url : custom);
  const step = (d: number) => {
    setCustom("");
    setBg((i) => (i + d + DEMO_BACKGROUNDS.length) % DEMO_BACKGROUNDS.length);
  };

  return (
    <DemoDataProvider resolve={resolveDemo}>
      {/* Stacked backdrops cross-fade when the image changes. */}
      <div className="fixed inset-0 -z-10 bg-[#0b0b0b]" aria-hidden>
        {DEMO_BACKGROUNDS.map((b, i) =>
          b.url ? (
            <div
              key={b.id}
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
              style={{ backgroundImage: `url(${b.url})`, opacity: !custom && i === bg ? 1 : 0 }}
            />
          ) : null,
        )}
        {custom.startsWith("https://") && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(custom)})` }} />}
      </div>

      <main className="flex min-h-svh flex-col items-center px-3 py-6 md:px-6 md:py-10">
        <div className="mb-8 flex max-w-full flex-wrap items-center justify-center gap-2">
          <Seg value={layout} onChange={setLayout} options={DEMO_LAYOUTS.map((l) => ({ id: l.id, label: `${l.label} · ${l.widgets.length}` }))} />
          <div className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-2xl bg-black/55 p-1 backdrop-blur-md">
            <button type="button" onClick={() => step(-1)} className="rounded-xl p-1.5 text-fg-2 hover:text-fg" aria-label="Previous background">
              <Icon icon={ArrowLeft01Icon} size={16} />
            </button>
            <span className="min-w-[88px] text-center text-xs text-fg-2">{current ? current.label : "Your image"}</span>
            <button type="button" onClick={() => step(1)} className="rounded-xl p-1.5 text-fg-2 hover:text-fg" aria-label="Next background">
              <Icon icon={ArrowRight01Icon} size={16} />
            </button>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className={cn("flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs", playing ? "bg-brand text-bg" : "text-fg-2 hover:text-fg")}
            >
              <Icon icon={playing ? PauseIcon : PlayIcon} size={14} />
              Slideshow
            </button>
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value.trim())}
              placeholder="or paste an image URL"
              className="h-7 w-full rounded-xl sm:w-44 bg-white/10 px-2.5 text-xs outline-none placeholder:text-fg-3 focus:bg-white/15"
            />
          </div>
          <Link href="/widgets" className="rounded-2xl bg-black/55 px-3 py-2 text-xs text-fg-2 backdrop-blur-md hover:text-fg">
            All widgets →
          </Link>
        </div>

        <ProfileView profile={profile} tier={profile.tier} views={profile.views} />

        <Link href="/" className="mt-auto pt-12 opacity-60 transition-opacity hover:opacity-100" aria-label="Made with FL3X">
          <Image src="/images/fl3x-logo.svg" alt="FL3X" width={64} height={22} />
        </Link>
      </main>
    </DemoDataProvider>
  );
}
