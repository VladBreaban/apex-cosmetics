import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Storefront customer sessions.
 *
 * Deliberately the same shape as the admin session in ./adminAuth: a stateless
 * HMAC-signed cookie, scrypt password hashing, no third-party dependency. The
 * two are kept separate so a token minted for one audience can never satisfy
 * the other — see the `typ` claim below.
 */

export const CUSTOMER_COOKIE = "apex_customer_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SESSION_TYPE = "customer";

// Password hashing is identical for both audiences, so share one
// implementation rather than maintaining a second copy.
export { hashPassword, verifyPassword } from "./adminAuth";

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required for customer authentication");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

/**
 * Mint a session token for a customer. User ids are strings here (the admin
 * table uses a serial int), hence the separate implementation.
 */
export function signCustomerSession(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      typ: SESSION_TYPE,
      uid: userId,
      exp: Date.now() + SESSION_TTL_MS,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Returns the customer id carried by a valid, unexpired token, else null. */
export function verifyCustomerSession(
  token: string | undefined | null,
): string | null {
  if (!token) return null;

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(sign(payload));
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    // Reject admin tokens presented as customer tokens even though both are
    // signed with the same SESSION_SECRET.
    if (data.typ !== SESSION_TYPE) return null;
    if (typeof data.uid !== "string" || typeof data.exp !== "number") return null;
    if (Date.now() > data.exp) return null;
    return data.uid;
  } catch {
    return null;
  }
}
