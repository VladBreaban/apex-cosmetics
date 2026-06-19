import { Router, type IRouter } from "express";
import { storage } from "../storage";
import { getUncachableStripeClient } from "../stripeClient";
import { requireAdmin } from "../middlewares/auth";
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

const router: IRouter = Router();

// Every admin endpoint requires an authenticated user with the admin role.
router.use("/admin", requireAdmin);

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

// Products
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

  const stripe = await getUncachableStripeClient();

  const product = await stripe.products.create({
    name,
    description: description ?? undefined,
    metadata: {
      ...(category ? { category } : {}),
      ...(imageKey ? { imageKey } : {}),
      ...(featured !== undefined ? { featured: String(featured) } : {}),
    },
  });

  await stripe.prices.create({
    product: product.id,
    unit_amount: unitAmount,
    currency: currency ?? "usd",
  });

  // Brief delay to allow webhook sync
  await new Promise((r) => setTimeout(r, 500));

  const created = await storage.getProductWithPrices(product.id);

  res.status(201).json(
    created ?? {
      id: product.id,
      name: product.name,
      description: product.description ?? null,
      active: product.active,
      category: category ?? null,
      imageKey: imageKey ?? null,
      featured: featured ?? false,
      prices: [],
    },
  );
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

  const stripe = await getUncachableStripeClient();

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (active !== undefined) updateData.active = active;

  const metadataUpdate: any = {};
  if (category !== undefined) metadataUpdate.category = category;
  if (imageKey !== undefined) metadataUpdate.imageKey = imageKey;
  if (featured !== undefined) metadataUpdate.featured = String(featured);

  if (Object.keys(metadataUpdate).length > 0) {
    updateData.metadata = metadataUpdate;
  }

  const updated = await stripe.products.update(params.data.id, updateData);

  await new Promise((r) => setTimeout(r, 500));

  const product = await storage.getProductWithPrices(updated.id);
  const meta = (updated.metadata as any) ?? {};

  res.json(
    product ?? {
      id: updated.id,
      name: updated.name,
      description: updated.description ?? null,
      active: updated.active,
      category: meta.category ?? null,
      imageKey: meta.imageKey ?? null,
      featured: meta.featured === "true",
      prices: [],
    },
  );
});

router.delete("/admin/products/:id", async (req, res): Promise<void> => {
  const params = AdminDeactivateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const stripe = await getUncachableStripeClient();
  const updated = await stripe.products.update(params.data.id, {
    active: false,
  });

  await new Promise((r) => setTimeout(r, 500));

  const product = await storage.getProductWithPrices(updated.id);
  const meta = (updated.metadata as any) ?? {};

  res.json(
    product ?? {
      id: updated.id,
      name: updated.name,
      description: updated.description ?? null,
      active: false,
      category: meta.category ?? null,
      imageKey: meta.imageKey ?? null,
      featured: meta.featured === "true",
      prices: [],
    },
  );
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

  const stripe = await getUncachableStripeClient();
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency: currency ?? "usd",
  });

  res.status(201).json({
    id: price.id,
    unitAmount: price.unit_amount ?? 0,
    currency: price.currency,
    active: price.active,
    productId:
      typeof price.product === "string" ? price.product : price.product.id,
  });
});

router.delete("/admin/prices/:id", async (req, res): Promise<void> => {
  const params = AdminDeactivatePriceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const stripe = await getUncachableStripeClient();
  const price = await stripe.prices.update(params.data.id, { active: false });

  res.json({
    id: price.id,
    unitAmount: price.unit_amount ?? 0,
    currency: price.currency,
    active: price.active,
    productId:
      typeof price.product === "string" ? price.product : price.product.id,
  });
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
