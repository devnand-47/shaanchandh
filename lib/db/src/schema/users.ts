import { pgTable, text, timestamp, boolean, real, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("Other"),
  bio: text("bio"),
  skills: text("skills").array().notNull().default([]),
  location: text("location"),
  portfolioUrl: text("portfolio_url"),
  portfolioImages: text("portfolio_images").array().notNull().default([]),
  isVerified: boolean("is_verified").notNull().default(false),
  onlineStatus: text("online_status").notNull().default("offline"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const blockedUsersTable = pgTable("blocked_users", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  blockerUserId: text("blocker_user_id").notNull().references(() => usersTable.id),
  blockedUserId: text("blocked_user_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
