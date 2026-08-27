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
 * The canonical product category list.
 *
 * `products.category` deliberately stays a plain text column holding a slug
 * rather than becoming a foreign key: the storefront already filters on that
 * text, and rows seeded before this table existed carry values that have no
 * matching row yet. Making it an FK would break both. The admin treats this
 * table as the authoritative list, and renaming a slug cascades to
 * `products.category` in the same transaction (see `renameCategory`).
 */
export const categoriesTable = pgTable(
  "categories",
  {
    slug: text("slug").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    imageKey: text("image_key"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("categories_active_idx").on(t.active),
    index("categories_sort_idx").on(t.sortOrder),
  ],
);

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;
