import { pgTable, serial, integer, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const renewalsTable = pgTable("renewals", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  purchaseId: integer("purchase_id"),
  renewedAt: timestamp("renewed_at", { withTimezone: true }).notNull().defaultNow(),
  previousExpiration: timestamp("previous_expiration", { withTimezone: true }),
  newExpiration: timestamp("new_expiration", { withTimezone: true }).notNull(),
});

export const insertRenewalSchema = createInsertSchema(renewalsTable).omit({ id: true, renewedAt: true });
export type InsertRenewal = z.infer<typeof insertRenewalSchema>;
export type Renewal = typeof renewalsTable.$inferSelect;
