import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============ USER & AUTH ============
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: varchar("wallet_address", { length: 100 }).unique(),
  displayName: text("display_name"),
  role: varchar("role", { length: 20 }).notNull().default('student'),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ============ COURSES ============
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  thumbnail: text("thumbnail"),
  category: varchar("category", { length: 50 }).notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull().default('beginner'),
  instructorId: varchar("instructor_id").references(() => users.id),
  duration: integer("duration"),
  bmtReward: integer("bmt_reward").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  enrollmentCount: integer("enrollment_count").notNull().default(0),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  enrollmentCount: true,
  rating: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// ============ LESSONS ============
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  videoUrl: text("video_url"),
  orderIndex: integer("order_index").notNull().default(0),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

// ============ QUIZZES ============
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  passingScore: integer("passing_score").notNull().default(70),
  timeLimit: integer("time_limit"),
  maxAttempts: integer("max_attempts").default(3),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// ============ QUIZ QUESTIONS ============
export const quizOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
});

export type QuizOption = z.infer<typeof quizOptionSchema>;

export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").references(() => quizzes.id).notNull(),
  question: text("question").notNull(),
  options: jsonb("options").$type<QuizOption[]>().notNull(),
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull().default(0),
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
}).extend({
  options: z.array(quizOptionSchema),
});

export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;

// ============ ENROLLMENTS ============
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  progress: integer("progress").notNull().default(0),
  completedLessons: jsonb("completed_lessons").$type<string[]>().notNull().default([]),
  status: varchar("status", { length: 20 }).notNull().default('enrolled'),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  progress: true,
  completedLessons: true,
  status: true,
  enrolledAt: true,
  completedAt: true,
});

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

// ============ QUIZ ATTEMPTS ============
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  quizId: varchar("quiz_id").references(() => quizzes.id).notNull(),
  answers: jsonb("answers").$type<Record<string, string>>().notNull(),
  score: integer("score").notNull(),
  passed: boolean("passed").notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

// ============ CERTIFICATES ============
export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  quizAttemptId: varchar("quiz_attempt_id").references(() => quizAttempts.id),
  txHash: varchar("tx_hash", { length: 100 }),
  issuedAt: timestamp("issued_at").defaultNow(),
  verificationCode: varchar("verification_code", { length: 50 }).unique(),
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  issuedAt: true,
});

export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;

// ============ REWARDS ============
export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id),
  amount: integer("amount").notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  txHash: varchar("tx_hash", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  status: true,
  txHash: true,
  createdAt: true,
  processedAt: true,
});

export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewards.$inferSelect;

// ============ ABOUT PAGE ============
export const roadmapItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  status: z.enum(['planned', 'in-progress', 'completed']),
  targetDate: z.string().optional(),
});

export type RoadmapItem = z.infer<typeof roadmapItemSchema>;

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

// ============ PAYMASTER WALLET CONFIG ============
export const paymasterConfig = pgTable("paymaster_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: varchar("wallet_address", { length: 100 }).notNull(),
  tokenContractAddress: varchar("token_contract_address", { length: 100 }),
  tokenTicker: varchar("token_ticker", { length: 20 }).notNull().default('BMT'),
  tokenDecimals: integer("token_decimals").notNull().default(18),
  chainId: integer("chain_id").notNull().default(202555),
  rpcUrl: varchar("rpc_url", { length: 255 }).notNull().default('https://evmrpc.kasplex.org'),
  isActive: boolean("is_active").notNull().default(true),
  minPayoutAmount: integer("min_payout_amount").notNull().default(1),
  autoPayoutEnabled: boolean("auto_payout_enabled").notNull().default(false),
  lastBalanceCheck: timestamp("last_balance_check"),
  cachedBalance: varchar("cached_balance", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaymasterConfigSchema = createInsertSchema(paymasterConfig).omit({
  id: true,
  lastBalanceCheck: true,
  cachedBalance: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePaymasterConfigSchema = z.object({
  walletAddress: z.string().min(1).optional(),
  tokenContractAddress: z.string().optional(),
  tokenTicker: z.string().min(1).optional(),
  tokenDecimals: z.number().int().min(0).optional(),
  chainId: z.number().int().optional(),
  rpcUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  minPayoutAmount: z.number().int().min(1).optional(),
  autoPayoutEnabled: z.boolean().optional(),
});

export type InsertPaymasterConfig = z.infer<typeof insertPaymasterConfigSchema>;
export type UpdatePaymasterConfig = z.infer<typeof updatePaymasterConfigSchema>;
export type PaymasterConfig = typeof paymasterConfig.$inferSelect;

// ============ PAYOUT TRANSACTIONS ============
export const payoutTransactions = pgTable("payout_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rewardId: varchar("reward_id").references(() => rewards.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  recipientAddress: varchar("recipient_address", { length: 100 }).notNull(),
  amount: integer("amount").notNull(),
  tokenTicker: varchar("token_ticker", { length: 20 }).notNull().default('BMT'),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  txHash: varchar("tx_hash", { length: 100 }),
  blockNumber: integer("block_number"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const insertPayoutTransactionSchema = createInsertSchema(payoutTransactions).omit({
  id: true,
  status: true,
  txHash: true,
  blockNumber: true,
  errorMessage: true,
  createdAt: true,
  processedAt: true,
});

export type InsertPayoutTransaction = z.infer<typeof insertPayoutTransactionSchema>;
export type PayoutTransaction = typeof payoutTransactions.$inferSelect;

// ============ WALLET AUTH SESSIONS ============
export const authSessions = pgTable("auth_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: varchar("token", { length: 100 }).notNull().unique(),
  walletAddress: varchar("wallet_address", { length: 100 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const authNonces = pgTable("auth_nonces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: varchar("wallet_address", { length: 100 }).notNull(),
  nonce: varchar("nonce", { length: 100 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
