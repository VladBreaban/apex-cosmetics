import app from "./app";
import { logger } from "./lib/logger";
import { storage } from "./storage";
import { randomBytes } from "node:crypto";
import { hashPassword } from "./lib/adminAuth";
import { getConfiguredBaseUrl } from "./lib/publicUrl";

async function seedAdmin() {
  const existing = await storage.countAdminUsers();
  if (existing > 0) return;

  const username = process.env.ADMIN_INITIAL_USERNAME ?? "admin";
  const envPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const password = envPassword ?? randomBytes(9).toString("base64url");
  await storage.createAdminUser(username, hashPassword(password));
  if (envPassword) {
    logger.info(
      { username },
      "Seeded admin user using ADMIN_INITIAL_PASSWORD",
    );
  } else {
    logger.warn(
      { username, generatedPassword: password },
      "Seeded admin with a GENERATED password (shown once). Set ADMIN_INITIAL_PASSWORD to choose your own.",
    );
  }
}

/**
 * Report how Stripe is wired without touching the catalog.
 *
 * The database owns products and prices now, so there is no schema to migrate
 * and nothing to backfill from Stripe. Webhook endpoints are registered in the
 * Stripe dashboard rather than on boot: auto-registration mints a fresh signing
 * secret that a running process cannot write back into its own environment, so
 * it would leave STRIPE_WEBHOOK_SECRET stale and every event failing signature
 * verification.
 */
function reportStripeConfig(): void {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    logger.warn(
      "STRIPE_SECRET_KEY not set — the catalog still serves from the database, " +
        "but checkout will fail until it is configured.",
    );
    return;
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
    logger.warn(
      "STRIPE_WEBHOOK_SECRET not set — checkout sessions can be created, but " +
        "completed payments will not produce orders because webhook signatures " +
        "cannot be verified.",
    );
  }

  const baseUrl = getConfiguredBaseUrl();
  if (baseUrl) {
    logger.info(
      { webhookUrl: `${baseUrl}/api/stripe/webhook` },
      "Stripe configured. Register this webhook URL in the Stripe dashboard " +
        "for checkout.session.completed, .expired and .async_payment_failed.",
    );
  } else {
    logger.warn(
      "PUBLIC_BASE_URL not set — cannot report the webhook URL to register.",
    );
  }
}

const rawPort = process.env["PORT"];
if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

reportStripeConfig();

try {
  await seedAdmin();
} catch (err) {
  logger.error({ err }, "Admin seed failed");
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
