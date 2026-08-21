# Apex Health

Copper Peptide health & beauty ecommerce store with storefront, admin panel, and Stripe-powered checkout.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string; `SESSION_SECRET` — signs both the customer and admin session cookies
- Optional env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — for Stripe payments. Outside Replit these are the only source of Stripe credentials; on Replit they fall back to the connector integration
- Deployment env: `PUBLIC_BASE_URL` — public origin (e.g. `https://apex-cosmetics.com`), used for Stripe checkout success/cancel URLs and webhook registration. Replaces `REPLIT_DOMAINS` off-Replit
- Optional env: `STOREFRONT_DIST` / `ADMIN_DIST` — override where the API server looks for the built SPAs
- Admin auth env: `SESSION_SECRET` (signs both session cookies), `ADMIN_INITIAL_PASSWORD` (password for the auto-seeded `admin` user; if unset a random one is generated and logged once), `ADMIN_SIGNUP_CODE` (invite code required to create additional admin accounts; if unset, signups are disabled), optional `ADMIN_INITIAL_USERNAME` (defaults to `admin`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM + `stripe-replit-sync` (Stripe mirror tables in `stripe.*` schema)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Payments: Stripe (one-time checkout sessions)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui, Syne font

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle schema (`users`, `orders`, `order_items`)
- `artifacts/api-server/src/routes/` — API route handlers
- `artifacts/api-server/src/storage.ts` — DB query layer (Drizzle + raw SQL for stripe.* schema)
- `artifacts/storefront/src/` — Customer-facing React store
- `artifacts/admin/src/` — Internal admin panel
- `attached_assets/` — Product images (referenced via `@assets` alias in Vite)

## Architecture decisions

- **Products live in Stripe, not a custom table.** `stripe-replit-sync` mirrors Stripe products/prices into a `stripe.*` schema in Postgres. The API reads from there and syncs via webhooks.
- **Orders live in Postgres** (`orders` + `order_items` tables), created on Stripe checkout webhook confirmation.
- **Stripe initialization is non-blocking.** If Stripe credentials are not set, the server starts in degraded mode (product endpoints return 500; other endpoints work).
- **Stripe credentials resolve from env first, Replit connector second** (`stripeClient.ts`). `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` win when present; otherwise the Replit connectors API is used, so the project still runs unchanged on Replit.
- **The API server serves both SPAs** (`middlewares/staticSpa.ts`): storefront at `/`, admin at `/admin/`. Single-origin is mandatory — the API client uses relative `/api` paths and both session cookies are SameSite=Lax. Splitting the SPAs onto another hostname breaks customer and admin auth.
- **SQL queries for Stripe data use raw SQL** (`db.execute(sql.raw(...))`) since Drizzle ORM schemas target the `public` schema — the `stripe.*` schema tables are queried directly.
- **WHERE clauses in CTEs must not use table aliases** defined in the outer query. Alias `p` in `FROM paginated_products p` is only available outside the CTE.
- **All auth is first-party — no third-party identity provider.** The admin panel uses a dependency-free signed session cookie (`apex_admin_session`, HMAC via `SESSION_SECRET`, 7-day TTL) + scrypt password hashing, backed by the `admin_users` table. `requireAdminSession` gates `/api/admin/*` and admin discount routes. `adminAuthRouter` must be mounted BEFORE `adminRouter` so `/admin/auth/*` is not gated. **Storefront customers use the same pattern** (`apex_customer_session`, 30-day TTL, `lib/customerAuth.ts`), gating `requireAuth` on `/me`, `/my-orders`, `/customers`. The two audiences share `SESSION_SECRET` but tokens carry a `typ` claim so one cannot be replayed as the other.
- **Admin signups are locked.** Once one admin exists, new accounts require the `ADMIN_SIGNUP_CODE` invite code (constant-time compared). One admin is auto-seeded on startup.

## Product

- **Storefront** (`/`): Hero landing page, product catalog by category (Face / Body / Hair), product detail pages, cart, Stripe checkout
- **Admin** (`/admin/`): Username/password login + invite-code signup. Dashboard with revenue/order stats, product CRUD with pricing management, order tracking with status updates, customer directory

## User preferences

- Payment provider: Stripe (one-time payments, no subscriptions)
- Stripe to be connected later via `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secrets

## Gotchas

- After any OpenAPI spec change, run codegen before using updated types: `pnpm --filter @workspace/api-spec run codegen`
- SQL WHERE clauses inside CTEs must use bare column names (e.g. `active = true`), NOT aliases defined in the outer query (e.g. `p.active = true`)
- `stripe-replit-sync` `runMigrations` does not accept a `schema` option — just pass `{ databaseUrl }`
- `scripts/src/stripeClient.ts` fetches Stripe credentials from the Replit integrations endpoint — cast `resp.json()` to a typed interface to avoid TS18046

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
