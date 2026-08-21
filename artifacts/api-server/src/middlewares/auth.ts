import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { verifyCustomerSession, CUSTOMER_COOKIE } from "../lib/customerAuth";
import type { User } from "@workspace/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      localUser?: User;
    }
  }
}

/**
 * Resolve the signed-in customer from the session cookie.
 * Returns null when the request is unauthenticated or the user no longer exists.
 */
export async function resolveLocalUser(req: Request): Promise<User | null> {
  const token = req.cookies?.[CUSTOMER_COOKIE] as string | undefined;
  const userId = verifyCustomerSession(token);
  if (!userId) return null;

  return storage.getUser(userId);
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
