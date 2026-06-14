import { Router, type IRouter } from "express";
import { getUncachableStripeClient } from "../stripeClient";
import { CreateCheckoutBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/checkout", async (req, res): Promise<void> => {
  const parsed = CreateCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, customerEmail, successUrl, cancelUrl } = parsed.data;

  if (!items || items.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const stripe = await getUncachableStripeClient();

  const host =
    process.env.REPLIT_DOMAINS?.split(",")[0] ??
    req.get("host") ??
    "localhost";
  const baseUrl = `https://${host}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: items.map((item) => ({
      price: item.priceId,
      quantity: item.quantity,
    })),
    mode: "payment",
    customer_email: customerEmail ?? undefined,
    success_url:
      successUrl ??
      `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl ?? `${baseUrl}/checkout/cancel`,
    metadata: {
      source: "apex-health-storefront",
    },
  });

  res.json({ url: session.url, sessionId: session.id });
});

export default router;
