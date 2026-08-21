import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient";
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

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  logger.info("Initializing Stripe schema...");
  await runMigrations({ databaseUrl });
  logger.info("Stripe schema ready");

  const stripeSync = await getStripeSync();

  const baseUrl = getConfiguredBaseUrl();
  if (baseUrl) {
    const webhookUrl = `${baseUrl}/api/stripe/webhook`;
    logger.info({ webhookUrl }, "Setting up managed webhook");
    await stripeSync.findOrCreateManagedWebhook(webhookUrl);
    logger.info("Webhook configured");
  } else {
    logger.warn(
      "PUBLIC_BASE_URL not set — skipping webhook registration. Register the " +
        "Stripe webhook manually against <public origin>/api/stripe/webhook.",
    );
  }

  logger.info("Starting Stripe data backfill...");
  stripeSync
    .syncBackfill()
    .then(() => logger.info("Stripe data backfill complete"))
    .catch((err) => logger.error({ err }, "Stripe backfill error"));
}

const rawPort = process.env["PORT"];
if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

try {
  await initStripe();
} catch (err) {
  logger.error({ err }, "Stripe initialization failed — server will start without Stripe");
}

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
