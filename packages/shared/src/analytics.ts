export interface AnalyticsSummary {
  range: { from: string; to: string };
  totalViews: number;
  uniqueVisitors: number;
  realtime: number; // visitors in the last 5 minutes
  daily: { date: string; views: number }[];
  clicks: { target: string; count: number }[];
  devices: { device: "desktop" | "mobile" | "tablet"; count: number }[];
  countries: { country: string; count: number }[];
  referrers: { referrer: string; count: number }[];
}

export type TrackEvent = { kind: "view" } | { kind: "click"; target: string };
