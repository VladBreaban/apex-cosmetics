---
name: Order endpoint IDOR boundaries
description: Authorization rules for order-lookup endpoints to avoid leaking customer PII
---

Order-lookup endpoints carry customer PII and are easy to expose via IDOR.

**Rule:**
- Numeric/sequential order IDs are enumerable — a `GET /orders/:id` by number must
  require an authenticated owner (`order.userId === user.id`) or an admin, and
  should return 404 (not 403) on unauthorized access so order existence isn't leaked.
- Order history by email (`GET /customers/:email/orders`) must require auth and match
  the requester's own email (or admin).
- Only an unguessable Stripe Checkout Session ID (`cs_...`) lookup may stay public —
  it backs the post-checkout confirmation screen for guests with no account yet.

**Why:** a code review caught both legacy routes being fully public; sequential IDs
and email enumeration let anyone read others' orders, violating "customers see only
their own orders." Guest checkout still needs a public confirmation path, hence the
`cs_` carve-out.

**How to apply:** when adding any endpoint that returns order data, decide the
trust boundary first. Reuse `resolveLocalUser(req)` from `middlewares/auth.ts` for
inline ownership checks where a route is partly public (session id) and partly
gated (numeric id).
