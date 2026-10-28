export const site = {
  name: "FL3X",
  domain: "fl3x.lol",
  description: "Your on-chain identity. Live widgets, verified wallets, holder perks.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://fl3x.lol",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
  social: {
    x: "https://x.com/fl3xdotlol",
    discord: "https://discord.gg/fl3x",
    telegram: "https://t.me/fl3xdotlol",
    github: "https://github.com/fl3x-lol",
  },
} as const;
