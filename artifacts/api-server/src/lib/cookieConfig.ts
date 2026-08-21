import type { CookieOptions } from "express";

/**
 * Shared cookie policy for the customer and admin session cookies.
 *
 * Two deployment shapes are supported:
 *
 *  - Same-origin (SPAs served by this server, or proxied to it). SameSite=Lax
 *    is correct and gives CSRF protection for free.
 *  - Cross-origin (SPAs on Static Web Apps calling this API on its own
 *    hostname). Browsers refuse to send a Lax cookie on a cross-site request,
 *    so the cookie must be SameSite=None — which browsers only accept when it
 *    is also Secure, i.e. over HTTPS.
 *
 * Set CROSS_SITE_COOKIES=true for the second shape. It is opt-in because
 * SameSite=None gives up the CSRF protection Lax provides; the mitigations are
 * the CORS allowlist in app.ts and the fact that every mutating endpoint takes
 * application/json, which forces a preflight that a cross-site form cannot
 * satisfy.
 */
export function isCrossSite(): boolean {
  return process.env.CROSS_SITE_COOKIES === "true";
}

export function sessionCookieOptions(maxAgeMs: number): CookieOptions {
  const crossSite = isCrossSite();
  // SameSite=None is invalid without Secure — browsers drop such cookies
  // outright, so cross-site mode implies Secure regardless of NODE_ENV.
  const secure = crossSite || process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure,
    sameSite: crossSite ? "none" : "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}
