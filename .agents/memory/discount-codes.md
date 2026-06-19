---
name: Discount codes (Stripe + local enforcement)
description: How discount/promo codes work in Apex Health and the non-obvious enforcement constraints
---

# Discount codes

Codes live in Stripe (Coupon + Promotion Code). Admin creates/lists/deactivates; storefront applies on the cart page (preview) and enforces at checkout. Each code carries `metadata.limit_model` of `per_customer` | `first_time` | `global`.

## Who enforces what
- `global` (max_redemptions) and `first_time` (restrictions.first_time_transaction) are enforced **by Stripe**. Do NOT track these locally.
- `per_customer` ("strict once per customer") is **not native to Stripe** → enforced locally via the `discount_redemptions` table. ONLY per_customer redemptions are ever written to that table.

## per_customer enforcement (the tricky part)
**Rule:** enforcement must happen atomically at checkout *session creation*, not on the completion webhook. Checking-at-checkout but writing-only-on-webhook is a TOCTOU race (concurrent sessions all pass the read).

**How to apply:**
- `discount_redemptions` has a unique index on `(promotion_code_id, email)`; emails are stored **lowercased** so the plain index is case-insensitive.
- checkout route: require `customerEmail`, then `reserveDiscountRedemption` = `INSERT ... ON CONFLICT DO NOTHING ... RETURNING id`. Empty return = already used → reject. This reservation is the atomic gate.
- Set checkout session `expires_at` (30 min) so an abandoned reservation is released promptly.
- If `stripe.checkout.sessions.create` throws after reserving, release the reservation.
- Webhook `checkout.session.completed` → finalize (attach orderId), gated on `metadata.limitModel === "per_customer"`.
- Webhook `checkout.session.expired` / `async_payment_failed` → release the reservation (`orderId IS NULL`) so abandoned checkouts don't lock the customer out.

**Why:** the architect review failed twice before this design — first on a no-email bypass, then on the TOCTOU race. The reservation + DB unique index is what makes it correct under concurrency.

**Residual risk / possible follow-up:** if Stripe webhooks repeatedly fail to deliver, a stale `orderId IS NULL` reservation can block reuse. A periodic reaper for reservations older than ~24h would harden this.

## Drizzle gotcha
`onConflictDoNothing({ target })` accepts **columns only**, not SQL expressions. That's why email is normalized to lowercase on write and the unique index is on the plain `email` column (not `lower(email)`).
