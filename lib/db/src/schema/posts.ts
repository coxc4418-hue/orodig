import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  likesCount: integer("likes_count").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Post = typeof postsTable.$inferSelect;
