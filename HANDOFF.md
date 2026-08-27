# Apex Cosmetics — working state

Last updated 2026-08-27.

Scratch notes for picking this back up. Not documentation — `replit.md` is the project reference.

---

## Where things stand

**API — deployed and working.** `apex-cosmetics-prod-api` runs the refactored code. Verified live: `/api/products` returns 12 products, `/api/healthz` is ok, CORS allows the three configured origins and refuses others, preflight permits credentials.

**Frontend — deployed, but stale.** Checked live on 2026-08-27: `apex-cosmetics.com/admin/` returns 200, and the served bundle (`index-BJAQiYKH.js`) does contain `https://api.apex-cosmetics.com`, so the admin can reach the API and log in. It predates the admin work in `da51c75` though — no Categories page, read-only customers. A `frontend` run is still needed to ship that.

**Database — migrated.** All 8 tables exist. 12 products and prices live in `products` / `prices`. The legacy `stripe.*` mirror is still present and still populated, deliberately, so nothing was cut over irreversibly.

---

## Do these next, in order

### 1. Deploy the frontend

Actions → **Deploy to Azure** → Run workflow → branch `main`, target `frontend`.

This ships all of it at once: the API base URL fix, refund policy page, footer Support column, corrected emails, warehouse address, Apex Health naming.

A green run now actually means something — the `Require the API base URL` step fails the job if the value is missing, not https, or has a trailing slash, instead of shipping a bundle that looks fine and renders an empty catalog.

Afterwards check the asset hash changed (it was `index-BJ4nUcbq.js`) and that the built JS contains `https://api.apex-cosmetics.com`.

### 2. Set the admin password — still outstanding

A smoke test seeded a real admin into the production database with the password `SmokeTestOnly123`. That row also blocks `ADMIN_INITIAL_PASSWORD` from ever applying, because `seedAdmin` only runs when `admin_users` is empty.

Use `admin:create` rather than `admin:reset`. It writes the hash straight onto the row, so there is no App Service restart and no window with no admin at all:

```
cd C:\freelancing\apex-cosmetics\scripts
$env:DATABASE_URL = '<from App Service app settings>'
$env:ADMIN_PASSWORD = '<a long one>'
.\node_modules\.bin\tsx.CMD .\src\create-admin-user.ts admin
```

It upserts on username, so it both creates the first account and resets an existing one. `admin:reset` (delete the row, restart, re-seed from `ADMIN_INITIAL_PASSWORD`) still works and is still there.

### 3. Register the Stripe webhook by hand

`https://api.apex-cosmetics.com/api/stripe/webhook` for `checkout.session.completed`, `.expired`, `.async_payment_failed`. Put the signing secret in `STRIPE_WEBHOOK_SECRET`.

The server no longer self-registers: auto-registration mints a secret the running process cannot write back into its own environment, which would leave `STRIPE_WEBHOOK_SECRET` stale and every event failing verification.

Without this a payment succeeds and no order is recorded.

### 4. Run one test-mode purchase

The only part of the refactor not proven against real Stripe. Confirm a row lands in `orders`, and that `order_items` carries a `prod_apex_*` id rather than a Stripe-generated one — that verifies the `product_data.metadata` round-trip.

### 5. Create the `categories` table

The admin panel's new Categories page needs it. Additive and safe on prod:

```
$env:DATABASE_URL = '<from App Service app settings>'
pnpm --filter @workspace/scripts run db:apply-schema
```

Until it exists, `GET /api/admin/categories` errors and the Categories page stays empty. Nothing else regresses — `products.category` is unchanged.

### 6. Backfill the product images

Product photos currently exist **only inside the storefront's build**. `products.image_key` holds a bare filename like `Apex-Facial-Serum-Web_1781426371736.png`, but nothing resolves it: the storefront ignores the column and matches on product *name* against images imported in `artifacts/storefront/src/lib/image-map.ts`, which Vite emits content-hashed. The raw filename 404s. That is why the admin panel shows no photo and why a product image cannot be changed from the admin.

After the API is deployed:

```
$env:API_BASE_URL   = 'https://api.apex-cosmetics.com'
$env:ADMIN_USERNAME = 'admin'
$env:ADMIN_PASSWORD = '<the admin password>'
pnpm --filter @workspace/scripts run images:backfill -- --dry-run
```

Drop `--dry-run` to write. It re-encodes on the way through — the sources are 2000x2000 PNGs at ~7.3MB each, over the API's 5MB cap, and the storefront is shipping them at full size today. At 1600px WebP q82 they land around 580KB: **85MB to 6.8MB across the twelve**.

Re-running skips products that already carry an uploaded key, so a photo set by hand in the admin is not overwritten. `--force` replaces anyway.

Once this has run, the bundled images in `image-map.ts` are fallback only. They can be deleted from the storefront bundle in a later pass — worth doing, since Vite still emits all 85MB of them.

### 7. Drop the dead mirror

Once the above is verified: `DROP SCHEMA stripe CASCADE;`

Until then the old mirror and the new tables can drift. Avoid catalog edits in the admin panel in the meantime.

---

## Open questions

- **Uploaded product images live on the App Service filesystem.** `MEDIA_DIR` defaults to `/home/data/media` in App Service, which is the only path that survives a restart. It is not backed up, not on a CDN, and not shared if the app ever scales past one instance. Blob Storage is the upgrade; only `artifacts/api-server/src/lib/mediaStore.ts` would change.
- **The twelve seeded products still carry bundled asset filenames in `image_key`** (e.g. `Apex-Facial-Serum-Web_1781426371736.png`) rather than upload keys. Both SPAs detect the difference by pattern and fall back to the bundled image, so nothing is broken — but those images cannot be changed from the admin until someone uploads real ones.

- **`hello@apex-cosmetics.com` does not receive mail.** The domain has no MX records at all. That address is now published across four legal pages as the way to reach the business, and the contact form composes a `mailto:` to it. Needs a mailbox or a forwarder.
- **Legal copy is a draft.** The refund policy's specifics — 30-day window, refunds in 5 business days, customer pays return postage, no exchanges — were written as sensible defaults, not from how the business actually operates. Worth a lawyer's read before taking real orders.
- **Footer tagline** still says "Clinical-grade GHK-Cu copper peptide formulations. Engineered at the intersection of longevity biotech and luxury wellness." Left alone, but it is lab framing on a fulfilment operation.
- **`CROSS_SITE_COOKIES`** is `true`. Once the default `azurestaticapps.net` hostname is no longer used, set it to `false` and drop that origin from `CORS_ALLOWED_ORIGINS` — storefront and API share a registrable domain now, so `SameSite=Lax` works and CSRF protection comes back for free.
- **Storefront `index.html`** still carries Replit boilerplate: title "Apex Health Store" and the meta/OG description "…built on Replit. Update this description to reflect the app." That is what search engines and link previews currently show.

---

## Resources

| | |
|---|---|
| Repo | `github.com/VladBreaban/apex-cosmetics`, branch `main` |
| API | App Service `apex-cosmetics-prod-api` → `api.apex-cosmetics.com` |
| Frontend | Static Web App `ambitious-sky-0d4047f10` → `apex-cosmetics.com`, `www.` |
| Database | `psql-apex-cosmetics-prod.postgres.database.azure.com`, db `postgres`, user `dbuser` |
| Resource group | `rg-apex-cosmetics-prod`, Central US |
| DNS | Cloudflare (registrar is GoDaddy) |

The full `DATABASE_URL` lives in the App Service app settings — read it from there. The password is almost entirely URL-delimiter characters, so it must be percent-encoded or it will not parse.

**Cloudflare rule:** the Static Web App records (`@`, `www`) must stay **DNS only / grey cloud**, or Azure cannot issue a certificate. `api` is proxied and that is fine — App Service validates by TXT rather than by reaching the host.

**GitHub Actions config:** `API_BASE_URL` is stored as a *secret*, not a variable. The workflow reads `vars.API_BASE_URL || secrets.API_BASE_URL`, so either works. `AZURE_STATIC_WEB_APPS_API_TOKEN` and `AZURE_WEBAPP_PUBLISH_PROFILE` are secrets. `DEPLOY_API` / `DEPLOY_FRONTEND` must be *variables* to auto-deploy on push.

---

## Commands

```
pnpm run typecheck                                   # all packages
pnpm --filter @workspace/api-server run build

pnpm --filter @workspace/scripts run db:apply-schema  # additive; safe on prod
pnpm --filter @workspace/scripts run catalog:migrate  # stripe.* -> products/prices
pnpm --filter @workspace/scripts run catalog:seed     # 12-product starter catalog
pnpm --filter @workspace/scripts run admin:reset      # clear admin_users
pnpm --filter @workspace/scripts run admin:create     # create or reset one admin

pnpm --filter @workspace/api-spec run codegen         # after editing openapi.yaml

pnpm --filter @workspace/scripts run images:backfill  # storefront images -> media store
```

Use `db:apply-schema` rather than `drizzle-kit push` against a deployed database — push diffs and can drop or alter; this only creates what is missing.

The SPAs cannot be built on Windows; CI builds them on ubuntu.

---

## Admin panel

Pages live in `artifacts/admin/`, served under `/admin/`, gated by `admin_users`:
Dashboard, Products, Categories, Orders, Discounts, Customers.

Added this round:

- **Categories** — a real `categories` table behind the free-text `products.category` slug. Create, rename (moves every product on it, in one transaction), reorder, hide, delete (clears the slug from its products; they stay on sale). Slugs already in use by products but with no category row are surfaced for adoption.
- **Customer editing** — name, email and role are editable; order history and saved addresses are on the profile; an admin can set a customer's password directly. Changing an email moves that customer's orders and discount redemptions with it, because both are keyed by `customer_email` rather than by user id.
- **Product images** — upload from the product list. Stored on disk under `MEDIA_DIR`, content-addressed by sha256, served from `GET /api/assets/:key` with an immutable cache header. Type comes from the file's magic bytes, not the `Content-Type` header, and the cap is 5MB.

Two things worth knowing before touching this code:

- `POST /api/admin/products/{id}/image` is in `openapi.yaml`, but **do not call the generated `useAdminUploadProductImage`** — Orval emits `body: JSON.stringify(blob)` for a binary body, which uploads `"{}"`. Use `uploadProductImage` in `artifacts/admin/src/lib/media.ts`.
- Nothing deletes from the media store. Keys are content-addressed, so two products given the same file share one entry; removing an image only nulls `image_key`.

## Commits this round

```
bf66283  Drop "Laboratories" from the company name and the footer email
e54864c  Replace placeholder contact details with the real warehouse address
8a6f03d  Read API_BASE_URL from a variable or a secret, and fail without it
7d837d6  Move support links into a footer column and use the live domain for email
e3f2f07  Add a refund and return policy page
5b37859  Add catalog migration and schema maintenance scripts
9870b36  Own the product catalog in the database instead of Stripe
```

### What the refactor changed

Products and prices were Stripe objects mirrored into a `stripe.*` schema by `stripe-replit-sync`. They are ordinary Drizzle tables now and the database is authoritative; Stripe is only a payment processor and holds no product or price records.

- Checkout sends inline `price_data`, priced server-side from the catalog. The client sends price ids and quantities, never an amount. Inactive prices and delisted products are excluded, so a stale cart fails rather than buying something withdrawn.
- `price_data` makes Stripe mint a throwaway product per line item, so the real catalog ids ride in `product_data.metadata` and the webhook reads them back.
- Webhook signatures verified locally via `stripe.webhooks.constructEvent`.
- Admin CRUD writes to the tables directly; the 500ms "wait for webhook sync" sleeps are gone.
- Product queries are parameterised Drizzle instead of `sql.raw` with the category query param interpolated behind a hand-rolled quote escape.

This also fixed a latent bug: checkout previously sent `price: priceId` to Stripe, which had no such price, so **every checkout would have failed** with "No such price". The Replit app at `health-commerce.replit.app` still has it.

### Traps worth remembering

- Catalog sorts newest-first, so anything writing product rows must set `created_at` descending or the storefront order reverses.
- A working `/api/products` proves almost nothing. This database was missing 6 of its 8 tables while the catalog served fine — admin login, registration and order recording were all broken, silently.
- `apex-cosmetics.com/api/products` returning HTML is **expected**. There is no API on that origin; the SWA's `navigationFallback` serves `index.html`.
