---
name: Admin auth design
description: Why the admin panel uses custom locked-signup auth instead of Clerk, and the rules to keep it secure.
---

# Admin auth (custom, locked signups)

The admin panel (`/admin/`) does NOT use Clerk. It uses a dependency-free signed
session cookie (HMAC via `SESSION_SECRET`) + scrypt password hashing, backed by an
`admin_users` table. The storefront customer auth still uses Clerk — keep them separate.

**Rule: admin signups are locked.** Once at least one admin exists, creating a new
admin account requires a valid `ADMIN_SIGNUP_CODE` invite code (constant-time compared).
If `ADMIN_SIGNUP_CODE` is unset, signups are disabled entirely. One admin is auto-seeded
on startup using `ADMIN_INITIAL_PASSWORD` (random + logged once if unset).

**Why:** An open `/admin/auth/signup` endpoint lets any internet visitor self-grant admin
on the published store — a critical access-control flaw flagged in review. The user
explicitly chose "locked" mode over open or first-run-only signup. Never weaken this to
open signup without an explicit, informed request.

**How to apply:** Keep `adminAuthRouter` mounted BEFORE `adminRouter` so `/admin/auth/*`
stays ungated. Never reintroduce a hardcoded default password (e.g. `admin123`) — the repo
is shared, so a known credential is a live takeover path. Gate any new admin-creation path
behind the same invite-code/bootstrap check.
