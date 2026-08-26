import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Products and prices are owned by this database.
 *
 * They used to live in Stripe and be mirrored into a `stripe.*` schema by
 * `stripe-replit-sync`; the catalog is now authoritative here and Stripe is
 * only a payment processor. Checkout sends prices inline (`price_data`), so
 * Stripe holds no product or price records of its own.
 *
 * IDs stay `text` rather than serial because the existing catalog uses
 * `prod_apex_001` / `price_apex_001`, and `order_items.product_id` /
 * `order_items.price_id` already reference those strings on historical orders.
 */
export const productsTable = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    category: text("category"),
    imageKey: text("image_key"),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("products_active_idx").on(t.active),
    index("products_category_idx").on(t.category),
    index("products_featured_idx").on(t.featured),
  ],
);

export const pricesTable = pgTable(
  "prices",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => productsTable.id, { onDelete: "cascade" }),
    // Minor units, matching Stripe's convention (6800 = $68.00).
    unitAmount: integer("unit_amount").notNull(),
    currency: text("currency").notNull().default("usd"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("prices_product_idx").on(t.productId),
    index("prices_active_idx").on(t.active),
  ],
);

export const insertProductSchema = createInsertSchema(productsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const insertPriceSchema = createInsertSchema(pricesTable).omit({
  createdAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertPrice = z.infer<typeof insertPriceSchema>;
export type Product = typeof productsTable.$inferSelect;
export type Price = typeof pricesTable.$inferSelect;
