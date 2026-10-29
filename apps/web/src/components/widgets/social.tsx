"use client";

import {
  DiscordIcon, InstagramIcon, NewTwitterIcon, TelegramIcon, TiktokIcon, TwitchIcon, YoutubeIcon,
} from "@hugeicons/core-free-icons";
import { communityUrl, type Widget } from "@fl3x/shared";
import { Icon } from "@/components/ui";
import { fmtNumber } from "@/lib/format";
import type { CommunityData } from "@/lib/types";
import { useData } from "@/lib/use-data";
import { Avatar, WEmpty, WidgetFrame, WPill, WSkeleton, WTitle } from "./WidgetFrame";

const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);

const platformIcon = {
  x: NewTwitterIcon,
  youtube: YoutubeIcon,
  twitch: TwitchIcon,
  tiktok: TiktokIcon,
  instagram: InstagramIcon,
  discord: DiscordIcon,
  telegram: TelegramIcon,
} as const;

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
