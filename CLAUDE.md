# FL3X

Profiles with live widgets for crypto people. The founder speaks French: reply in French. The product is in English.

## Product
- Holding the token gives a tier: `none` (free, limited profile: 4 widgets, 6 links) / `starter` / `premium`. Decided on 2026-10-28: free profiles are allowed. Thresholds come from the API env and are provisional (100K / 1M for now).
- Pre-launch is invite-only: an invite code is required to claim a username. Each member gets their own code (referrals); the referral link carries the handle (`/invite/<username>`), resolved to the code by the API (old codes still work). Everyone else goes to the waitlist.
- Sign-in uses Privy: X + Solana wallet, no embedded wallet.
- The landing page keeps the old project's design (`../fl3x-old`). Join / waitlist follow the Figma sign screens: no card, centered column on the money-bag background.
- Customize is a full-screen mode (no sidebar, back button). Drag reorders live (`profile/EditableGrid.tsx`, motion layout animations). Name/bio/avatar live in Settings; clicking the avatar in Customize uploads a new one.
- Links and community/video widgets take a handle only; the domain is fixed (`LINK_KINDS`, field kind `handle`).
- Reactions widget is hidden from the library (kept for existing profiles).
- Widgets: V2 designs are the default (decided 2026-10-29). V1 stays selectable through the `style` setting; new designs go in as a new version, never by editing the existing one. The dashboard follows the Figma prototype (`FL3X.lol`, node 186:1226), which is **not final**. Widgets (node 217:191) are redrawn in the same style, never copied.

## Architecture
- `apps/web`: Next.js 16 + Tailwind 4, on Vercel (Root Directory `apps/web`). The `/@username` rewrite points to `/u/[username]`.
- `apps/api`: Fastify + Drizzle + Postgres, on Render (`render.yaml`). Migrations run on boot. Without `DATABASE_URL`, local dev uses PGlite in `.pglite/`.
- `packages/shared`: zod schemas, the widget catalogue (`widgets.ts`: fields drive both the inspector and validation), badges, tiers.
- Third-party API keys live in the API only. Widgets read `/data/*` (Postgres cache `data_cache`).
- Data sources: DexScreener (tokens), Jupiter Price v3 + Tokens v2 + Solana RPC (Solana wallets), publicnode RPCs + DefiLlama prices (EVM wallets; Moralis optional), Discord invites API, public t.me pages, YouTube channel page + RSS (latest video), Twitch Helix or decapi.me, Spotify Web API (member's own account, OAuth), flagcdn (flags).
- Wallets: our own connect flow (EIP-6963 for EVM, Wallet Standard for Solana), the user signs a one-time message, the API verifies it (`lib/wallets.ts`). No connect kit. Wallet widgets combine every verified wallet; public profiles fetch values by widget id so addresses never reach the page.
- Uploads: `POST /me/media` (PNG/JPG/WebP ≤ 8 MB, sniffed by magic bytes), re-encoded to WebP with sharp, stored in Postgres (`media`), served from `/media/:id.webp`.
- Badges: catalogue in `shared/badges.ts` (Figma 286:819), icons in `public/images/badges/`. Team badges are granted with `POST /admin/badges`. The Premium checkmark (`ui/Verified`, Figma 496:201) is Premium-only.
- P&L / portfolio: built from our own hourly snapshots (`wallet_snapshots`). History starts when the wallet is first shown.
- Analytics: the browser calls `/api/track` (Next, reads Vercel geo), which forwards to `/internal/track` with `INTERNAL_API_KEY`. IPs are hashed with a daily salt and never stored.
- Local dev without Privy: a "dev login" (`dev:<name>` tokens) is accepted by the API only outside production. `/dev` gives one-click test sessions: "Test member" (@tester, seeded profile + analytics, tier from `DEV_TIER`) or a fresh account for the join/waitlist flow.
- Waitlist = sign in with X (no form). `POST /me/waitlist` uses the X handle from Privy.

## Conventions
- No fake data on the site.
- Tier limits in `TIER_LIMITS` (shared). Premium-only theme options in `PREMIUM_THEME_KEYS`; the API resets them for non-Premium users.
- After a schema change: `npm run db:generate -w @fl3x/api`.
- Logo SVGs (`apps/web/public/brand`, `images/fl3x-*.svg`) and `docs/brand/logo.html` come from `python3 scripts/brand-logo.py`: edit the script, not the files.
- Editor saves go through the bottom unsaved bar (`UnsavedBar`: Discard / Save changes), never a browser `beforeunload` prompt.

## Open decisions
- Token mint, final thresholds, chain(s) beyond Solana (EVM, Robinhood Chain).
- Image uploads (avatar, backgrounds): storage still to choose (R2 / Vercel Blob).
- Custom badge (purchase), extra widgets, waitlist with points.
