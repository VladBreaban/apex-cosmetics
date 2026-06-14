import { Router, type IRouter } from "express";
import { storage } from "../storage";
import { CreateCustomerBody, GetCustomerOrdersParams } from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, name } = parsed.data;

  // Check if user already exists
  let user = await storage.getUserByEmail(email);
  if (!user) {
    user = await storage.createUser({
      id: randomUUID(),
      email,
      name: name ?? undefined,
    });
  }

  if (!user) {
    res.status(500).json({ error: "Failed to create customer" });
    return;
  }

  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    stripeCustomerId: user.stripeCustomerId ?? null,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  });
});

router.get("/customers/:email/orders", async (req, res): Promise<void> => {
  const params = GetCustomerOrdersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const result = await storage.listOrdersByEmail(params.data.email);

  res.json({
    data: result.data.map((order) => ({
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
    })),
    total: result.total,
  });
});

export default router;
