import { db } from "@workspace/db";
import {
  usersTable,
  ordersTable,
  orderItemsTable,
  discountRedemptionsTable,
  addressesTable,
  adminUsersTable,
  productsTable,
  pricesTable,
} from "@workspace/db";
import {
  eq,
  sql,
  desc,
  asc,
  count,
  sum,
  and,
  gte,
  inArray,
} from "drizzle-orm";

type ProductRow = typeof productsTable.$inferSelect;
type PriceRow = typeof pricesTable.$inferSelect;

/** The wire shape the API and both SPAs expect for a price. */
function toPriceDto(row: PriceRow) {
  return {
    id: row.id,
    unitAmount: row.unitAmount,
    currency: row.currency,
    active: row.active,
    productId: row.productId,
  };
}

/** The wire shape the API and both SPAs expect for a product. */
function toProductDto(row: ProductRow, prices: PriceRow[]) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    active: row.active,
    category: row.category ?? null,
    imageKey: row.imageKey ?? null,
    featured: row.featured,
    prices: prices.map(toPriceDto),
  };
}

export class Storage {
  // Products — this database is the source of truth. Stripe holds no product
  // or price records; checkout sends prices inline as `price_data`.
  async listProductsWithPrices(
    opts: {
      activeOnly?: boolean;
      category?: string | null;
      featured?: boolean;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const {
      activeOnly = true,
      category,
      featured,
      limit = 50,
      offset = 0,
    } = opts;

    const conditions = [];
    if (activeOnly) conditions.push(eq(productsTable.active, true));
    if (category) conditions.push(eq(productsTable.category, category));
    if (featured !== undefined) {
      conditions.push(eq(productsTable.featured, featured));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ value: count() })
      .from(productsTable)
      .where(where);
    const total = Number(totalRow?.value ?? 0);

    const products = await db
      .select()
      .from(productsTable)
      .where(where)
      .orderBy(desc(productsTable.createdAt), asc(productsTable.id))
      .limit(limit)
      .offset(offset);

    if (products.length === 0) return { data: [], total };

    const prices = await this.pricesForProducts(products.map((p) => p.id));

    return {
      data: products.map((p) => toProductDto(p, prices.get(p.id) ?? [])),
      total,
    };
  }

  async getProductWithPrices(productId: string) {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!product) return null;

    const prices = await this.pricesForProducts([product.id]);
    return toProductDto(product, prices.get(product.id) ?? []);
  }

  /** Active prices for a set of products, grouped by product id, cheapest first. */
  private async pricesForProducts(productIds: string[]) {
    const rows = productIds.length
      ? await db
          .select()
          .from(pricesTable)
          .where(
            and(
              inArray(pricesTable.productId, productIds),
              eq(pricesTable.active, true),
            ),
          )
          .orderBy(asc(pricesTable.unitAmount))
      : [];

    const byProduct = new Map<string, PriceRow[]>();
    for (const row of rows) {
      const list = byProduct.get(row.productId) ?? [];
      list.push(row);
      byProduct.set(row.productId, list);
    }
    return byProduct;
  }

  async listAllPrices(productId?: string | null) {
    const rows = await db
      .select()
      .from(pricesTable)
      .where(productId ? eq(pricesTable.productId, productId) : undefined)
      .orderBy(asc(pricesTable.unitAmount));

    return rows.map(toPriceDto);
  }

  async getPrice(priceId: string) {
    const [row] = await db
      .select()
      .from(pricesTable)
      .where(eq(pricesTable.id, priceId))
      .limit(1);

    return row ? toPriceDto(row) : null;
  }

  /**
   * Prices joined to their product, for a set of price ids.
   *
   * Checkout uses this to price a cart from the database rather than trusting
   * the amounts a client sends. Inactive prices and inactive products are
   * excluded, so a delisted item cannot be bought via a stale cart.
   */
  async getPurchasablePrices(priceIds: string[]) {
    if (priceIds.length === 0) return [];

    return db
      .select({
        priceId: pricesTable.id,
        unitAmount: pricesTable.unitAmount,
        currency: pricesTable.currency,
        productId: productsTable.id,
        productName: productsTable.name,
        productDescription: productsTable.description,
      })
      .from(pricesTable)
      .innerJoin(productsTable, eq(pricesTable.productId, productsTable.id))
      .where(
        and(
          inArray(pricesTable.id, priceIds),
          eq(pricesTable.active, true),
          eq(productsTable.active, true),
        ),
      );
  }

  async createProduct(input: {
    id: string;
    name: string;
    description?: string | null;
    category?: string | null;
    imageKey?: string | null;
    featured?: boolean;
  }) {
    const [row] = await db
      .insert(productsTable)
      .values({
        id: input.id,
        name: input.name,
        description: input.description ?? null,
        category: input.category ?? null,
        imageKey: input.imageKey ?? null,
        featured: input.featured ?? false,
        active: true,
      })
      .returning();
    return row;
  }

  async updateProduct(
    productId: string,
    patch: {
      name?: string;
      description?: string | null;
      active?: boolean;
      category?: string | null;
      imageKey?: string | null;
      featured?: boolean;
    },
  ) {
    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.name !== undefined) values.name = patch.name;
    if (patch.description !== undefined) values.description = patch.description;
    if (patch.active !== undefined) values.active = patch.active;
    if (patch.category !== undefined) values.category = patch.category;
    if (patch.imageKey !== undefined) values.imageKey = patch.imageKey;
    if (patch.featured !== undefined) values.featured = patch.featured;

    const [row] = await db
      .update(productsTable)
      .set(values)
      .where(eq(productsTable.id, productId))
      .returning();
    return row ?? null;
  }

  async createPrice(input: {
    id: string;
    productId: string;
    unitAmount: number;
    currency?: string;
  }) {
    const [row] = await db
      .insert(pricesTable)
      .values({
        id: input.id,
        productId: input.productId,
        unitAmount: input.unitAmount,
        currency: input.currency ?? "usd",
        active: true,
      })
      .returning();
    return toPriceDto(row);
  }

  async setPriceActive(priceId: string, active: boolean) {
    const [row] = await db
      .update(pricesTable)
      .set({ active })
      .where(eq(pricesTable.id, priceId))
      .returning();
    return row ? toPriceDto(row) : null;
  }

  // Orders
  async getOrder(id: number) {
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id));
    if (!order) return null;

    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, id));

    return { ...order, items };
  }

  async getOrderBySessionId(sessionId: string) {
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.stripeSessionId, sessionId));
    if (!order) return null;

    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));

    return { ...order, items };
  }

  async listOrders(opts: { status?: string; limit?: number; offset?: number } = {}) {
    const { status, limit = 50, offset = 0 } = opts;

    const conditions = status ? eq(ordersTable.status, status) : undefined;

    const [orders, totalResult] = await Promise.all([
      db
        .select()
        .from(ordersTable)
        .where(conditions)
        .orderBy(desc(ordersTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(ordersTable).where(conditions),
    ]);

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItemsTable)
          .where(eq(orderItemsTable.orderId, order.id));
        return { ...order, items };
      }),
    );

    return { data: ordersWithItems, total: Number(totalResult[0]?.count ?? 0) };
  }

  async listOrdersByEmail(email: string) {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.customerEmail, email))
      .orderBy(desc(ordersTable.createdAt));

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItemsTable)
          .where(eq(orderItemsTable.orderId, order.id));
        return { ...order, items };
      }),
    );

    return { data: ordersWithItems, total: ordersWithItems.length };
  }

  async updateOrderStatus(id: number, status: string) {
    const [order] = await db
      .update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, id))
      .returning();
    if (!order) return null;

    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, id));

    return { ...order, items };
  }

  // Users
  async getUser(id: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    return user ?? null;
  }

  async getUserByEmail(email: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    return user ?? null;
  }

  // Admin users — username/password authentication for the admin panel.
  async getAdminUserById(id: number) {
    const [admin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.id, id));
    return admin ?? null;
  }

  async getAdminUserByUsername(username: string) {
    const [admin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.username, username));
    return admin ?? null;
  }

  async createAdminUser(username: string, passwordHash: string) {
    const [admin] = await db
      .insert(adminUsersTable)
      .values({ username, passwordHash })
      .returning();
    return admin;
  }

  async countAdminUsers() {
    const [row] = await db.select({ c: count() }).from(adminUsersTable);
    return Number(row?.c ?? 0);
  }

  async createUser(data: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    passwordHash?: string;
  }) {
    const [user] = await db
      .insert(usersTable)
      .values(data)
      .onConflictDoNothing()
      .returning();
    return user ?? (await this.getUserByEmail(data.email));
  }

  /**
   * Attach a password to an existing user row. Rows created at checkout have
   * no password, so this is how a returning customer claims their account.
   */
  async setUserPassword(id: string, passwordHash: string, name?: string) {
    const [updated] = await db
      .update(usersTable)
      .set(name === undefined ? { passwordHash } : { passwordHash, name })
      .where(eq(usersTable.id, id))
      .returning();
    return updated ?? (await this.getUser(id));
  }

  async listUsers(opts: { limit?: number; offset?: number } = {}) {
    const { limit = 50, offset = 0 } = opts;

    const [users, totalResult] = await Promise.all([
      db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(usersTable),
    ]);

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [stats] = await db
          .select({
            totalOrders: count(ordersTable.id),
            totalSpent: sum(ordersTable.totalAmount),
          })
          .from(ordersTable)
          .where(eq(ordersTable.customerEmail, user.email));

        return {
          ...user,
          totalOrders: Number(stats?.totalOrders ?? 0),
          totalSpent: Number(stats?.totalSpent ?? 0),
          createdAt: user.createdAt.toISOString(),
        };
      }),
    );

    return { data: usersWithStats, total: Number(totalResult[0]?.count ?? 0) };
  }

  async getUserWithStats(id: string) {
    const user = await this.getUser(id);
    if (!user) return null;

    const [stats] = await db
      .select({
        totalOrders: count(ordersTable.id),
        totalSpent: sum(ordersTable.totalAmount),
      })
      .from(ordersTable)
      .where(eq(ordersTable.customerEmail, user.email));

    return {
      ...user,
      totalOrders: Number(stats?.totalOrders ?? 0),
      totalSpent: Number(stats?.totalSpent ?? 0),
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateUserName(id: string, name: string | null) {
    const [user] = await db
      .update(usersTable)
      .set({ name })
      .where(eq(usersTable.id, id))
      .returning();
    return user ?? null;
  }

  // Saved addresses (scoped per user)
  async listAddressesByUser(userId: string) {
    return db
      .select()
      .from(addressesTable)
      .where(eq(addressesTable.userId, userId))
      .orderBy(desc(addressesTable.isDefault), desc(addressesTable.createdAt));
  }

  async getAddress(id: number) {
    const [address] = await db
      .select()
      .from(addressesTable)
      .where(eq(addressesTable.id, id));
    return address ?? null;
  }

  async createAddress(data: {
    userId: string;
    label?: string | null;
    name: string;
    address1: string;
    address2?: string | null;
    city: string;
    state: string;
    zip: string;
    country: string;
    isDefault?: boolean;
  }) {
    return db.transaction(async (tx) => {
      if (data.isDefault) {
        await tx
          .update(addressesTable)
          .set({ isDefault: false })
          .where(eq(addressesTable.userId, data.userId));
      }
      const [address] = await tx
        .insert(addressesTable)
        .values({
          userId: data.userId,
          label: data.label ?? null,
          name: data.name,
          address1: data.address1,
          address2: data.address2 ?? null,
          city: data.city,
          state: data.state,
          zip: data.zip,
          country: data.country,
          isDefault: data.isDefault ?? false,
        })
        .returning();
      return address;
    });
  }

  async updateAddress(
    id: number,
    userId: string,
    data: {
      label?: string | null;
      name?: string;
      address1?: string;
      address2?: string | null;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      isDefault?: boolean;
    },
  ) {
    return db.transaction(async (tx) => {
      if (data.isDefault) {
        await tx
          .update(addressesTable)
          .set({ isDefault: false })
          .where(eq(addressesTable.userId, userId));
      }
      const [address] = await tx
        .update(addressesTable)
        .set(data)
        .where(and(eq(addressesTable.id, id), eq(addressesTable.userId, userId)))
        .returning();
      return address ?? null;
    });
  }

  async deleteAddress(id: number, userId: string) {
    const [address] = await db
      .delete(addressesTable)
      .where(and(eq(addressesTable.id, id), eq(addressesTable.userId, userId)))
      .returning();
    return address ?? null;
  }

  // Admin stats
  async getAdminStats() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalOrders, totalRevenue, totalCustomers, recentOrders, weekStats] =
      await Promise.all([
        db.select({ count: count() }).from(ordersTable),
        db.select({ sum: sum(ordersTable.totalAmount) }).from(ordersTable).where(eq(ordersTable.status, "paid")),
        db.select({ count: count() }).from(usersTable),
        db
          .select()
          .from(ordersTable)
          .orderBy(desc(ordersTable.createdAt))
          .limit(5),
        db
          .select({
            newOrders: count(ordersTable.id),
            weekRevenue: sum(ordersTable.totalAmount),
          })
          .from(ordersTable)
          .where(
            and(
              gte(ordersTable.createdAt, weekAgo),
              eq(ordersTable.status, "paid"),
            ),
          ),
      ]);

    const recentWithItems = await Promise.all(
      recentOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItemsTable)
          .where(eq(orderItemsTable.orderId, order.id));
        return { ...order, items };
      }),
    );

    return {
      totalOrders: Number(totalOrders[0]?.count ?? 0),
      totalRevenue: Number(totalRevenue[0]?.sum ?? 0),
      totalCustomers: Number(totalCustomers[0]?.count ?? 0),
      newOrdersThisWeek: Number(weekStats[0]?.newOrders ?? 0),
      revenueThisWeek: Number(weekStats[0]?.weekRevenue ?? 0),
      recentOrders: recentWithItems,
    };
  }

  // Discount redemptions — local tracking for strict once-per-customer codes
  async hasCustomerRedeemed(
    promotionCodeId: string,
    email: string,
  ): Promise<boolean> {
    if (!email) return false;
    const rows = await db
      .select({ id: discountRedemptionsTable.id })
      .from(discountRedemptionsTable)
      .where(
        and(
          eq(discountRedemptionsTable.promotionCodeId, promotionCodeId),
          eq(discountRedemptionsTable.email, email.toLowerCase()),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  // Atomically reserve a once-per-customer code before creating the Stripe
  // session. Returns false if this customer already holds a reservation (the
  // unique index makes this race-safe across concurrent checkout attempts).
  async reserveDiscountRedemption(values: {
    promotionCodeId: string;
    code: string;
    email: string;
    userId?: string | null;
  }): Promise<boolean> {
    const inserted = await db
      .insert(discountRedemptionsTable)
      .values({
        promotionCodeId: values.promotionCodeId,
        code: values.code,
        email: values.email.toLowerCase(),
        userId: values.userId ?? null,
        orderId: null,
      })
      .onConflictDoNothing({
        target: [
          discountRedemptionsTable.promotionCodeId,
          discountRedemptionsTable.email,
        ],
      })
      .returning({ id: discountRedemptionsTable.id });
    return inserted.length > 0;
  }

  // Attach the completed order to a previously reserved redemption.
  async finalizeDiscountRedemption(values: {
    promotionCodeId: string;
    email: string;
    orderId: number;
  }): Promise<void> {
    await db
      .update(discountRedemptionsTable)
      .set({ orderId: values.orderId })
      .where(
        and(
          eq(discountRedemptionsTable.promotionCodeId, values.promotionCodeId),
          eq(discountRedemptionsTable.email, values.email.toLowerCase()),
        ),
      );
  }

  // Release an unfinished reservation (checkout abandoned / payment failed) so
  // the customer is not permanently locked out of the code.
  async releaseDiscountReservation(values: {
    promotionCodeId: string;
    email: string;
  }): Promise<void> {
    await db
      .delete(discountRedemptionsTable)
      .where(
        and(
          eq(discountRedemptionsTable.promotionCodeId, values.promotionCodeId),
          eq(discountRedemptionsTable.email, values.email.toLowerCase()),
          sql`${discountRedemptionsTable.orderId} is null`,
        ),
      );
  }
}

export const storage = new Storage();
