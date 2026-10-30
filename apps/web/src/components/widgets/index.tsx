"use client";

import { useContext } from "react";
import type { Widget } from "@fl3x/shared";
import { HoldingsWidget, NftWidget, PnlWidget, TokenWidget } from "./crypto";
import { CommunityWidget } from "./social";
import { ClockWidgetV2, CountdownWidgetV2, FollowersWidgetV2, MusicWidgetV2, PortfolioWidgetV2, VideoWidgetV2 } from "./v2";
import { AllocationWidget, CalendarWidget, HyperliquidWidget, MoversWidget, PolymarketWidget, TradesWidget, WatchlistWidget } from "./markets";
import { ImageWidget, LinkWidget, QuoteWidget, ReactionsWidget, TextWidget } from "./utility";

import { WidgetSurface, WidgetTier } from "./WidgetFrame";

export { sizeClass, WidgetTier } from "./WidgetFrame";

/**
 * Renders any widget by type. `interactive` is false in the editor preview.
 * Portfolio, music, clock, followers, video and countdown use their V2
 * designs only (the V1 versions were removed on 2026-10-29).
 */
export function WidgetView({ w, interactive = true }: { w: Widget; interactive?: boolean }) {
  const tier = useContext(WidgetTier);
  // A color background shows only while the profile is Premium (a lapsed tier falls back to glass).
  const look = w.settings.surface === "color" && (tier === null || tier === "premium") ? { surface: "color", color: String(w.settings.surfaceColor ?? "#FF97CB") } : {};
  return (
    <WidgetSurface.Provider value={look}>
      <WidgetBody w={w} interactive={interactive} />
    </WidgetSurface.Provider>
  );
}

function WidgetBody({ w, interactive }: { w: Widget; interactive: boolean }) {
  switch (w.type) {
    case "pnl": return <PnlWidget w={w} />;
    case "portfolio": return <PortfolioWidgetV2 w={w} />;
    case "holdings": return <HoldingsWidget w={w} />;
    case "token": return <TokenWidget w={w} />;
    case "nfts": return <NftWidget w={w} />;
    case "allocation": return <AllocationWidget w={w} />;
    case "movers": return <MoversWidget w={w} />;
    case "calendar": return <CalendarWidget w={w} />;
    case "trades": return <TradesWidget w={w} />;
    case "watchlist": return <WatchlistWidget w={w} />;
    case "hyperliquid": return <HyperliquidWidget w={w} />;
    case "polymarket": return <PolymarketWidget w={w} />;
    case "quote": return <QuoteWidget w={w} />;
    case "community": return <CommunityWidget w={w} />;
    case "followers": return <FollowersWidgetV2 w={w} />;
    case "video": return <VideoWidgetV2 w={w} />;
    case "music": return <MusicWidgetV2 w={w} />;
    case "image": return <ImageWidget w={w} />;
    case "clock": return <ClockWidgetV2 w={w} />;
    case "countdown": return <CountdownWidgetV2 w={w} />;
    case "reactions": return <ReactionsWidget w={w} interactive={interactive} />;
    case "link": return <LinkWidget w={w} />;
    case "text": return <TextWidget w={w} />;
  }
}
