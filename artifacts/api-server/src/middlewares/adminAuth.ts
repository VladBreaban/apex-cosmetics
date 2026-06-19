import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { verifySession, ADMIN_COOKIE } from "../lib/adminAuth";
import type { AdminUser } from "@workspace/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      adminUser?: AdminUser;
    }
  }
}

export const requireAdminSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.[ADMIN_COOKIE] as string | undefined;
    const adminId = verifySession(token);
    if (!adminId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const admin = await storage.getAdminUserById(adminId);
    if (!admin) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.adminUser = admin;
    next();
  } catch (err) {
    req.log?.error({ err }, "requireAdminSession failed");
    res.status(401).json({ error: "Unauthorized" });
  }
};
