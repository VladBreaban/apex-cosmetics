import { Router, type IRouter, type CookieOptions } from "express";
import { storage } from "../storage";
import {
  hashPassword,
  verifyPassword,
  signSession,
  inviteCodeValid,
  ADMIN_COOKIE,
} from "../lib/adminAuth";
import { requireAdminSession } from "../middlewares/adminAuth";

const router: IRouter = Router();

const isProd = process.env.NODE_ENV === "production";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

function parseCredentials(
  body: unknown,
): { username: string; password: string } | null {
  const b = (body ?? {}) as Record<string, unknown>;
  const username = typeof b.username === "string" ? b.username.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";
  if (username.length < 3 || username.length > 50) return null;
  if (password.length < 6 || password.length > 200) return null;
  return { username, password };
}

router.post("/admin/auth/signup", async (req, res): Promise<void> => {
  const creds = parseCredentials(req.body);
  if (!creds) {
    res.status(400).json({
      error: "Username must be at least 3 characters and password at least 6.",
    });
    return;
  }

  // Locked sign-ups: once at least one admin exists, new accounts require a
  // valid invite code (ADMIN_SIGNUP_CODE). The first-ever account (bootstrap)
  // is allowed without a code.
  const adminCount = await storage.countAdminUsers();
  if (adminCount > 0) {
    const code =
      typeof (req.body as Record<string, unknown>)?.inviteCode === "string"
        ? ((req.body as Record<string, unknown>).inviteCode as string)
        : "";
    if (!process.env.ADMIN_SIGNUP_CODE) {
      res
        .status(403)
        .json({ error: "Sign-ups are disabled. Ask an administrator for access." });
      return;
    }
    if (!inviteCodeValid(code)) {
      res.status(403).json({ error: "Invalid invite code." });
      return;
    }
  }

  const existing = await storage.getAdminUserByUsername(creds.username);
  if (existing) {
    res.status(409).json({ error: "That username is already taken." });
    return;
  }

  const admin = await storage.createAdminUser(
    creds.username,
    hashPassword(creds.password),
  );
  res.cookie(ADMIN_COOKIE, signSession(admin.id), cookieOptions);
  res.status(201).json({ id: admin.id, username: admin.username });
});

router.post("/admin/auth/login", async (req, res): Promise<void> => {
  const creds = parseCredentials(req.body);
  if (!creds) {
    res.status(400).json({ error: "Enter your username and password." });
    return;
  }

  const admin = await storage.getAdminUserByUsername(creds.username);
  if (!admin || !verifyPassword(creds.password, admin.passwordHash)) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  res.cookie(ADMIN_COOKIE, signSession(admin.id), cookieOptions);
  res.json({ id: admin.id, username: admin.username });
});

router.post("/admin/auth/logout", async (_req, res): Promise<void> => {
  res.clearCookie(ADMIN_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

router.get(
  "/admin/auth/session",
  requireAdminSession,
  async (req, res): Promise<void> => {
    const admin = req.adminUser!;
    res.json({ id: admin.id, username: admin.username });
  },
);

export default router;
