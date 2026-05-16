import { pgTable, text, serial, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  pointsReward: numeric("points_reward", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
