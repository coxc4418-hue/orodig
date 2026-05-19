import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const conferencesTable = pgTable("conferences", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  streamUrl: text("stream_url").notNull().default(""),
  isLive: boolean("is_live").notNull().default(false),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Conference = typeof conferencesTable.$inferSelect;
