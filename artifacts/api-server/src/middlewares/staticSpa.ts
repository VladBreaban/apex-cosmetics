/**
 * Serves the two built Vite SPAs from the API server so the whole app lives on
 * a single origin.
 *
 * Same-origin is a hard requirement, not a convenience:
 *  - the generated API client calls relative `/api/...` paths
 *  - the admin session cookie is SameSite=Lax, so it is not sent cross-site
 *  - Clerk's Frontend API is proxied through this server at /api/__clerk
 *
 * On Replit this stitching was done by the platform router. Everywhere else
 * (Azure Container Apps, `pnpm start` locally) it happens here.
 *
 * The admin bundle must be built with BASE_PATH=/admin/ and the storefront
 * with BASE_PATH=/ so their asset URLs line up with these mounts.
 */

import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../lib/logger";

// After esbuild bundling this resolves to artifacts/api-server/dist.
const serverDir = path.dirname(fileURLToPath(import.meta.url));

type SpaMount = {
  /** URL prefix this SPA is served under. */
  mount: string;
  /** Directory holding the built index.html + assets. */
  dir: string;
  name: string;
};

function resolveDir(envVar: string, fallbackRelative: string): string {
  const override = process.env[envVar]?.trim();
  return override
    ? path.resolve(override)
    : path.resolve(serverDir, fallbackRelative);
}

/**
 * Mount order matters: /admin is registered before / so the storefront's
 * catch-all does not swallow admin routes.
 */
export function mountSpas(app: Express): void {
  const mounts: SpaMount[] = [
    {
      name: "admin",
      mount: "/admin",
      dir: resolveDir("ADMIN_DIST", "../../admin/dist/public"),
    },
    {
      name: "storefront",
      mount: "/",
      dir: resolveDir("STOREFRONT_DIST", "../../storefront/dist/public"),
    },
  ];

  const available = mounts.filter((spa) => {
    const indexPath = path.join(spa.dir, "index.html");
    if (fs.existsSync(indexPath)) return true;
    logger.warn(
      { spa: spa.name, dir: spa.dir },
      "SPA bundle not found — skipping static mount. Build it first, or set " +
        `${spa.name === "admin" ? "ADMIN_DIST" : "STOREFRONT_DIST"}.`,
    );
    return false;
  });

  for (const spa of available) {
    // index:false so directory requests fall through to the SPA fallback
    // below, which is the only place index.html is served (always revalidated).
    app.use(
      spa.mount,
      express.static(spa.dir, {
        index: false,
        // Without this, a request for "/admin" 301s to "/admin/". The SPA
        // fallback below serves it directly instead, matching how Static Web
        // Apps rewrites /admin to /admin/index.html.
        redirect: false,
        setHeaders(res, filePath) {
          // Vite emits content-hashed filenames under assets/, so those are
          // safe to cache forever. Everything else stays revalidated.
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          } else {
            res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
          }
        },
      }),
    );
    logger.info({ spa: spa.name, mount: spa.mount, dir: spa.dir }, "Serving SPA");
  }

  if (available.length === 0) return;

  const adminSpa = available.find((s) => s.name === "admin");
  const storefrontSpa = available.find((s) => s.name === "storefront");

  // History-API fallback. Registered as plain middleware rather than a route
  // pattern because Express 5 (path-to-regexp v8) no longer accepts "*".
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    // Never hijack the API surface — unknown /api paths must still 404 as JSON.
    if (req.path === "/api" || req.path.startsWith("/api/")) return next();
    // Let a genuinely missing asset 404 instead of returning index.html,
    // which would otherwise surface as a confusing MIME-type error.
    if (path.extname(req.path)) return next();

    const isAdmin = req.path === "/admin" || req.path.startsWith("/admin/");
    const spa = isAdmin ? (adminSpa ?? storefrontSpa) : storefrontSpa;
    if (!spa) return next();

    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.sendFile(path.join(spa.dir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}
