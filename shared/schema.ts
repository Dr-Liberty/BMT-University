import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Roadmap item schema
export const roadmapItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  status: z.enum(['planned', 'in-progress', 'completed']),
  targetDate: z.string().optional(),
});

export type RoadmapItem = z.infer<typeof roadmapItemSchema>;

// About page content table
export const aboutPages = pgTable("about_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull().default(''),
  roadmap: jsonb("roadmap").$type<RoadmapItem[]>().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAboutPageSchema = createInsertSchema(aboutPages).omit({
  id: true,
  updatedAt: true,
}).extend({
  description: z.string().min(1, "Description is required"),
  roadmap: z.array(roadmapItemSchema),
});

export const updateAboutPageSchema = z.object({
  description: z.string().min(1, "Description is required"),
  roadmap: z.array(roadmapItemSchema),
});

export type InsertAboutPage = z.infer<typeof insertAboutPageSchema>;
export type UpdateAboutPage = z.infer<typeof updateAboutPageSchema>;
export type AboutPage = typeof aboutPages.$inferSelect;
