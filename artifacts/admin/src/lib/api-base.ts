import { setBaseUrl } from "@workspace/api-client-react";

/**
 * Where the API lives, relative to this bundle.
 *
 * Empty for same-origin deployments (the API server serves this bundle, or a
 * proxy forwards /api to it). Set to the API's own origin — e.g.
 * https://apex-cosmetics-prod-api-....azurewebsites.net — when the SPA is
 * hosted separately, as on Azure Static Web Apps.
 *
 * Baked in at build time by Vite, so it is a deploy-time decision, not runtime.
 */
const raw = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

export const API_BASE = raw.replace(/\/+$/, "");

// Teaches the generated API client to prefix relative paths. Passing null keeps
// the existing same-origin behaviour.
setBaseUrl(API_BASE || null);

/** Absolute URL for a hand-written fetch (the generated client handles itself). */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
