import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { storage } from "../storage";
import {
  hashPassword,
  verifyPassword,
  signCustomerSession,
  CUSTOMER_COOKIE,
} from "../lib/customerAuth";
import { requireAuth } from "../middlewares/auth";
import { sessionCookieOptions } from "../lib/cookieConfig";
import type { User } from "@workspace/db";

const router: IRouter = Router();

const cookieOptions = sessionCookieOptions(1000 * 60 * 60 * 24 * 30); // 30 days

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200;

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    role: user.role,
  };
}

function parseCredentials(
  body: unknown,
): { email: string; password: string; name?: string } | null {
  const b = (body ?? {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const rawName = typeof b.name === "string" ? b.name.trim() : "";

  // Deliberately permissive: the real check is that a confirmation email can
  // reach it, and over-strict regexes reject valid addresses.
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email) || email.length > 254) {
    return null;
  }
  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
    return null;
  }

  return { email, password, name: rawName || undefined };
}

router.post("/auth/signup", async (req, res): Promise<void> => {
  const creds = parseCredentials(req.body);
  if (!creds) {
    res.status(400).json({
      error: `Enter a valid email and a password of at least ${MIN_PASSWORD} characters.`,
    });
    return;
  }

  const existing = await storage.getUserByEmail(creds.email);

  // A row already exists for this email. If it has no password it was created
  // during guest checkout, so let the owner claim it — this preserves their
  // order history instead of stranding it on an unreachable record.
  if (existing) {
    if (existing.passwordHash) {
      res.status(409).json({
        error: "An account with that email already exists. Please sign in.",
      });
      return;
    }

    const claimed = await storage.setUserPassword(
      existing.id,
      hashPassword(creds.password),
      creds.name ?? existing.name ?? undefined,
    );
    if (!claimed) {
      res.status(500).json({ error: "Could not create your account." });
      return;
    }

    res.cookie(CUSTOMER_COOKIE, signCustomerSession(claimed.id), cookieOptions);
    res.status(201).json(publicUser(claimed));
    return;
  }

  const user = await storage.createUser({
    id: randomUUID(),
    email: creds.email,
    name: creds.name,
    passwordHash: hashPassword(creds.password),
  });
  if (!user) {
    res.status(500).json({ error: "Could not create your account." });
    return;
  }

  res.cookie(CUSTOMER_COOKIE, signCustomerSession(user.id), cookieOptions);
  res.status(201).json(publicUser(user));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const creds = parseCredentials(req.body);
  // Same generic message for malformed input and wrong credentials, so the
  // endpoint does not reveal which emails are registered.
  const invalid = { error: "Invalid email or password." };
  if (!creds) {
    res.status(401).json(invalid);
    return;
  }

  const user = await storage.getUserByEmail(creds.email);
  if (!user?.passwordHash || !verifyPassword(creds.password, user.passwordHash)) {
    res.status(401).json(invalid);
    return;
  }

  res.cookie(CUSTOMER_COOKIE, signCustomerSession(user.id), cookieOptions);
  res.json(publicUser(user));
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.clearCookie(CUSTOMER_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

router.get("/auth/session", requireAuth, async (req, res): Promise<void> => {
  res.json(publicUser(req.localUser!));
});

export default router;
