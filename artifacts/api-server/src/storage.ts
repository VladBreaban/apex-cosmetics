import { db } from "@workspace/db";
import { usersTable, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, sql, desc, count, sum, and, gte } from "drizzle-orm";

export class Storage {
  // Products — from stripe schema
  async listProductsWithPrices(opts: {
    activeOnly?: boolean;
    category?: string | null;
    featured?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const { activeOnly = true, category, featured, limit = 50, offset = 0 } = opts;

    let whereClause = activeOnly ? "active = true" : "1=1";
    if (category) whereClause += ` AND metadata->>'category' = '${category.replace(/'/g, "''")}'`;
    if (featured !== undefined) whereClause += ` AND metadata->>'featured' = '${featured ? "true" : "false"}'`;

    const rows = await db.execute(sql.raw(`
      WITH paginated_products AS (
        SELECT id, name, description, metadata, active, images
        FROM stripe.products
        WHERE ${whereClause}
        ORDER BY created DESC
        LIMIT ${limit} OFFSET ${offset}
      ),
      total_count AS (
        SELECT COUNT(*) as cnt FROM stripe.products WHERE ${whereClause}
      )
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.active as product_active,
        p.metadata as product_metadata,
        p.images as product_images,
        pr.id as price_id,
        pr.unit_amount,
        pr.currency,
        pr.active as price_active,
        (SELECT cnt FROM total_count) as total_count
      FROM paginated_products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      ORDER BY p.id, pr.unit_amount
    `));

    const productsMap = new Map<string, any>();
    let total = 0;

    for (const row of rows.rows) {
      total = Number(row.total_count ?? 0);
      const id = row.product_id as string;

      if (!productsMap.has(id)) {
        const meta = (row.product_metadata as any) ?? {};
        productsMap.set(id, {
          id,
          name: row.product_name,
          description: row.product_description ?? null,
          active: row.product_active,
          category: meta.category ?? null,
          imageKey: meta.imageKey ?? null,
          featured: meta.featured === "true",
          prices: [],
        });
      }

      if (row.price_id) {
        productsMap.get(id).prices.push({
          id: row.price_id,
          unitAmount: Number(row.unit_amount ?? 0),
          currency: row.currency ?? "usd",
          active: row.price_active,
          productId: id,
        });
      }
    }

    return { data: Array.from(productsMap.values()), total };
  }

  async getProductWithPrices(productId: string) {
    const rows = await db.execute(sql`
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.active as product_active,
        p.metadata as product_metadata,
        p.images as product_images,
        pr.id as price_id,
        pr.unit_amount,
        pr.currency,
        pr.active as price_active
      FROM stripe.products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      WHERE p.id = ${productId}
      ORDER BY pr.unit_amount
    `);

    if (rows.rows.length === 0) return null;

    const first = rows.rows[0] as any;
    const meta = (first.product_metadata as any) ?? {};

    const product: any = {
      id: first.product_id,
      name: first.product_name,
      description: first.product_description ?? null,
      active: first.product_active,
      category: meta.category ?? null,
      imageKey: meta.imageKey ?? null,
      featured: meta.featured === "true",
      prices: [],
    };

    for (const row of rows.rows) {
      const r = row as any;
      if (r.price_id) {
        product.prices.push({
          id: r.price_id,
          unitAmount: Number(r.unit_amount ?? 0),
          currency: r.currency ?? "usd",
          active: r.price_active,
          productId: first.product_id,
        });
      }
    }

    return product;
  }

  async listAllPrices(productId?: string | null) {
    const rows = await db.execute(
      productId
        ? sql`SELECT id, unit_amount, currency, active, product FROM stripe.prices WHERE product = ${productId} ORDER BY unit_amount`
        : sql`SELECT id, unit_amount, currency, active, product FROM stripe.prices ORDER BY unit_amount`,
    );

    return rows.rows.map((r: any) => ({
      id: r.id,
      unitAmount: Number(r.unit_amount ?? 0),
      currency: r.currency ?? "usd",
      active: r.active,
      productId: r.product,
    }));
  }

  async getPrice(priceId: string) {
    const rows = await db.execute(
      sql`SELECT id, unit_amount, currency, active, product FROM stripe.prices WHERE id = ${priceId}`,
    );
    const r = rows.rows[0] as any;
    if (!r) return null;
    return {
      id: r.id,
      unitAmount: Number(r.unit_amount ?? 0),
      currency: r.currency ?? "usd",
      active: r.active,
      productId: r.product,
    };
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

  async createUser(data: { id: string; email: string; name?: string }) {
    const [user] = await db
      .insert(usersTable)
      .values(data)
      .onConflictDoNothing()
      .returning();
    return user ?? (await this.getUserByEmail(data.email));
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
}

export const storage = new Storage();
