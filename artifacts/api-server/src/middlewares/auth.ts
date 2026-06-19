import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { storage } from "../storage";
import type { User } from "@workspace/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      localUser?: User;
    }
  }
}

const DEFAULT_ADMIN_EMAILS = ["admin@apex-health.com"];

function adminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const merged = new Set([...DEFAULT_ADMIN_EMAILS, ...fromEnv]);
  return Array.from(merged);
}

function roleForEmail(email: string): "admin" | "customer" {
  return adminEmails().includes(email.toLowerCase()) ? "admin" : "customer";
}

/**
 * Resolve the authenticated Clerk user, fetch their profile, and JIT-provision
 * a local user row (assigning admin role via the ADMIN_EMAILS allowlist).
 * Returns null when the request is unauthenticated or has no usable email.
 */
export async function resolveLocalUser(req: Request): Promise<User | null> {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) return null;

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    undefined;

  return storage.provisionClerkUser({
    clerkUserId,
    email,
    name,
    role: roleForEmail(email),
  });
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await resolveLocalUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.localUser = user;
    next();
  } catch (err) {
    req.log?.error({ err }, "requireAuth failed");
    res.status(401).json({ error: "Unauthorized" });
  }
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await resolveLocalUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    req.localUser = user;
    next();
  } catch (err) {
    req.log?.error({ err }, "requireAdmin failed");
    res.status(401).json({ error: "Unauthorized" });
  }
};
