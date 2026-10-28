# FL3X

Profiles with live widgets for crypto people. The founder speaks French: reply in French. The product is in English.

## Product
- Holding the token gives a tier: `none` (free, limited profile: 4 widgets, 6 links) / `starter` / `premium`. Decided on 2026-10-28: free profiles are allowed. Thresholds come from the API env and are provisional (100K / 1M for now).
- Pre-launch is invite-only: an invite code is required to claim a username. Each member gets their own code (referrals). Everyone else goes to the waitlist.
- Sign-in uses Privy: X + Solana wallet, no embedded wallet.
- The landing page keeps the old project's design (`../fl3x-old`). The dashboard follows the Figma prototype (`FL3X.lol`, node 186:1226), which is **not final**. Widgets (node 217:191) are redrawn in the same style, never copied.

## Architecture
- `apps/web`: Next.js 16 + Tailwind 4, on Vercel (Root Directory `apps/web`). The `/@username` rewrite points to `/u/[username]`.
- `apps/api`: Fastify + Drizzle + Postgres, on Render (`render.yaml`). Migrations run on boot. Without `DATABASE_URL`, local dev uses PGlite in `.pglite/`.
- `packages/shared`: zod schemas, the widget catalogue (`widgets.ts`: fields drive both the inspector and validation), badges, tiers.
- Third-party API keys live in the API only. Widgets read `/data/*` (Postgres cache `data_cache`).
- Data sources: DexScreener (tokens), Jupiter Price v3 + Solana RPC (wallet value), Discord invites API, public t.me pages, YouTube/Spotify oEmbed, Twitch Helix (optional).
- P&L / portfolio: built from our own hourly snapshots (`wallet_snapshots`). History starts when the wallet is first shown.
- Analytics: the browser calls `/api/track` (Next, reads Vercel geo), which forwards to `/internal/track` with `INTERNAL_API_KEY`. IPs are hashed with a daily salt and never stored.
- Local dev without Privy: a "dev login" (`dev:<name>` tokens) is accepted by the API only outside production.

## Conventions
- No fake data on the site.
- Tier limits in `TIER_LIMITS` (shared). Premium-only theme options in `PREMIUM_THEME_KEYS`; the API resets them for non-Premium users.
- After a schema change: `npm run db:generate -w @fl3x/api`.

## Open decisions
- Token mint, final thresholds, chain(s) beyond Solana (EVM, Robinhood Chain).
- Image uploads (avatar, backgrounds): storage still to choose (R2 / Vercel Blob).
- Custom badge (purchase), extra widgets, waitlist with points.
