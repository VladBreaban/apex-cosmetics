import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").notNull().default("customer"),
  // scrypt "salt:hash" — null for rows created at checkout that never set a
  // password, so those customers can claim the account by signing up later.
  passwordHash: text("password_hash"),
  // Deprecated: retained so existing rows are not dropped when the schema is
  // pushed. Customer auth is now password-based; nothing reads this.
  clerkUserId: text("clerk_user_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
