import { Router, type IRouter } from "express";
import type Stripe from "stripe";
import { getUncachableStripeClient } from "../stripeClient";
import { getBaseUrlForRequest } from "../lib/publicUrl";
import { storage } from "../storage";
import { CreateCheckoutBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/checkout", async (req, res): Promise<void> => {
  const parsed = CreateCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, customerEmail, successUrl, cancelUrl, promotionCode } =
    parsed.data;

  if (!items || items.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  // Price the cart from the database. The client sends price ids and
  // quantities only — never amounts — so a tampered cart cannot change what is
  // charged. Inactive prices and delisted products are excluded by the query,
  // so a stale cart fails here rather than selling something withdrawn.
  const priced = await storage.getPurchasablePrices(
    items.map((item) => item.priceId),
  );
  const byPriceId = new Map(priced.map((row) => [row.priceId, row]));

  const unavailable = items.filter((item) => !byPriceId.has(item.priceId));
  if (unavailable.length > 0) {
    res.status(400).json({
      error:
        "Some items in your cart are no longer available. Please refresh and try again.",
    });
    return;
  }

  // Stripe requires every line item in a session to share one currency.
  const currencies = new Set(priced.map((row) => row.currency));
  if (currencies.size > 1) {
    res
      .status(400)
      .json({ error: "All items in an order must share the same currency" });
    return;
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item) => {
      const row = byPriceId.get(item.priceId)!;
      return {
        quantity: item.quantity,
        price_data: {
          currency: row.currency,
          unit_amount: row.unitAmount,
          product_data: {
            name: row.productName,
            ...(row.productDescription
              ? { description: row.productDescription }
              : {}),
            // Carried back on the completed-checkout webhook so the order rows
            // record our catalog ids, not the ad-hoc ones Stripe mints.
            metadata: {
              productId: row.productId,
              priceId: row.priceId,
            },
          },
        },
      };
    },
  );

  const stripe = await getUncachableStripeClient();

  const baseUrl = getBaseUrlForRequest(req);

  // Resolve and re-validate any applied promotion code server-side.
  const metadata: Record<string, string> = {
    source: "apex-health-storefront",
  };
  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  let reservedPerCustomer: { promotionCodeId: string; email: string } | null =
    null;

  if (promotionCode) {
    let promo: Stripe.PromotionCode;
    try {
      promo = await stripe.promotionCodes.retrieve(promotionCode);
    } catch {
      res.status(400).json({ error: "Invalid discount code" });
      return;
    }

    if (!promo.active) {
      res.status(400).json({ error: "This discount code is no longer active" });
      return;
    }

    // Strict once-per-customer codes require an identifiable customer and are
    // enforced authoritatively here via an atomic reservation.
    if (promo.metadata?.limit_model === "per_customer") {
      if (!customerEmail) {
        res.status(400).json({
          error: "An email address is required to use this discount code",
        });
        return;
      }
      const reserved = await storage.reserveDiscountRedemption({
        promotionCodeId: promo.id,
        code: promo.code,
        email: customerEmail,
        userId: null,
      });
      if (!reserved) {
        res.status(400).json({ error: "You've already used this code" });
        return;
      }
      reservedPerCustomer = { promotionCodeId: promo.id, email: customerEmail };
      metadata.limitModel = "per_customer";
    }

    discounts = [{ promotion_code: promo.id }];
    metadata.promotionCodeId = promo.id;
    metadata.discountCode = promo.code;
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      // Limit how long an abandoned per-customer reservation stays held before
      // the checkout.session.expired webhook releases it (Stripe min is 30 min).
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      customer_email: customerEmail ?? undefined,
      ...(discounts ? { discounts } : {}),
      success_url:
        successUrl ??
        `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${baseUrl}/checkout/cancel`,
      metadata,
    });
  } catch (err) {
    // Roll back the reservation if the session could not be created.
    if (reservedPerCustomer) {
      await storage
        .releaseDiscountReservation(reservedPerCustomer)
        .catch(() => undefined);
    }
    throw err;
  }

  res.json({ url: session.url, sessionId: session.id });
});

export default router;
