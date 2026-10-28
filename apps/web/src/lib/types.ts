// Response shapes of the API's /data/* endpoints.
export interface TokenData {
  chain: string;
  address: string;
  name: string;
  symbol: string;
  priceUsd: number | null;
  marketCap: number | null;
  change24h: number | null;
  imageUrl: string | null;
  url: string;
}

export interface CommunityData {
  platform: "discord" | "telegram";
  name: string;
  iconUrl: string | null;
  members: number | null;
  online: number | null;
  url: string;
}

export interface MediaData {
  provider: "youtube" | "spotify" | "twitch";
  title: string;
  author: string | null;
  thumbnailUrl: string | null;
  live: boolean | null;
  url: string;
}

export interface WalletData {
  wallet: string;
  valueUsd: number;
  period: string;
  start: { valueUsd: number; at: string } | null;
  changeUsd: number | null;
  changePct: number | null;
  history: { at: string; valueUsd: number }[];
  holdings?: Holding[];
}

export interface Holding {
  mint: string;
  symbol: string;
  name: string;
  iconUrl: string | null;
  amount: number;
  valueUsd: number;
  change24h: number | null;
}
