import { Router, type IRouter } from "express";
import { storage } from "../storage";
import { GetOrderParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Support looking up by session_id (string) or numeric id
  const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  let order: any = null;

  // If it starts with "cs_" it's a Stripe session ID
  if (idStr.startsWith("cs_")) {
    order = await storage.getOrderBySessionId(idStr);
  } else {
    const numId = parseInt(idStr, 10);
    if (!isNaN(numId)) {
      order = await storage.getOrder(numId);
    }
  }

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json({
    ...order,
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
    items: (order.items ?? []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      priceId: item.priceId ?? null,
      unitAmount: item.unitAmount,
      quantity: item.quantity,
      currency: item.currency,
    })),
  });
});

export default router;
