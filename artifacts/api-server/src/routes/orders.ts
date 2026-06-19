import { Router, type IRouter } from "express";
import { storage } from "../storage";
import { resolveLocalUser } from "../middlewares/auth";
import { GetOrderParams } from "@workspace/api-zod";

const router: IRouter = Router();

function serializeOrder(order: any) {
  return {
    ...order,
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt,
    items: (order.items ?? []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      priceId: item.priceId ?? null,
      unitAmount: item.unitAmount,
      quantity: item.quantity,
      currency: item.currency,
    })),
  };
}

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  // Lookup by unguessable Stripe Checkout Session ID is public: it backs the
  // post-checkout confirmation screen for guests who have no account yet.
  if (idStr.startsWith("cs_")) {
    const order = await storage.getOrderBySessionId(idStr);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(serializeOrder(order));
    return;
  }

  // Numeric order IDs are sequential and therefore enumerable. Require an
  // authenticated owner (or an admin) to avoid IDOR exposure of order PII.
  const numId = parseInt(idStr, 10);
  if (isNaN(numId)) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const user = await resolveLocalUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const order = await storage.getOrder(numId);
  // Treat unauthorized access as not-found so order existence isn't leaked.
  if (!order || (user.role !== "admin" && order.userId !== user.id)) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(serializeOrder(order));
});

export default router;
