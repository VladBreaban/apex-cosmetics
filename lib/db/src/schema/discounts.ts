import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Local enforcement table for strict once-per-customer discount codes. Only
// `per_customer` redemptions are recorded here (Stripe enforces the other
// models), so the unique index guarantees a customer can never redeem the same
// per-customer code twice — even under concurrent checkout attempts. Emails are
// stored normalized to lowercase so the plain unique index is case-insensitive.
export const discountRedemptionsTable = pgTable(
  "discount_redemptions",
  {
    id: serial("id").primaryKey(),
    promotionCodeId: text("promotion_code_id").notNull(),
    code: text("code").notNull(),
    email: text("email").notNull(),
    userId: text("user_id"),
    orderId: integer("order_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("discount_redemptions_promo_email_uq").on(
      table.promotionCodeId,
      table.email,
    ),
  ],
);

export const insertDiscountRedemptionSchema = createInsertSchema(
  discountRedemptionsTable,
).omit({ id: true, createdAt: true });
export type InsertDiscountRedemption = z.infer<
  typeof insertDiscountRedemptionSchema
>;
export type DiscountRedemption =
  typeof discountRedemptionsTable.$inferSelect;
