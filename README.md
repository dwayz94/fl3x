# FL3X

On-chain profile pages with live widgets. Holding the token unlocks the **Starter** and **Premium** tiers. Pre-launch is invite-only.

`fl3x.lol` (web, Vercel) · `api.fl3x.lol` (API, Render)

## Layout

```
apps/web         Next.js 16 + Tailwind 4. Landing, join flow, dashboard, public profiles (/@username)
apps/api         Fastify + Drizzle + Postgres. Auth (Privy), invites/referrals, waitlist, holder tiers
packages/shared  Zod schemas, username rules, tier logic, API types used by both apps
```

## External services

| What | Service |
| --- | --- |
| Sign-in (X + Solana wallet) | [Privy](https://privy.io): the web app gets an access token, the API verifies it and reads linked accounts from Privy |
| Database | Render Postgres (managed). Any Postgres URL works (e.g. Neon) |
| Token balances, wallet value | Solana RPC (`SOLANA_RPC_URL`, use Helius or Triton in prod) + Jupiter Price v3 (`JUPITER_API_KEY` optional) |
| Widget data | DexScreener, Discord invites API, t.me public pages, YouTube/Spotify oEmbed, Twitch Helix (optional keys). Cached in Postgres |
| Hosting | Vercel (web), Render (API) |

## Local dev

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local   # set NEXT_PUBLIC_PRIVY_APP_ID
npm run dev                                     # web :3000, api :4000
```

Without `DATABASE_URL`, the API uses an embedded Postgres (PGlite) in `apps/api/.pglite/`. It's for local dev only; prod always uses the managed DB. Migrations run on boot.

Mint invite codes:

```bash
npm run invite:create -w @fl3x/api -- 10 1 "genesis"
# or in prod:
curl -X POST https://api.fl3x.lol/admin/invites -H "x-admin-key: $ADMIN_API_KEY" -H 'content-type: application/json' -d '{"count":10,"maxUses":1}'
```

After a schema change in `apps/api/src/db/schema.ts`: `npm run db:generate -w @fl3x/api`.

## Flow

1. `/invite/FL3X-XXXXXX` or `/join?code=…` checks the code live.
2. Sign in with X or a Solana wallet (Privy). `POST /session` syncs the X handle and wallets from Privy.
3. Claim a username (`POST /onboarding/claim`). This uses one seat of the invite code atomically, records the referrer and gives the new member their own code (`DEFAULT_INVITE_QUOTA` seats).
4. Tier = sum of `TOKEN_MINT` held across linked wallets vs `TIER_STARTER_MIN` / `TIER_PREMIUM_MIN`. Refreshed every 10 min on `/me` or on demand.

No invite → waitlist (`POST /waitlist`). Set `LAUNCH_PHASE=public` to open sign-ups.

## Dashboard & widgets

`/dashboard/customize` is the editor: library (left), live profile preview (center, click to select, drag to reorder), inspector (right). Other tabs: Analytics, Badges, Links, Premium, Settings.

Widgets are defined once in `packages/shared/src/widgets.ts` (fields, defaults, validation) and rendered in `apps/web/src/components/widgets`. Each has a `large` (2×2) and `long` (4×1) layout.

Without `NEXT_PUBLIC_PRIVY_APP_ID`, local dev uses test sessions instead of Privy (not available in production builds): open http://localhost:3000/dev and pick **Test member** (seeded profile, straight to the dashboard) or **New account** (goes through join / waitlist). `DEV_WALLET` gives dev users a wallet, `DEV_TIER` forces their tier.

## Deploy

**API → Render**: New → Blueprint → this repo (`render.yaml`). Fill `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `SOLANA_RPC_URL`, `TOKEN_MINT`. Custom domain `api.fl3x.lol`.

**Web → Vercel**: import the repo, Root Directory `apps/web`. Env: `NEXT_PUBLIC_API_URL=https://api.fl3x.lol`, `NEXT_PUBLIC_SITE_URL=https://fl3x.lol`, `NEXT_PUBLIC_PRIVY_APP_ID`, `INTERNAL_API_KEY` (same as the API). Domain `fl3x.lol`.

**Privy dashboard**: enable Twitter + Solana external wallets. Allowed origins: `https://fl3x.lol`, `http://localhost:3000`.

## Monitoring

- **Health**: `GET https://api.fl3x.lol/health` answers `{"ok":true,"db":true}` when the API and its database are up (503 otherwise). Render uses it as its health check (`render.yaml`) and restarts the service when it fails.
- **Uptime**: `.github/workflows/uptime.yml` checks the API, the site and (if the repo variable `UPTIME_PROFILE` is set, e.g. `fl3x`) one public profile every 10 minutes. A failure emails the repo admins. For alerts by SMS/Telegram and a status page, add the same URLs to a free monitor (Better Stack or UptimeRobot).
- **Errors**: set `SENTRY_DSN` on Render and `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` on Vercel (one Sentry project is enough). Without them nothing is loaded. API 500s, the hourly job, SSR/route errors and browser crashes are reported; tokens and request bodies are not.
- **Logs**: Render → service → Logs (JSON, one line per request). Add a log stream (Better Stack, Datadog…) in Render settings to keep them longer than Render's retention.

## Legal

`/terms` and `/privacy` (contact `support@fl3x.lol`). Update `LEGAL_UPDATED` in `components/shared/LegalPage.tsx` when they change. Not reviewed by a lawyer yet.
