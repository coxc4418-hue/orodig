import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const earningsTable = pgTable("earnings", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  type: text("type").notNull(), // referral, sales, purchases, leadership, work, passive
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("confirmed"), // pending, confirmed, paid
  relatedMemberId: integer("related_member_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEarningSchema = createInsertSchema(earningsTable).omit({ id: true, createdAt: true });
export type InsertEarning = z.infer<typeof insertEarningSchema>;
export type Earning = typeof earningsTable.$inferSelect;
