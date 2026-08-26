import Stripe from "stripe";

type StripeCredentials = {
  secretKey: string;
  webhookSecret?: string;
};

/**
 * Read Stripe credentials from the environment.
 *
 * This is the path used everywhere outside Replit (Azure Container Apps,
 * local dev, CI). Returns null when STRIPE_SECRET_KEY is unset so the caller
 * can fall back to the Replit connector.
 */
function credentialsFromEnv(): StripeCredentials | null {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return null;

  return {
    secretKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || undefined,
  };
}

/**
 * Read Stripe credentials from the Replit connectors API.
 *
 * Only usable inside a Replit repl/deployment, where REPLIT_CONNECTORS_HOSTNAME
 * and an identity token are injected. Kept so the project still runs on Replit
 * unchanged; env vars take precedence when both are available.
 */
async function credentialsFromReplitConnector(): Promise<StripeCredentials> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY (and optionally " +
        "STRIPE_WEBHOOK_SECRET), or run inside Replit with the Stripe " +
        "integration connected via the Integrations tab.",
    );
  }

  const resp = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
    {
      headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!resp.ok) {
    throw new Error(
      `Failed to fetch Stripe credentials: ${resp.status} ${resp.statusText}`,
    );
  }

  const data = (await resp.json()) as {
    items?: Array<{
      settings?: { secret_key?: string; webhook_secret?: string };
    }>;
  };
  const settings = data.items?.[0]?.settings;

  if (!settings?.secret_key) {
    throw new Error(
      "Stripe integration not connected or missing secret key. " +
        "Connect Stripe via the Integrations tab first.",
    );
  }

  return {
    secretKey: settings.secret_key,
    webhookSecret: settings.webhook_secret,
  };
}

async function getStripeCredentials(): Promise<StripeCredentials> {
  return credentialsFromEnv() ?? (await credentialsFromReplitConnector());
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey);
}

export async function getUncachableStripeWebhookSecret(): Promise<string> {
  const { webhookSecret } = await getStripeCredentials();
  if (!webhookSecret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set. Webhook signatures cannot be " +
        "verified, so incoming events are rejected.",
    );
  }
  return webhookSecret;
}
