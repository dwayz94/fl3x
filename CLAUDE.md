# FL3X

Profiles with live widgets for crypto people. The founder speaks French: reply in French. The product is in English.

## Product
- Holding the token gives a tier: `none` (free: 4 widgets, 2 links; Starter 4/4; Premium 12 widgets/8 links) / `starter` / `premium`. What each tier gets lives in `TIER_LIMITS` + `TIER_PERKS` (shared), shown on the landing and the Premium page: list only features that exist. Premium-only: checkmark, fonts, cursors, animated backgrounds (`profile/AnimatedBackdrop.tsx`, CSS only; the API resets them to plain for non-Premium), hiding the FL3X mark, 90-day analytics (Starter 30, Free 7). Decided on 2026-10-28: free profiles are allowed. Thresholds come from the API env and are provisional (100K / 1M for now).
- Pre-launch is invite-only: an invite code is required to claim a username. Each member gets their own code (referrals); the referral link carries the handle (`/invite/<username>`), resolved to the code by the API (old codes still work). Everyone else goes to the waitlist.
- Sign-in uses Privy: X (the join flow), any wallet (EVM or Solana) elsewhere, no embedded wallet. The $FL3X token is on Solana: only Solana wallets count for tiers. Holdings are re-checked at most every 5 min per member and every 5 min for paying members (job in `api/src/index.ts`).
- Join (`/join`) is a step carousel like getrekt's onboarding: Continue with X → handle (prefilled from X, + invite code while invite-only) → link wallets (optional) → ready (dashboard or profile).
- The owner sees an "Edit profile" button on their own public profile (`lib/use-owner.ts` reads the stored session token; profiles don't load Privy).
- The landing page keeps the old project's design (`../fl3x-old`). Join / waitlist follow the Figma sign screens: no card, centered column on the money-bag background.
- Customize is a full-screen mode (no sidebar, back button). Drag reorders live (`profile/EditableGrid.tsx`, motion layout animations). Name and bio are edited in Settings or in place on the card in Customize; clicking the avatar in Customize uploads a new one.
- Links and community/video widgets take a handle only; the domain is fixed (`LINK_KINDS`, field kind `handle`). Trading terminal referral links (Axiom, GMGN, Padre, Proxima) use their own one-color marks (`BrandIcon` in `profile/links.ts`).
- Widgets are added by click or by dragging a library tile onto the card (`dragFromLibrary` in Customize). Profile links are reordered by drag or arrows on the Links page (order = `position`).
- Music widgets play a 30 s preview from Deezer (`/data/preview`, looked up by title + artist on click; links expire after ~15 min).
- Reactions widget is hidden from the library (kept for existing profiles).
- Widgets: only the V2 designs remain for portfolio, music, clock, followers, video and countdown (V1 removed 2026-10-29, no `style` setting). The dashboard follows the Figma prototype (`FL3X.lol`, node 186:1226), which is **not final**. Widgets (node 217:191) are redrawn in the same style, never copied.

## Architecture
- `apps/web`: Next.js 16 + Tailwind 4, on Vercel (Root Directory `apps/web`). The `/@username` rewrite points to `/u/[username]`.
- `apps/api`: Fastify + Drizzle + Postgres, on Render (`render.yaml`). Migrations run on boot. Without `DATABASE_URL`, local dev uses PGlite in `.pglite/`.
- `packages/shared`: zod schemas, the widget catalogue (`widgets.ts`: fields drive both the inspector and validation), badges, tiers.
- Third-party API keys live in the API only. Widgets read `/data/*` (Postgres cache `data_cache`).
- Data sources: DexScreener (tokens), Jupiter Price v3 + Tokens v2 + Solana RPC (Solana wallets), publicnode RPCs + DefiLlama prices (EVM wallets; Moralis optional), Robinhood Chain RPC (chain 4663: ETH + WETH only, no price feed for its tokens yet), Discord invites API, public t.me pages, YouTube channel page + RSS (latest video), Twitch Helix or decapi.me, Spotify Web API (member's own account, OAuth), flagcdn (flags).
- Wallets: our own connect flow (EIP-6963 for EVM, Wallet Standard for Solana), the user signs a one-time message, the API verifies it (`lib/wallets.ts`). No connect kit. Wallet widgets combine every verified wallet; public profiles fetch values by widget id so addresses never reach the page.
- Uploads: `POST /me/media` (PNG/JPG/WebP ≤ 8 MB, sniffed by magic bytes), re-encoded to WebP with sharp, stored in Postgres (`media`), served from `/media/:id.webp`.
- Every account has a permanent internal ID (`users.id`, UUID; the profile hangs off it), never sent to public pages. Support finds an account by ID, username, X handle or wallet: `GET /admin/users/lookup?q=` (admin key).
- Badges: catalogue in `shared/badges.ts` (Figma 286:819), icons in `public/images/badges/`. Team badges are granted with `POST /admin/badges`. The Premium checkmark (`ui/Verified`, Figma 496:201) is Premium-only.
- P&L / portfolio: built from our own hourly snapshots (`wallet_snapshots`). History starts when the wallet is first shown.
- Analytics: the browser calls `/api/track` (Next, reads Vercel geo), which forwards to `/internal/track` with `INTERNAL_API_KEY`. IPs are hashed with a daily salt and never stored.
- Local dev: a "dev login" (`dev:<name>` tokens) is accepted by the API only outside production, when Privy isn't configured or with `DEV_LOGIN=1` (API) / `NEXT_PUBLIC_DEV_LOGIN=1` (web). `/dev` gives one-click test sessions: "Test member" (@tester, seeded profile + analytics, tier from `DEV_TIER`) or a fresh account for the join/waitlist flow.
- Waitlist = sign in with X (no form). `POST /me/waitlist` uses the X handle from Privy.

## Conventions
- No fake data on the site.
- Tier limits in `TIER_LIMITS` (shared). Premium-only theme options in `PREMIUM_THEME_KEYS`; the API resets them for non-Premium users.
- After a schema change: `npm run db:generate -w @fl3x/api`.
- Logo SVGs (`apps/web/public/brand`, `images/fl3x-*.svg`) and `docs/brand/logo.html` come from `python3 scripts/brand-logo.py`: edit the script, not the files.
- Editor saves go through the bottom unsaved bar (`UnsavedBar`: Discard / Save changes), never a browser `beforeunload` prompt.

## Open decisions
- Token mint, final thresholds.
- Image uploads (avatar, backgrounds): storage still to choose (R2 / Vercel Blob).
- Custom badge (purchase), extra widgets, waitlist with points.
