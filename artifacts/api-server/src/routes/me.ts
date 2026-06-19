import { Router, type IRouter } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Current authenticated user (JIT-provisioned with role from the allowlist).
router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  res.json({
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    role: user.role,
  });
});

// Orders belonging to the authenticated user (matched by email).
router.get("/my-orders", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  const result = await storage.listOrdersByEmail(user.email);

  res.json({
    data: result.data.map((order) => ({
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
    })),
    total: result.total,
  });
});

export default router;
