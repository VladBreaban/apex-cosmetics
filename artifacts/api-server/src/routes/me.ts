import { Router, type IRouter } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middlewares/auth";
import {
  UpdateMeBody,
  CreateMyAddressBody,
  UpdateMyAddressBody,
  UpdateMyAddressParams,
  DeleteMyAddressParams,
} from "@workspace/api-zod";
import type { Address } from "@workspace/db";

const router: IRouter = Router();

function serializeAddress(a: Address) {
  return {
    id: a.id,
    label: a.label ?? null,
    name: a.name,
    address1: a.address1,
    address2: a.address2 ?? null,
    city: a.city,
    state: a.state,
    zip: a.zip,
    country: a.country,
    isDefault: a.isDefault,
  };
}

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

// Update the authenticated user's profile (name only).
router.patch("/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = req.localUser!;
  const name = parsed.data.name?.trim();
  const updated = await storage.updateUserName(user.id, name ? name : null);
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: updated.id,
    email: updated.email,
    name: updated.name ?? null,
    role: updated.role,
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

// Saved addresses for the authenticated user.
router.get("/me/addresses", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  const addresses = await storage.listAddressesByUser(user.id);
  res.json({ data: addresses.map(serializeAddress) });
});

router.post("/me/addresses", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateMyAddressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = req.localUser!;
  const address = await storage.createAddress({
    userId: user.id,
    ...parsed.data,
  });
  res.status(201).json(serializeAddress(address));
});

router.patch(
  "/me/addresses/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = UpdateMyAddressParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateMyAddressBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const user = req.localUser!;

    if (Object.keys(parsed.data).length === 0) {
      const existing = await storage.getAddress(params.data.id);
      if (!existing || existing.userId !== user.id) {
        res.status(404).json({ error: "Address not found" });
        return;
      }
      res.json(serializeAddress(existing));
      return;
    }

    const updated = await storage.updateAddress(
      params.data.id,
      user.id,
      parsed.data,
    );
    if (!updated) {
      res.status(404).json({ error: "Address not found" });
      return;
    }
    res.json(serializeAddress(updated));
  },
);

router.delete(
  "/me/addresses/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = DeleteMyAddressParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const user = req.localUser!;
    const deleted = await storage.deleteAddress(params.data.id, user.id);
    if (!deleted) {
      res.status(404).json({ error: "Address not found" });
      return;
    }
    res.json(serializeAddress(deleted));
  },
);

export default router;
