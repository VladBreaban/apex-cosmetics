import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient";
import app from "./app";
import { logger } from "./lib/logger";
import { storage } from "./storage";
import { hashPassword } from "./lib/adminAuth";

async function seedAdmin() {
  const existing = await storage.countAdminUsers();
  if (existing > 0) return;

  const username = process.env.ADMIN_INITIAL_USERNAME ?? "admin";
  const password = process.env.ADMIN_INITIAL_PASSWORD ?? "admin123";
  await storage.createAdminUser(username, hashPassword(password));
  logger.info(
    { username },
    "Seeded default admin user — change the password by signing up your own account",
  );
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

  const domains = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domains) {
    const webhookUrl = `https://${domains}/api/stripe/webhook`;
    logger.info({ webhookUrl }, "Setting up managed webhook");
    await stripeSync.findOrCreateManagedWebhook(webhookUrl);
    logger.info("Webhook configured");
  } else {
    logger.warn("REPLIT_DOMAINS not set — skipping webhook registration");
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
