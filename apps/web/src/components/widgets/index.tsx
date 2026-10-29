"use client";

import type { Widget } from "@fl3x/shared";
import { HoldingsWidget, PnlWidget, PortfolioWidget, TokenWidget } from "./crypto";
import { CommunityWidget, FollowersWidget, MusicWidget, VideoWidget } from "./social";
import { ClockWidgetV2, CountdownWidgetV2, FollowersWidgetV2, MusicWidgetV2, PortfolioWidgetV2, VideoWidgetV2 } from "./v2";
import { ClockWidget, CountdownWidget, ImageWidget, LinkWidget, ReactionsWidget, TextWidget } from "./utility";

export { sizeClass } from "./WidgetFrame";

/** Renders any widget by type. `interactive` is false in the editor preview. */
export function WidgetView({ w, interactive = true }: { w: Widget; interactive?: boolean }) {
  if (w.settings.style !== "v1") {
    switch (w.type) {
      case "portfolio": return <PortfolioWidgetV2 w={w} />;
      case "music": return <MusicWidgetV2 w={w} />;
      case "clock": return <ClockWidgetV2 w={w} />;
      case "followers": return <FollowersWidgetV2 w={w} />;
      case "video": return <VideoWidgetV2 w={w} />;
      case "countdown": return <CountdownWidgetV2 w={w} />;
    }
  }
  switch (w.type) {
    case "pnl": return <PnlWidget w={w} />;
    case "portfolio": return <PortfolioWidget w={w} />;
    case "holdings": return <HoldingsWidget w={w} />;
    case "token": return <TokenWidget w={w} />;
    case "community": return <CommunityWidget w={w} />;
    case "followers": return <FollowersWidget w={w} />;
    case "video": return <VideoWidget w={w} />;
    case "music": return <MusicWidget w={w} />;
    case "image": return <ImageWidget w={w} />;
    case "clock": return <ClockWidget w={w} />;
    case "countdown": return <CountdownWidget w={w} />;
    case "reactions": return <ReactionsWidget w={w} interactive={interactive} />;
    case "link": return <LinkWidget w={w} />;
    case "text": return <TextWidget w={w} />;
  }
}
