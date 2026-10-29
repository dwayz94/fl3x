"use client";

import {
  ArrowLeft01Icon, Award01Icon, Cursor01Icon, GridViewIcon, LockIcon, PaintBucketIcon, Search01Icon, TextFontIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import {
  BACKGROUNDS, BADGES, CURSORS, FONTS, WIDGETS, WIDGET_TYPES,
  type EditableProfile, type ProfileTheme, type Tier, type WidgetSize, type WidgetType,
} from "@fl3x/shared";
import { Icon, ImageInput } from "@/components/ui";
import { BadgeIcon } from "@/components/profile/Badges";
import { backdrops, cursorStyle, cursorSvg, fontClass } from "@/components/profile/theme";
import { WidgetView } from "@/components/widgets";
import { DEMO_WIDGETS, demoWidget, resolveDemo } from "@/lib/demo";
import { DemoDataProvider } from "@/lib/use-data";
import { cn } from "@/lib/cn";
import { inputClass, Segmented } from "./Field";

/** Widgets offered in the library, each with the demo settings used for its preview. */
const LIBRARY = WIDGET_TYPES.filter((t) => !("hidden" in WIDGETS[t])).map((t) => ({ type: t, settings: DEMO_WIDGETS.find((d) => d.type === t)?.settings ?? {} }));

/** Built-in backgrounds from the FL3X art, usable without uploading anything. */
const IMAGE_PRESETS = [
  { url: "/images/backgrounds/sign-bg.png", label: "Money bags" },
  { url: "/images/backgrounds/hero-bg.png", label: "Hero" },
  { url: "/images/backgrounds/footer-bg.png", label: "Glow" },
];

const SECTIONS = [
  { id: "widgets", kicker: "Widget", title: "Widgets", desc: "Add live cards to your profile", icon: GridViewIcon },
  { id: "background", kicker: "Effect", title: "Background", desc: "Set the mood behind your card", icon: PaintBucketIcon },
  { id: "badges", kicker: "Custom", title: "Badges", desc: "Pick the badges you show off", icon: Award01Icon },
  { id: "cursor", kicker: "Effect", title: "Cursor", desc: "Give visitors a custom cursor", icon: Cursor01Icon },
  { id: "font", kicker: "Custom", title: "Font", desc: "Change your name's typeface", icon: TextFontIcon },
  { id: "color", kicker: "Custom", title: "Color", desc: "Your accent color", icon: PaintBucketIcon },
] as const;
type Section = (typeof SECTIONS)[number]["id"];

const ACCENTS = ["#FF97CB", "#2FE3AC", "#00F6FF", "#B794F6", "#FFB547", "#FF4D4D", "#FFFFFF"];

export function Library(props: {
  draft: EditableProfile;
  tier: Tier;
  ownedBadges: string[];
  widgetLimit: number;
  onAddWidget: (type: WidgetType, size: WidgetSize) => void;
  /** Start dragging a widget tile onto the card. */
  onDragWidget?: (type: WidgetType, size: WidgetSize, e: React.PointerEvent<HTMLElement>) => void;
  onTheme: (patch: Partial<ProfileTheme>) => void;
  onBadges: (ids: string[]) => void;
}) {
  const [section, setSection] = useState<Section | null>(null);
  const [size, setSize] = useState<WidgetSize>("large");
  const [q, setQ] = useState("");
  const premium = props.tier === "premium";
  const { theme } = props.draft;
  const full = props.draft.widgets.length >= props.widgetLimit;
  const match = (s: string) => s.toLowerCase().includes(q.trim().toLowerCase());

  return (
    <div className="flex h-full flex-col gap-4">
      <label className="relative block">
        <Icon icon={Search01Icon} size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-fg-3" />
        <input className={cn(inputClass, "pl-9")} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      {section && (
        <button type="button" onClick={() => setSection(null)} className="flex w-fit items-center gap-1 text-sm text-fg-2 hover:text-fg">
          <Icon icon={ArrowLeft01Icon} size={16} />
          {SECTIONS.find((s) => s.id === section)?.title}
        </button>
      )}

      <div className="-mr-2 flex-1 overflow-y-auto pr-2">
        {!section && !q && (
          <div className="flex flex-col gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className="group relative flex h-[76px] items-center overflow-hidden rounded-2xl bg-[#141414] px-4 text-left transition-colors hover:bg-[#1a1a1a]"
              >
                <div className="relative z-10">
                  <p className="text-[10px] text-fg-3">{s.kicker}</p>
                  <p className="font-primary text-2xl leading-none">{s.title}</p>
                  <p className="mt-1 max-w-[120px] text-[10px] leading-tight text-fg-3">{s.desc}</p>
                </div>
                <Icon icon={s.icon} size={72} className="absolute -right-2 text-brand opacity-90 transition-transform group-hover:scale-110" />
              </button>
            ))}
          </div>
        )}

        {(section === "widgets" || q) && (
          <div className="flex flex-col gap-3">
            <Segmented options={[{ id: "long", label: "Long card" }, { id: "large", label: "Large card" }]} value={size} onChange={(v) => setSize(v as WidgetSize)} />
            <p className="text-xs text-fg-3">
              {props.draft.widgets.length}/{props.widgetLimit} widgets{full ? " · limit reached for your tier" : " · click to add, or drag onto your card"}
            </p>
            {/* Real widgets with sample data, so it's obvious what each one looks like. */}
            <DemoDataProvider resolve={resolveDemo}>
              <div className={cn("grid gap-2", size === "large" ? "grid-cols-2" : "grid-cols-1")}>
                {LIBRARY.filter((l) => match(WIDGETS[l.type].name) || match(WIDGETS[l.type].description)).map((l) => (
                  <button
                    key={l.type}
                    type="button"
                    disabled={full}
                    title={WIDGETS[l.type].description}
                    onClick={() => props.onAddWidget(l.type, size)}
                    onPointerDown={(e) => !full && props.onDragWidget?.(l.type, size, e)}
                    className="group flex cursor-grab touch-pan-y select-none flex-col gap-1.5 rounded-2xl bg-[#141414] p-2 text-left transition-colors hover:bg-[#1c1c1c] active:cursor-grabbing disabled:opacity-40"
                  >
                    <div className="pointer-events-none overflow-hidden rounded-xl transition-transform group-hover:scale-[1.03]">
                      <div style={{ zoom: size === "large" ? 0.66 : 0.68 }} className={size === "large" ? "h-[204px] w-[172px]" : "h-[96px] w-[356px]"}>
                        <WidgetView w={demoWidget(l.type, size, l.settings, `lib-${l.type}-${size}`)} interactive={false} />
                      </div>
                    </div>
                    <span className="px-1 font-primary text-sm leading-none">{WIDGETS[l.type].name}</span>
                  </button>
                ))}
              </div>
            </DemoDataProvider>
          </div>
        )}

        {section === "background" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-1.5 text-xs text-fg-2">Your image</p>
              <ImageInput
                kind="background"
                value={theme.background === "image" ? theme.backgroundUrl : undefined}
                onChange={(url) => props.onTheme(url ? { background: "image", backgroundUrl: url } : { background: "plain", backgroundUrl: "" })}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-fg-2">FL3X images</p>
              <div className="grid grid-cols-3 gap-2">
                {IMAGE_PRESETS.map((p) => (
                  <button
                    key={p.url}
                    type="button"
                    title={p.label}
                    onClick={() => props.onTheme({ background: "image", backgroundUrl: p.url })}
                    className={cn("h-14 rounded-xl border-2 bg-cover bg-center", theme.backgroundUrl === p.url && theme.background === "image" ? "border-brand" : "border-transparent")}
                    style={{ backgroundImage: `url(${p.url})` }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-fg-2">Glows</p>
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUNDS.filter((b) => b.id !== "image").map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => props.onTheme({ background: b.id })}
                    className={cn("h-16 rounded-2xl border-2 p-2 text-left text-xs", theme.background === b.id ? "border-brand" : "border-transparent")}
                    style={{ background: backdrops[b.id as keyof typeof backdrops] }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === "badges" && (
          <div className="flex flex-col gap-2">
            {[...BADGES].sort((a, b) => Number(props.ownedBadges.includes(b.id)) - Number(props.ownedBadges.includes(a.id))).map((b) => {
              const owned = props.ownedBadges.includes(b.id);
              const shown = props.draft.badges.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  disabled={!owned}
                  onClick={() => props.onBadges(shown ? props.draft.badges.filter((x) => x !== b.id) : [...props.draft.badges, b.id])}
                  className={cn("flex items-center gap-3 rounded-2xl border p-3 text-left disabled:opacity-40", shown ? "border-brand bg-brand/10" : "border-white/10 bg-[#141414]")}
                >
                  <BadgeIcon id={b.id} size={22} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-primary text-lg leading-none" style={{ color: owned ? b.color : undefined }}>{b.name}</span>
                    <span className="block text-[11px] leading-tight text-fg-3">{owned ? b.description : "Locked"}</span>
                  </span>
                  {!owned && <Icon icon={LockIcon} size={16} className="text-fg-3" />}
                </button>
              );
            })}
          </div>
        )}

        {section === "cursor" && (
          <PremiumGate locked={!premium} label="Custom cursors">
            <div className="grid grid-cols-3 gap-2">
              {CURSORS.map((c) => {
                const preview = cursorSvg(c.id, theme.accent);
                return (
                  // Hovering a tile also tries the cursor for real.
                  <div key={c.id} style={{ cursor: cursorStyle({ ...theme, cursor: c.id }) }}>
                    <OptionTile active={theme.cursor === c.id} onClick={() => props.onTheme({ cursor: c.id })}>
                      {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`data:image/svg+xml,${encodeURIComponent(preview.svg)}`} alt="" className="size-9" />
                      ) : (
                        <Icon icon={Cursor01Icon} size={24} />
                      )}
                      <span className="text-[10px] text-fg-2">{c.label}</span>
                    </OptionTile>
                  </div>
                );
              })}
            </div>
          </PremiumGate>
        )}

        {section === "font" && (
          <PremiumGate locked={!premium} label="Custom fonts">
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map((f) => (
                <OptionTile key={f.id} active={theme.font === f.id} onClick={() => props.onTheme({ font: f.id })}>
                  <span className={cn("text-2xl", fontClass[f.id])}>Aa</span>
                  <span className="text-xs text-fg-2">{f.label}</span>
                </OptionTile>
              ))}
            </div>
          </PremiumGate>
        )}

        {section === "color" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => props.onTheme({ accent: c })}
                  className={cn("size-9 rounded-full border-2", theme.accent === c ? "border-white" : "border-transparent")}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111] p-2">
              <input type="color" value={theme.accent} onChange={(e) => props.onTheme({ accent: e.target.value.toUpperCase() })} className="size-8 cursor-pointer rounded-lg border-0 bg-transparent" />
              <span className="font-mono text-xs text-fg-2">{theme.accent}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OptionTile({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex h-20 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-[#141414] text-sm [cursor:inherit]", active ? "border-brand" : "border-transparent")}
    >
      {children}
    </button>
  );
}

function PremiumGate({ locked, label, children }: { locked: boolean; label: string; children: React.ReactNode }) {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-30">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-black/40 text-center">
        <Icon icon={LockIcon} size={18} className="text-brand" />
        <p className="text-xs">{label} are Premium</p>
      </div>
    </div>
  );
}
