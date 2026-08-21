import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./webhookHandlers";
import { mountSpas } from "./middlewares/staticSpa";

const app: Express = express();

// TLS is terminated upstream (Azure Container Apps ingress, Replit router),
// so trust the proxy hop for req.protocol / req.ip and x-forwarded-* handling.
app.set("trust proxy", 1);

// Stripe webhook MUST be registered before express.json() — it needs raw Buffer
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res): Promise<void> => {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }

    const sig = Array.isArray(signature) ? signature[0] : signature;

    if (!Buffer.isBuffer(req.body)) {
      logger.error("Webhook body is not a Buffer — express.json() ran first");
      res.status(500).json({ error: "Webhook processing error" });
      return;
    }

    try {
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (err: any) {
      logger.error({ err }, "Webhook processing failed");
      res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Cross-origin deployments (SPAs on Static Web Apps, API on App Service) send
// credentialed requests, so the allowlist must be explicit: reflecting any
// origin while cookies are SameSite=None would let any site call this API as a
// signed-in user. CORS_ALLOWED_ORIGINS is a comma-separated list of origins.
// With none configured we fall back to reflecting the request origin, which is
// only safe because that pairs with SameSite=Lax cookies (see lib/cookieConfig).
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // Same-origin and server-to-server requests carry no Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin.replace(/\/+$/, ""))) {
        return callback(null, true);
      }
      // Reject by declining the origin rather than erroring, so the browser
      // gets a clean CORS failure instead of a 500.
      return callback(null, false);
    },
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Static SPAs come last so /api always wins.
mountSpas(app);

export default app;
