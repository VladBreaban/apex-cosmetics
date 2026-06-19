import { getStripeSync } from "./stripeClient";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./lib/logger";
import { storage } from "./storage";

export class WebhookHandlers {
  static async processWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
          "Received type: " +
          typeof payload +
          ". " +
          "This usually means express.json() parsed the body before reaching this handler. " +
          "FIX: Ensure webhook route is registered BEFORE app.use(express.json()).",
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Parse the event to handle order creation
    try {
      const event = JSON.parse(payload.toString());
      if (event.type === "checkout.session.completed") {
        await WebhookHandlers.handleCheckoutCompleted(event.data.object);
      } else if (
        event.type === "checkout.session.expired" ||
        event.type === "checkout.session.async_payment_failed"
      ) {
        await WebhookHandlers.handleCheckoutAbandoned(event.data.object);
      }
    } catch (err) {
      logger.warn({ err }, "Failed to parse webhook event for order creation");
    }
  }

  static async handleCheckoutCompleted(session: any): Promise<void> {
    try {
      const stripe = await import("./stripeClient").then((m) =>
        m.getUncachableStripeClient(),
      );

      // Retrieve line items
      const lineItems = await (
        await stripe
      ).checkout.sessions.listLineItems(session.id, { expand: ["data.price.product"] });

      const totalAmount = session.amount_total ?? 0;
      const currency = session.currency ?? "usd";
      const customerEmail =
        session.customer_details?.email ?? session.customer_email ?? "";
      const customerName = session.customer_details?.name ?? null;

      // Link the order to an existing user account when the buyer's email
      // matches one (covers signed-in customers; guest checkout stays null).
      let userId: string | null = null;
      if (customerEmail) {
        const existingUser = await storage.getUserByEmail(customerEmail);
        userId = existingUser?.id ?? null;
      }

      // Insert order
      const [order] = await db
        .insert(ordersTable)
        .values({
          stripeSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          userId,
          customerEmail,
          customerName,
          status: "paid",
          totalAmount,
          currency,
        })
        .onConflictDoNothing()
        .returning();

      if (!order) return; // already processed

      // Insert order items
      for (const item of lineItems.data) {
        const price = item.price as any;
        const product = price?.product as any;
        await db.insert(orderItemsTable).values({
          orderId: order.id,
          productId: product?.id ?? "unknown",
          productName: product?.name ?? item.description ?? "Product",
          priceId: price?.id ?? null,
          unitAmount: price?.unit_amount ?? 0,
          quantity: item.quantity ?? 1,
          currency: price?.currency ?? currency,
        });
      }

      // Finalize the strict once-per-customer reservation made at checkout by
      // attaching the completed order. Other limit models are enforced by Stripe
      // and are not tracked locally.
      const promotionCodeId = session.metadata?.promotionCodeId;
      if (
        promotionCodeId &&
        customerEmail &&
        session.metadata?.limitModel === "per_customer"
      ) {
        try {
          await storage.finalizeDiscountRedemption({
            promotionCodeId,
            email: customerEmail,
            orderId: order.id,
          });
        } catch (err) {
          logger.warn({ err }, "Failed to finalize discount redemption");
        }
      }

      logger.info({ orderId: order.id, sessionId: session.id }, "Order created from checkout");
    } catch (err) {
      logger.error({ err }, "Failed to create order from checkout session");
    }
  }

  // Release the per-customer reservation when a checkout is abandoned (expired)
  // or its async payment fails, so the customer is not locked out of the code.
  static async handleCheckoutAbandoned(session: any): Promise<void> {
    const promotionCodeId = session.metadata?.promotionCodeId;
    const email =
      session.customer_details?.email ?? session.customer_email ?? "";
    if (
      promotionCodeId &&
      email &&
      session.metadata?.limitModel === "per_customer"
    ) {
      try {
        await storage.releaseDiscountReservation({ promotionCodeId, email });
      } catch (err) {
        logger.warn({ err }, "Failed to release discount reservation");
      }
    }
  }
}
