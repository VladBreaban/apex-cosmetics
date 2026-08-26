import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { storage } from "../storage";
import { requireAdminSession } from "../middlewares/adminAuth";
import {
  AdminListProductsQueryParams,
  AdminListPricesQueryParams,
  AdminListOrdersQueryParams,
  AdminListUsersQueryParams,
  AdminGetOrderParams,
  AdminGetUserParams,
  AdminUpdateProductParams,
  AdminDeactivateProductParams,
  AdminDeactivatePriceParams,
  AdminUpdateOrderParams,
  AdminCreateProductBody,
  AdminUpdateProductBody,
  AdminCreatePriceBody,
  AdminUpdateOrderBody,
} from "@workspace/api-zod";

/**
 * Catalog ids are generated here rather than by Stripe. The `prod_`/`price_`
 * prefixes match the existing seeded catalog (`prod_apex_001`) so old and new
 * rows read alike and historical order_items keep resolving.
 */
function newId(prefix: "prod" | "price"): string {
  return `${prefix}_${randomBytes(12).toString("base64url")}`;
}

const router: IRouter = Router();

// Every admin endpoint requires an authenticated user with the admin role.
router.use("/admin", requireAdminSession);

// Stats
router.get("/admin/stats", async (_req, res): Promise<void> => {
  const stats = await storage.getAdminStats();
  res.json({
    ...stats,
    recentOrders: stats.recentOrders.map((order) => ({
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
  });
});

// Products — stored here, not in Stripe. Stripe never sees a product or price
// record; checkout sends amounts inline from these rows.
router.get("/admin/products", async (req, res): Promise<void> => {
  const params = AdminListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { limit = 50, offset = 0 } = params.data;
  const result = await storage.listProductsWithPrices({
    activeOnly: false,
    limit: limit ?? 50,
    offset: offset ?? 0,
  });

  res.json(result);
});

router.post("/admin/products", async (req, res): Promise<void> => {
  const parsed = AdminCreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    name,
    description,
    unitAmount,
    currency = "usd",
    category,
    imageKey,
    featured,
  } = parsed.data;

  const productId = newId("prod");
  await storage.createProduct({
    id: productId,
    name,
    description: description ?? null,
    category: category ?? null,
    imageKey: imageKey ?? null,
    featured: featured ?? false,
  });

  await storage.createPrice({
    id: newId("price"),
    productId,
    unitAmount,
    currency: currency ?? "usd",
  });

  const created = await storage.getProductWithPrices(productId);
  res.status(201).json(created);
});

router.patch("/admin/products/:id", async (req, res): Promise<void> => {
  const params = AdminUpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, description, active, category, imageKey, featured } =
    parsed.data;

  const updated = await storage.updateProduct(params.data.id, {
    ...(name !== undefined ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(active !== undefined ? { active } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(imageKey !== undefined ? { imageKey } : {}),
    ...(featured !== undefined ? { featured } : {}),
  });

  if (!updated) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(await storage.getProductWithPrices(updated.id));
});

// Deactivates rather than deletes: order history references product ids, and
// prices cascade from the product row.
router.delete("/admin/products/:id", async (req, res): Promise<void> => {
  const params = AdminDeactivateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const updated = await storage.updateProduct(params.data.id, {
    active: false,
  });

  if (!updated) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(await storage.getProductWithPrices(updated.id));
});

// Prices
router.get("/admin/prices", async (req, res): Promise<void> => {
  const params = AdminListPricesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const prices = await storage.listAllPrices(params.data.productId ?? null);
  res.json({ data: prices });
});

router.post("/admin/prices", async (req, res): Promise<void> => {
  const parsed = AdminCreatePriceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { productId, unitAmount, currency = "usd" } = parsed.data;

  const product = await storage.getProductWithPrices(productId);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const price = await storage.createPrice({
    id: newId("price"),
    productId,
    unitAmount,
    currency: currency ?? "usd",
  });

  res.status(201).json(price);
});

router.delete("/admin/prices/:id", async (req, res): Promise<void> => {
  const params = AdminDeactivatePriceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const price = await storage.setPriceActive(params.data.id, false);
  if (!price) {
    res.status(404).json({ error: "Price not found" });
    return;
  }

  res.json(price);
});

// Orders
router.get("/admin/orders", async (req, res): Promise<void> => {
  const params = AdminListOrdersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { status, limit = 50, offset = 0 } = params.data;
  const result = await storage.listOrders({
    status: status ?? undefined,
    limit: limit ?? 50,
    offset: offset ?? 0,
  });

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

router.get("/admin/orders/:id", async (req, res): Promise<void> => {
  const params = AdminGetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const order = await storage.getOrder(params.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json({
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
  });
});

router.patch("/admin/orders/:id", async (req, res): Promise<void> => {
  const params = AdminUpdateOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const order = await storage.updateOrderStatus(params.data.id, parsed.data.status);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json({
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
  });
});

// Users
router.get("/admin/users", async (req, res): Promise<void> => {
  const params = AdminListUsersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { limit = 50, offset = 0 } = params.data;
  const result = await storage.listUsers({
    limit: limit ?? 50,
    offset: offset ?? 0,
  });

  res.json(result);
});

router.get("/admin/users/:id", async (req, res): Promise<void> => {
  const params = AdminGetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const user = await storage.getUserWithStats(params.data.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

export default router;
