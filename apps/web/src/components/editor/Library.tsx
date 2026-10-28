"use client";

import {
  Award01Icon, ChartLineData01Icon, Clock01Icon, Coins01Icon, Cursor01Icon, GridViewIcon, Image01Icon, LockIcon,
  MusicNote01Icon, PaintBucketIcon, SmileIcon, TextFontIcon, TextIcon, Timer01Icon, UserGroupIcon, Video01Icon,
  ArrowLeft01Icon, Search01Icon, Wallet02Icon, NewTwitterIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import {
  BACKGROUNDS, BADGES, CURSORS, FONTS, WIDGETS, WIDGET_TYPES,
  type EditableProfile, type ProfileTheme, type Tier, type WidgetSize, type WidgetType,
} from "@fl3x/shared";
import { Icon } from "@/components/ui";
import { backdrops, fontClass } from "@/components/profile/theme";
import { cn } from "@/lib/cn";
import { inputClass, Segmented } from "./Field";

const widgetIcons: Record<WidgetType, typeof GridViewIcon> = {
  pnl: Wallet02Icon,
  portfolio: ChartLineData01Icon,
  token: Coins01Icon,
  community: UserGroupIcon,
  followers: NewTwitterIcon,
  video: Video01Icon,
  music: MusicNote01Icon,
  image: Image01Icon,
  clock: Clock01Icon,
  countdown: Timer01Icon,
  reactions: SmileIcon,
  text: TextIcon,
};

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
              {props.draft.widgets.length}/{props.widgetLimit} widgets{full && " · limit reached for your tier"}
            </p>
            {WIDGET_TYPES.filter((t) => match(WIDGETS[t].name) || match(WIDGETS[t].description)).map((t) => (
              <button
                key={t}
                type="button"
                disabled={full}
                onClick={() => props.onAddWidget(t, size)}
                className="flex items-center gap-3 rounded-2xl bg-[#141414] p-3 text-left transition-colors hover:bg-[#1c1c1c] disabled:opacity-40"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-brand">
                  <Icon icon={widgetIcons[t]} size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block font-primary text-lg leading-none">{WIDGETS[t].name}</span>
                  <span className="block text-[11px] leading-tight text-fg-3">{WIDGETS[t].description}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {section === "background" && (
          <div className="grid grid-cols-2 gap-2">
            {BACKGROUNDS.filter((b) => b.id !== "image").map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => props.onTheme({ background: b.id })}
                className={cn("h-20 rounded-2xl border-2 p-2 text-left text-xs", theme.background === b.id ? "border-brand" : "border-transparent")}
                style={{ background: backdrops[b.id as keyof typeof backdrops] }}
              >
                {b.label}
              </button>
            ))}
            <div className="col-span-2 mt-2">
              <PremiumGate locked={!premium} label="Image background">
                <input
                  className={inputClass}
                  placeholder="https://… image or GIF"
                  value={theme.backgroundUrl ?? ""}
                  onChange={(e) => props.onTheme({ background: e.target.value ? "image" : "plain", backgroundUrl: e.target.value })}
                />
              </PremiumGate>
            </div>
          </div>
        )}

        {section === "badges" && (
          <div className="flex flex-col gap-2">
            {BADGES.map((b) => {
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
                  <span className="text-xl">{b.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-primary text-lg leading-none">{b.name}</span>
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
            <div className="grid grid-cols-2 gap-2">
              {CURSORS.map((c) => (
                <OptionTile key={c.id} active={theme.cursor === c.id} onClick={() => props.onTheme({ cursor: c.id })}>
                  {c.label}
                </OptionTile>
              ))}
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
      className={cn("flex h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-[#141414] text-sm", active ? "border-brand" : "border-transparent")}
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
