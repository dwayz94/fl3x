"use client";

import type { NftData, Widget } from "@fl3x/shared";
import { useWalletWidget } from "./use-widget-data";

/** NFTs behind a gallery widget (see useWalletWidget). */
export const useNfts = (w: Widget) => useWalletWidget<NftData>(w, "nfts", 5 * 60_000);
