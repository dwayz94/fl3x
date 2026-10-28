"use client";

import type { Widget } from "@fl3x/shared";
import { PnlWidget, PortfolioWidget, TokenWidget } from "./crypto";
import { CommunityWidget, FollowersWidget, MusicWidget, VideoWidget } from "./social";
import { ClockWidget, CountdownWidget, ImageWidget, ReactionsWidget, TextWidget } from "./utility";

export { sizeClass } from "./WidgetFrame";

/** Renders any widget by type. `interactive` is false in the editor preview. */
export function WidgetView({ w, interactive = true }: { w: Widget; interactive?: boolean }) {
  switch (w.type) {
    case "pnl": return <PnlWidget w={w} />;
    case "portfolio": return <PortfolioWidget w={w} />;
    case "token": return <TokenWidget w={w} />;
    case "community": return <CommunityWidget w={w} />;
    case "followers": return <FollowersWidget w={w} />;
    case "video": return <VideoWidget w={w} />;
    case "music": return <MusicWidget w={w} />;
    case "image": return <ImageWidget w={w} />;
    case "clock": return <ClockWidget w={w} />;
    case "countdown": return <CountdownWidget w={w} />;
    case "reactions": return <ReactionsWidget w={w} interactive={interactive} />;
    case "text": return <TextWidget w={w} />;
  }
}
