"use client";

import {
  DiscordIcon, InstagramIcon, NewTwitterIcon, PlayIcon, SpotifyIcon, TelegramIcon, TiktokIcon, TwitchIcon, YoutubeIcon,
} from "@hugeicons/core-free-icons";
import { communityUrl, type Widget } from "@fl3x/shared";
import { Icon } from "@/components/ui";
import { fmtCompact, fmtNumber } from "@/lib/format";
import type { CommunityData, MediaData } from "@/lib/types";
import { useData } from "@/lib/use-data";
import { useMusic, useVideo } from "@/lib/use-media";
import { Avatar, WEmpty, WidgetFrame, WMuted, WPill, WSkeleton, WTitle } from "./WidgetFrame";

const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
const str = (v: unknown) => (typeof v === "string" ? v : "");

const platformIcon = {
  x: NewTwitterIcon,
  youtube: YoutubeIcon,
  twitch: TwitchIcon,
  tiktok: TiktokIcon,
  instagram: InstagramIcon,
  discord: DiscordIcon,
  telegram: TelegramIcon,
} as const;

const profileUrl: Record<string, (h: string) => string> = {
  x: (h) => `https://x.com/${h}`,
  youtube: (h) => `https://youtube.com/@${h}`,
  twitch: (h) => `https://twitch.tv/${h}`,
  tiktok: (h) => `https://tiktok.com/@${h}`,
  instagram: (h) => `https://instagram.com/${h}`,
};

function Stat({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[8px] text-fg-2 uppercase">
      <span className={`size-1 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

export function CommunityWidget({ w }: { w: Widget }) {
  const url = communityUrl(w.settings);
  const opacity = num(w.settings.bgOpacity, 100);
  const { data, isLoading, isError } = useData<CommunityData>("community", { url });
  if (!url) return <WEmpty size={w.size} label="Add a Discord or Telegram invite" />;
  if (isError) return <WEmpty size={w.size} label="Invite link not found" />;
  if (isLoading || !data) return <WSkeleton size={w.size} />;

  const stats = (
    <div className="flex flex-wrap gap-x-2">
      {data.online != null && <Stat dot="bg-success">{fmtNumber(data.online)} online</Stat>}
      {data.members != null && <Stat dot="bg-fg-3">{fmtNumber(data.members)} members</Stat>}
    </div>
  );
  const icon = (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-white/15 text-white/45 ${w.size === "long" ? "size-16" : "size-11"}`}>
      <Icon icon={platformIcon[data.platform]} size={w.size === "long" ? 32 : 24} />
    </span>
  );

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity} href={data.url}>
        <Avatar src={data.iconUrl} className="size-[60px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <WTitle>{data.name}</WTitle>
          {stats}
          <WPill className="w-fit">Join</WPill>
        </div>
        {icon}
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} href={data.url}>
      <div className="flex items-start justify-between">
        <Avatar src={data.iconUrl} className="size-14" />
        {icon}
      </div>
      <WTitle className="mt-3">{data.name}</WTitle>
      {stats}
      <WPill className="mt-auto w-full">Join</WPill>
    </WidgetFrame>
  );
}

export function FollowersWidget({ w }: { w: Widget }) {
  const platform = (str(w.settings.platform) || "x") as "x" | "youtube" | "twitch" | "tiktok" | "instagram";
  const handle = str(w.settings.handle).replace(/^@/, "");
  const count = num(w.settings.count, 0);
  const opacity = num(w.settings.bgOpacity, 100);
  if (!handle) return <WEmpty size={w.size} label="Add your handle" />;
  const href = profileUrl[platform]?.(handle);
  const icon = <Icon icon={platformIcon[platform]} size={w.size === "long" ? 60 : 56} className="shrink-0 text-white/35" />;

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity} href={href}>
        <div className="min-w-0 flex-1">
          <p className="font-primary text-[40px] leading-none">{fmtNumber(count)}</p>
          <p className="mt-1 font-primary text-sm text-fg-3 uppercase">Followers · @{handle}</p>
        </div>
        {icon}
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} href={href} className="items-center text-center">
      <p className="mt-1 font-primary text-[34px] leading-none">{count >= 1_000_000 ? fmtCompact(count) : fmtNumber(count)}</p>
      <p className="mt-1 font-primary text-base text-fg-3 uppercase">Followers</p>
      <div className="my-auto">{icon}</div>
      <WPill className="w-full">Follow</WPill>
    </WidgetFrame>
  );
}

function Thumb({ src, className, provider }: { src?: string | null; className?: string; provider: MediaData["provider"] }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-xl bg-white/10 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" className="size-full object-cover" />}
      {provider !== "spotify" && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Icon icon={PlayIcon} size={22} className="fill-white text-white drop-shadow" />
        </span>
      )}
    </div>
  );
}

function Live({ live }: { live: boolean | null }) {
  if (!live) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-[#B794F6]">
      On live <span className="size-1.5 rounded-full bg-[#B794F6]" />
    </span>
  );
}

export function VideoWidget({ w }: { w: Widget }) {
  const note = str(w.settings.note);
  const opacity = num(w.settings.bgOpacity, 100);
  const { data, isLoading, isError, empty } = useVideo(w);
  if (empty) return <WEmpty size={w.size} label="Add your YouTube or Twitch channel" />;
  if (isError) return <WEmpty size={w.size} label="Video not found" />;
  if (isLoading || !data) return <WSkeleton size={w.size} />;

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity} href={data.url}>
        <Thumb src={data.thumbnailUrl} provider={data.provider} className="aspect-video h-full" />
        <div className="min-w-0 flex-1">
          <Live live={data.live} />
          <WTitle className="line-clamp-2 whitespace-normal text-sm">{data.title}</WTitle>
          {note && <p className="line-clamp-1 text-[10px] text-fg-2">“{note}”</p>}
        </div>
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} href={data.url}>
      <Thumb src={data.thumbnailUrl} provider={data.provider} className="aspect-video w-full" />
      <div className="mt-2">
        <Live live={data.live} />
      </div>
      <WTitle className="line-clamp-2 whitespace-normal text-sm">{data.title}</WTitle>
      {note && <p className="mt-1 line-clamp-3 text-[10px] text-fg-2">“{note}”</p>}
    </WidgetFrame>
  );
}

function Wave() {
  // Static waveform bars; decorative.
  const bars = [4, 9, 6, 12, 8, 14, 10, 6, 11, 7, 13, 9, 5, 10, 7, 12, 6, 9, 4, 8];
  return (
    <div className="flex h-5 items-center gap-[2px]" aria-hidden>
      {bars.map((h, i) => (
        <span key={i} className="w-[2px] rounded-full bg-white/50" style={{ height: h + 4 }} />
      ))}
    </div>
  );
}

export function MusicWidget({ w }: { w: Widget }) {
  const opacity = num(w.settings.bgOpacity, 100);
  const { data, isLoading, isError, empty, live } = useMusic(w);
  if (empty) return <WEmpty size={w.size} label="Add a Spotify link" />;
  if (isError) return <WEmpty size={w.size} label={live ? "Connect Spotify in Settings" : "Track not found"} />;
  if (isLoading || !data) return <WSkeleton size={w.size} />;
  const spotify = <Icon icon={SpotifyIcon} size={30} className="shrink-0 text-white/35" />;

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity} href={data.url}>
        <Thumb src={data.thumbnailUrl} provider="spotify" className="size-[60px]" />
        <div className="min-w-0 flex-1">
          <WTitle>{data.title}</WTitle>
          {data.author && <WMuted>{data.author}</WMuted>}
        </div>
        {spotify}
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} href={data.url}>
      <div className="flex items-start justify-between">
        <Thumb src={data.thumbnailUrl} provider="spotify" className="size-16" />
        {spotify}
      </div>
      <WTitle className="mt-3">{data.title}</WTitle>
      {data.author && <WMuted>{data.author}</WMuted>}
      <div className="mt-auto">
        <Wave />
      </div>
    </WidgetFrame>
  );
}
