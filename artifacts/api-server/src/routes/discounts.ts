import { Router, type IRouter } from "express";
import type Stripe from "stripe";
import { storage } from "../storage";
import { getUncachableStripeClient } from "../stripeClient";
import { requireAdmin } from "../middlewares/auth";
import {
  ValidateDiscountBody,
  AdminCreateDiscountBody,
  AdminDeactivateDiscountParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

type LimitModel = "per_customer" | "first_time" | "global";

function couponOf(promo: Stripe.PromotionCode): Stripe.Coupon | null {
  const c = promo.promotion?.coupon;
  return typeof c === "object" && c !== null ? c : null;
}

function toDiscount(promo: Stripe.PromotionCode) {
  const coupon = couponOf(promo);
  const limitModel = (promo.metadata?.limit_model as LimitModel) ?? "global";
  return {
    id: promo.id,
    code: promo.code,
    active: promo.active,
    discountType: coupon?.percent_off != null ? "percentage" : "fixed",
    percentOff: coupon?.percent_off ?? null,
    amountOff: coupon?.amount_off ?? null,
    currency: coupon?.currency ?? null,
    limitModel,
    maxRedemptions: promo.max_redemptions ?? null,
    timesRedeemed: promo.times_redeemed ?? 0,
    minimumAmount: promo.restrictions?.minimum_amount ?? null,
    expiresAt: promo.expires_at
      ? new Date(promo.expires_at * 1000).toISOString()
      : null,
    createdAt: promo.created
      ? new Date(promo.created * 1000).toISOString()
      : null,
  };
}

// Public — validate a code against the current cart subtotal
router.post("/discounts/validate", async (req, res): Promise<void> => {
  const parsed = ValidateDiscountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { code, subtotal, email } = parsed.data;

  const invalid = (reason: string) => {
    res.json({
      valid: false,
      code: null,
      promotionCodeId: null,
      discountType: null,
      amountOff: null,
      description: null,
      reason,
    });
  };

  try {
    const stripe = await getUncachableStripeClient();
    const promos = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
      expand: ["data.promotion.coupon"],
    });
    const promo = promos.data[0];

    if (!promo) {
      invalid("Invalid or expired code");
      return;
    }

    if (promo.expires_at && promo.expires_at * 1000 < Date.now()) {
      invalid("This code has expired");
      return;
    }

    if (
      promo.max_redemptions != null &&
      (promo.times_redeemed ?? 0) >= promo.max_redemptions
    ) {
      invalid("This code has reached its usage limit");
      return;
    }

    const min = promo.restrictions?.minimum_amount;
    if (min != null && subtotal < min) {
      invalid(`Requires a minimum order of $${(min / 100).toFixed(2)}`);
      return;
    }

    // Strict once-per-customer: if we know the customer (logged in), check now
    // for a better cart preview. Final enforcement happens at checkout where an
    // email is always required for this model.
    const limitModel = (promo.metadata?.limit_model as LimitModel) ?? "global";
    if (
      limitModel === "per_customer" &&
      email &&
      (await storage.hasCustomerRedeemed(promo.id, email))
    ) {
      invalid("You've already used this code");
      return;
    }

    const coupon = couponOf(promo);
    let amountOff = 0;
    if (coupon?.percent_off != null) {
      amountOff = Math.round((subtotal * coupon.percent_off) / 100);
    } else if (coupon?.amount_off != null) {
      amountOff = Math.min(coupon.amount_off, subtotal);
    }

    const description =
      coupon?.percent_off != null
        ? `${coupon.percent_off}% off`
        : `$${((coupon?.amount_off ?? 0) / 100).toFixed(2)} off`;

    res.json({
      valid: true,
      code: promo.code,
      promotionCodeId: promo.id,
      discountType: coupon?.percent_off != null ? "percentage" : "fixed",
      amountOff,
      description,
      reason: null,
    });
  } catch (err) {
    req.log?.error({ err }, "Discount validation failed");
    res.status(500).json({ error: "Unable to validate code right now" });
  }
});

// Admin — list discount codes
router.get("/admin/discounts", requireAdmin, async (_req, res): Promise<void> => {
  const stripe = await getUncachableStripeClient();
  const promos = await stripe.promotionCodes.list({
    limit: 100,
    expand: ["data.promotion.coupon"],
  });
  res.json({ data: promos.data.map(toDiscount) });
});

// Admin — create a discount code
router.post(
  "/admin/discounts",
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = AdminCreateDiscountBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const {
      code,
      discountType,
      percentOff,
      amountOff,
      currency,
      limitModel,
      maxRedemptions,
      minimumAmount,
      expiresAt,
    } = parsed.data;

    if (discountType === "percentage" && (percentOff == null || percentOff <= 0)) {
      res
        .status(400)
        .json({ error: "percentOff is required for percentage discounts" });
      return;
    }
    if (discountType === "fixed" && (amountOff == null || amountOff <= 0)) {
      res
        .status(400)
        .json({ error: "amountOff is required for fixed discounts" });
      return;
    }

    const curr = currency ?? "usd";
    const stripe = await getUncachableStripeClient();

    const couponParams: Stripe.CouponCreateParams = { duration: "once" };
    if (discountType === "percentage") {
      couponParams.percent_off = percentOff!;
    } else {
      couponParams.amount_off = amountOff!;
      couponParams.currency = curr;
    }
    const coupon = await stripe.coupons.create(couponParams);

    const restrictions: Stripe.PromotionCodeCreateParams.Restrictions = {};
    if (minimumAmount != null && minimumAmount > 0) {
      restrictions.minimum_amount = minimumAmount;
      restrictions.minimum_amount_currency = curr;
    }
    if (limitModel === "first_time") {
      restrictions.first_time_transaction = true;
    }

    const promoParams: Stripe.PromotionCodeCreateParams = {
      promotion: { type: "coupon", coupon: coupon.id },
      code,
      metadata: { limit_model: limitModel },
    };
    if (maxRedemptions != null && maxRedemptions > 0) {
      promoParams.max_redemptions = maxRedemptions;
    }
    if (expiresAt) {
      promoParams.expires_at = Math.floor(new Date(expiresAt).getTime() / 1000);
    }
    if (Object.keys(restrictions).length > 0) {
      promoParams.restrictions = restrictions;
    }

    const promo = await stripe.promotionCodes.create(promoParams);
    res.status(201).json(toDiscount(promo));
  },
);

// Admin — deactivate a discount code
router.delete(
  "/admin/discounts/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = AdminDeactivateDiscountParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const stripe = await getUncachableStripeClient();
    try {
      await stripe.promotionCodes.update(params.data.id, {
        active: false,
      });
      const promo = await stripe.promotionCodes.retrieve(params.data.id, {
        expand: ["promotion.coupon"],
      });
      res.json(toDiscount(promo));
    } catch {
      res.status(404).json({ error: "Discount not found" });
    }
  },
);

export default router;
