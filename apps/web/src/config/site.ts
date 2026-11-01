// Fail the production build instead of shipping a site that calls localhost.
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_URL && process.env.VERCEL) {
  throw new Error("Set NEXT_PUBLIC_API_URL (and NEXT_PUBLIC_PRIVY_APP_ID) in Vercel");
}

export const site = {
  name: "FL3X",
  domain: "fl3x.lol",
  description: "Your on-chain identity. Live widgets, verified wallets, holder perks.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://fl3x.lol",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
  social: {
    x: "https://x.com/fl3xdotlol",
    discord: "https://discord.gg/fl3x",
    github: "https://github.com/fl3x-lol",
  },
} as const;
