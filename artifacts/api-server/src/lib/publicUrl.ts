/**
 * Resolves the public, client-facing origin of this deployment.
 *
 * Precedence:
 *  1. PUBLIC_BASE_URL — set this in any non-Replit environment (Azure
 *     Container Apps, etc). Accepts a bare host or a full URL.
 *  2. REPLIT_DOMAINS — injected by Replit; first entry wins.
 *  3. The incoming request's host, when one is available.
 *
 * Used for Stripe checkout success/cancel URLs and webhook registration, both
 * of which must point at the real public origin rather than the container's
 * internal address.
 */

function normalize(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** The configured public origin, or null when only a request can supply it. */
export function getConfiguredBaseUrl(): string | null {
  const explicit = process.env.PUBLIC_BASE_URL;
  if (explicit?.trim()) return normalize(explicit);

  const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (replitDomain?.trim()) return normalize(replitDomain);

  return null;
}

/** The public origin, falling back to the host/proto of the given request. */
export function getBaseUrlForRequest(req: {
  get(name: string): string | undefined;
  protocol?: string;
}): string {
  const configured = getConfiguredBaseUrl();
  if (configured) return configured;

  const host = req.get("host") ?? "localhost";
  // Container Apps terminates TLS upstream; with `trust proxy` set, Express
  // derives req.protocol from x-forwarded-proto.
  const proto = req.protocol === "http" ? "http" : "https";
  return `${proto}://${host}`;
}
