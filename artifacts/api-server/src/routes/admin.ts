import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
  raw,
} from "express";
import { randomBytes } from "node:crypto";
import { storage } from "../storage";
import { requireAdminSession } from "../middlewares/adminAuth";
import { hashPassword } from "../lib/customerAuth";
import { saveImage, MediaError } from "../lib/mediaStore";
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
  AdminUpdateUserParams,
  AdminUpdateUserBody,
  AdminSetUserPasswordParams,
  AdminSetUserPasswordBody,
  AdminListUserOrdersParams,
  AdminListUserAddressesParams,
  AdminUploadProductImageParams,
  AdminRemoveProductImageParams,
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

// Product images. The body is the raw file rather than multipart/form-data:
// one image per request is all the admin needs, and raw bytes avoid pulling in
// a multipart parser. `raw` must be mounted per-route — a global one would
// swallow the JSON bodies every other endpoint expects.
const readImageBody = raw({ type: () => true, limit: "6mb" });

/**
 * Run the raw body parser but answer its failures in JSON.
 *
 * Passing `raw()` straight in as middleware lets a PayloadTooLargeError fall
 * through to Express's default handler, which replies with an HTML error page
 * — and, outside production, one containing a stack trace with server paths.
 * Every other endpoint here returns `{ error }`, so this one should too.
 */
function readImageBodyAsJson(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  readImageBody(req, res, (err?: unknown) => {
    if (!err) {
      next();
      return;
    }
    const status = (err as { status?: number }).status ?? 400;
    res.status(status === 413 ? 413 : 400).json({
      error:
        status === 413
          ? "Image is larger than 5MB."
          : "Could not read the uploaded file.",
    });
  });
}

router.post(
  "/admin/products/:id/image",
  readImageBodyAsJson,
  async (req, res): Promise<void> => {
    const params = AdminUploadProductImageParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const product = await storage.getProductWithPrices(params.data.id);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    if (!Buffer.isBuffer(req.body)) {
      res.status(400).json({ error: "Send the image file as the request body." });
      return;
    }

    let imageKey: string;
    try {
      imageKey = await saveImage(req.body);
    } catch (err) {
      if (err instanceof MediaError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      throw err;
    }

    await storage.updateProduct(params.data.id, { imageKey });
    res.json(await storage.getProductWithPrices(params.data.id));
  },
);

// Clears the reference only. The file stays: keys are content-addressed, so
// another product may be pointing at the same bytes.
router.delete("/admin/products/:id/image", async (req, res): Promise<void> => {
  const params = AdminRemoveProductImageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const updated = await storage.updateProduct(params.data.id, {
    imageKey: null,
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

router.patch("/admin/users/:id", async (req, res): Promise<void> => {
  const params = AdminUpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, role } = parsed.data;

  const existing = await storage.getUser(params.data.id);
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (email !== undefined) {
    const normalized = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
      res.status(400).json({ error: "Enter a valid email address." });
      return;
    }
    const clash = await storage.getUserByEmail(normalized);
    if (clash && clash.id !== existing.id) {
      res
        .status(409)
        .json({ error: "Another customer already uses that email address." });
      return;
    }
  }

  const updated = await storage.updateUser(params.data.id, {
    ...(name !== undefined ? { name: name?.trim() || null } : {}),
    ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
    ...(role !== undefined ? { role } : {}),
  });

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(await storage.getUserWithStats(updated.id));
});

// Sets a customer's password outright. There is no "send a reset link" path
// yet, so this is how support unblocks someone locked out of their account —
// the new password has to be relayed to them out of band.
router.post("/admin/users/:id/password", async (req, res): Promise<void> => {
  const params = AdminSetUserPasswordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminSetUserPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = await storage.getUser(params.data.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await storage.setUserPassword(user.id, hashPassword(parsed.data.password));
  res.status(204).end();
});

router.get("/admin/users/:id/orders", async (req, res): Promise<void> => {
  const params = AdminListUserOrdersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const user = await storage.getUser(params.data.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Orders are matched on email, not user id, so guest checkouts made before
  // the account existed are included.
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

router.get("/admin/users/:id/addresses", async (req, res): Promise<void> => {
  const params = AdminListUserAddressesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const user = await storage.getUser(params.data.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const addresses = await storage.listAddressesByUser(user.id);
  res.json({ data: addresses });
});

export default router;
