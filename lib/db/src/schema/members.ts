import { pgTable, text, serial, timestamp, boolean, numeric, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const membersTable = pgTable("members", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  referralCode: text("referral_code").notNull(),
  rank: text("rank").notNull().default("Bronce"),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  points: numeric("points", { precision: 12, scale: 2 }).notNull().default("0"),
  totalEarnings: numeric("total_earnings", { precision: 12, scale: 2 }).notNull().default("0"),
  directReferrals: integer("direct_referrals").notNull().default(0),
  totalNetwork: integer("total_network").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  sponsorId: integer("sponsor_id"),
  avatarUrl: text("avatar_url"),
  lastPaymentAt: timestamp("last_payment_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  unique("members_username_unique").on(t.username),
  unique("members_email_unique").on(t.email),
  unique("members_referral_code_unique").on(t.referralCode),
]);

export const insertMemberSchema = createInsertSchema(membersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof membersTable.$inferSelect;
