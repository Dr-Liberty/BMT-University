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
  ratingCount: integer("rating_count").notNull().default(0),
  ratingTotal: integer("rating_total").notNull().default(0),
  orderIndex: integer("order_index").notNull().default(999),
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

// ============ COURSE RATINGS ============
export const courseRatings = pgTable("course_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"), // Optional review text
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCourseRatingSchema = createInsertSchema(courseRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCourseRating = z.infer<typeof insertCourseRatingSchema>;
export type CourseRating = typeof courseRatings.$inferSelect;

// ============ MODULES (Course Sections) ============
export const modules = pgTable("modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modules.$inferSelect;

// ============ CONTENT BLOCKS ============
export const contentBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'video', 'image', 'code', 'embed']),
  content: z.string(),
  caption: z.string().optional(),
  language: z.string().optional(), // For code blocks
  orderIndex: z.number(),
});

export type ContentBlock = z.infer<typeof contentBlockSchema>;

// ============ LESSONS ============
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  moduleId: varchar("module_id").references(() => modules.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentBlocks: jsonb("content_blocks").$type<ContentBlock[]>().default([]),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  orderIndex: integer("order_index").notNull().default(0),
  duration: integer("duration"),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  contentBlocks: z.array(contentBlockSchema).optional(),
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

// ============ QUIZZES ============
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  moduleId: varchar("module_id").references(() => modules.id),
  title: text("title").notNull(),
  description: text("description"),
  passingScore: integer("passing_score").notNull().default(70),
  timeLimit: integer("time_limit"), // In minutes
  maxAttempts: integer("max_attempts").default(3),
  shuffleQuestions: boolean("shuffle_questions").notNull().default(false),
  showCorrectAnswers: boolean("show_correct_answers").notNull().default(true),
  isPublished: boolean("is_published").notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// ============ QUIZ QUESTIONS ============
// Question types: single_choice, multi_select, true_false, short_answer
export const questionTypeEnum = z.enum(['single_choice', 'multi_select', 'true_false', 'short_answer']);
export type QuestionType = z.infer<typeof questionTypeEnum>;

export const quizOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
});

export type QuizOption = z.infer<typeof quizOptionSchema>;

export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").references(() => quizzes.id).notNull(),
  questionType: varchar("question_type", { length: 20 }).notNull().default('single_choice'),
  question: text("question").notNull(),
  options: jsonb("options").$type<QuizOption[]>().notNull(),
  correctAnswer: text("correct_answer"), // For short_answer questions
  points: integer("points").notNull().default(1),
  explanation: text("explanation"),
  hint: text("hint"),
  orderIndex: integer("order_index").notNull().default(0),
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
}).extend({
  questionType: questionTypeEnum.optional(),
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
  completedModules: jsonb("completed_modules").$type<string[]>().notNull().default([]),
  currentLessonId: varchar("current_lesson_id"),
  currentModuleId: varchar("current_module_id"),
  status: varchar("status", { length: 20 }).notNull().default('enrolled'),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  progress: true,
  completedLessons: true,
  completedModules: true,
  currentLessonId: true,
  currentModuleId: true,
  status: true,
  enrolledAt: true,
  completedAt: true,
  lastAccessedAt: true,
});

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

// ============ LESSON PROGRESS ============
export const lessonProgress = pgTable("lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  lessonId: varchar("lesson_id").references(() => lessons.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  moduleId: varchar("module_id").references(() => modules.id),
  status: varchar("status", { length: 20 }).notNull().default('not_started'), // not_started, in_progress, completed
  timeSpent: integer("time_spent").notNull().default(0), // In seconds
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({
  id: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;
export type LessonProgress = typeof lessonProgress.$inferSelect;

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
  retryCount: integer("retry_count").notNull().default(0),
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

// ============ ANTI-ABUSE: DEVICE FINGERPRINTS ============
export const deviceFingerprints = pgTable("device_fingerprints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fingerprintHash: varchar("fingerprint_hash", { length: 64 }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  walletAddress: varchar("wallet_address", { length: 100 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  screenResolution: varchar("screen_resolution", { length: 20 }),
  timezone: varchar("timezone", { length: 50 }),
  language: varchar("language", { length: 10 }),
  platform: varchar("platform", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
});

export type DeviceFingerprint = typeof deviceFingerprints.$inferSelect;

// ============ ANTI-ABUSE: SUSPICIOUS ACTIVITY LOG ============
export const suspiciousActivity = pgTable("suspicious_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  walletAddress: varchar("wallet_address", { length: 100 }),
  fingerprintHash: varchar("fingerprint_hash", { length: 64 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  description: text("description"),
  severity: varchar("severity", { length: 20 }).notNull().default('low'),
  courseId: varchar("course_id").references(() => courses.id),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SuspiciousActivity = typeof suspiciousActivity.$inferSelect;

export const insertSuspiciousActivitySchema = createInsertSchema(suspiciousActivity).omit({
  id: true,
  createdAt: true,
});

export type InsertSuspiciousActivity = z.infer<typeof insertSuspiciousActivitySchema>;

// ============ REFERRAL PROGRAM ============

// Settings for the referral program (admin configurable)
export const referralSettings = pgTable("referral_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isEnabled: boolean("is_enabled").notNull().default(true),
  rewardAmount: integer("reward_amount").notNull().default(100), // BMT reward for successful referral
  triggerAction: varchar("trigger_action", { length: 30 }).notNull().default('enrollment'), // enrollment, course_completion
  referrerRewardAmount: integer("referrer_reward_amount").notNull().default(100), // Reward for the person who referred
  refereeRewardAmount: integer("referee_reward_amount").notNull().default(50), // Bonus for the person who was referred
  maxReferralsPerUser: integer("max_referrals_per_user"), // null = unlimited
  codeExpirationDays: integer("code_expiration_days"), // null = never expires
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const updateReferralSettingsSchema = z.object({
  isEnabled: z.boolean().optional(),
  rewardAmount: z.number().int().min(0).optional(),
  triggerAction: z.enum(['enrollment', 'course_completion']).optional(),
  referrerRewardAmount: z.number().int().min(0).optional(),
  refereeRewardAmount: z.number().int().min(0).optional(),
  maxReferralsPerUser: z.number().int().min(1).nullable().optional(),
  codeExpirationDays: z.number().int().min(1).nullable().optional(),
});

export type UpdateReferralSettings = z.infer<typeof updateReferralSettingsSchema>;
export type ReferralSettings = typeof referralSettings.$inferSelect;

// Unique referral codes per user
export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  useCount: integer("use_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  useCount: true,
  createdAt: true,
});

export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type ReferralCode = typeof referralCodes.$inferSelect;

// Track individual referrals
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").references(() => users.id).notNull(),
  referredUserId: varchar("referred_user_id").references(() => users.id).notNull(),
  referralCodeId: varchar("referral_code_id").references(() => referralCodes.id).notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, qualified, rewarded
  qualifyingAction: varchar("qualifying_action", { length: 30 }), // What action qualified the referral
  referrerRewardId: varchar("referrer_reward_id").references(() => rewards.id),
  refereeRewardId: varchar("referee_reward_id").references(() => rewards.id),
  createdAt: timestamp("created_at").defaultNow(),
  qualifiedAt: timestamp("qualified_at"),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  status: true,
  qualifyingAction: true,
  referrerRewardId: true,
  refereeRewardId: true,
  createdAt: true,
  qualifiedAt: true,
});

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

// ============ RATE LIMITING (PERSISTENT) ============
export const rateLimitEvents = pgTable("rate_limit_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: varchar("identifier", { length: 255 }).notNull(), // IP, wallet, fingerprint
  identifierType: varchar("identifier_type", { length: 30 }).notNull(), // 'ip', 'wallet', 'fingerprint'
  action: varchar("action", { length: 50 }).notNull(), // 'auth', 'claim_reward', 'quiz_submit', 'referral_apply'
  count: integer("count").notNull().default(1),
  windowStart: timestamp("window_start").notNull().defaultNow(),
  windowEnd: timestamp("window_end").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type RateLimitEvent = typeof rateLimitEvents.$inferSelect;

// ============ DAILY PAYOUT LIMITS ============
export const dailyPayoutLimits = pgTable("daily_payout_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: varchar("wallet_address", { length: 100 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  totalPaidOut: integer("total_paid_out").notNull().default(0),
  transactionCount: integer("transaction_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type DailyPayoutLimit = typeof dailyPayoutLimits.$inferSelect;

// ============ PAYOUT NONCE TRACKER ============
export const payoutNonceTracker = pgTable("payout_nonce_tracker", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: varchar("wallet_address", { length: 100 }).notNull().unique(), // Paymaster wallet
  lastUsedNonce: integer("last_used_nonce").notNull().default(0),
  lastConfirmedNonce: integer("last_confirmed_nonce").notNull().default(0),
  isLocked: boolean("is_locked").notNull().default(false),
  lockedAt: timestamp("locked_at"),
  lockedBy: varchar("locked_by", { length: 100 }), // Transaction ID that locked it
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type PayoutNonceTracker = typeof payoutNonceTracker.$inferSelect;

// ============ WALLET BLACKLIST (Anti-Sybil) ============
export const walletBlacklist = pgTable("wallet_blacklist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: varchar("wallet_address", { length: 100 }).notNull().unique(),
  reason: varchar("reason", { length: 100 }).notNull(), // 'sybil_attack', 'rapid_dump', 'sink_wallet', 'linked_to_sink'
  description: text("description"),
  severity: varchar("severity", { length: 20 }).notNull().default('blocked'), // 'blocked', 'flagged', 'review'
  linkedWallets: jsonb("linked_wallets").$type<string[]>().default([]), // Other wallets linked to this one
  totalDrained: integer("total_drained").default(0), // Amount drained through this wallet
  evidenceTxHashes: jsonb("evidence_tx_hashes").$type<string[]>().default([]), // Transaction hashes as evidence
  flaggedBy: varchar("flagged_by", { length: 50 }).default('system'), // 'system', 'admin', 'automated'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWalletBlacklistSchema = createInsertSchema(walletBlacklist).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWalletBlacklist = z.infer<typeof insertWalletBlacklistSchema>;
export type WalletBlacklist = typeof walletBlacklist.$inferSelect;

// ============ POST-PAYOUT TRACKING ============
// Track where rewards go after being paid out
export const postPayoutTracking = pgTable("post_payout_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payoutTransactionId: varchar("payout_transaction_id").references(() => payoutTransactions.id).notNull(),
  recipientAddress: varchar("recipient_address", { length: 100 }).notNull(),
  trackingStatus: varchar("tracking_status", { length: 30 }).notNull().default('pending'), // 'pending', 'tracked', 'suspicious', 'clean'
  firstHopDestination: varchar("first_hop_destination", { length: 100 }), // Where tokens went first
  firstHopAmount: integer("first_hop_amount"),
  firstHopTxHash: varchar("first_hop_tx_hash", { length: 100 }),
  timeToFirstTransfer: integer("time_to_first_transfer"), // Seconds between payout and first outbound transfer
  destinationType: varchar("destination_type", { length: 30 }), // 'lp_pool', 'exchange', 'wallet', 'contract', 'unknown'
  isSuspicious: boolean("is_suspicious").notNull().default(false),
  suspiciousReason: text("suspicious_reason"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  lastCheckedAt: timestamp("last_checked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PostPayoutTracking = typeof postPayoutTracking.$inferSelect;

// ============ KNOWN SINK/LP ADDRESSES ============
// Track known addresses that receive dumped rewards
export const knownSinkAddresses = pgTable("known_sink_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: varchar("address", { length: 100 }).notNull().unique(),
  addressType: varchar("address_type", { length: 30 }).notNull(), // 'lp_pool', 'exchange', 'sink_wallet', 'dex_router'
  label: varchar("label", { length: 100 }), // e.g. "KASPACOM LP", "Suspicious Sink #1"
  totalReceived: integer("total_received").default(0), // Total BMT received from reward wallets
  uniqueSenders: integer("unique_senders").default(0), // Number of unique wallets that sent here
  isFlagged: boolean("is_flagged").notNull().default(false), // True if this is a suspicious destination
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type KnownSinkAddress = typeof knownSinkAddresses.$inferSelect;

// ============ SECURITY VELOCITY TRACKING ============
// Track wallet creation rates per IP/fingerprint for Sybil prevention
export const securityVelocityTracking = pgTable("security_velocity_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: varchar("identifier", { length: 255 }).notNull(), // IP or fingerprint hash
  identifierType: varchar("identifier_type", { length: 30 }).notNull(), // 'ip', 'fingerprint'
  eventType: varchar("event_type", { length: 50 }).notNull(), // 'wallet_creation', 'course_completion', 'reward_claim'
  walletAddress: varchar("wallet_address", { length: 100 }),
  eventData: jsonb("event_data").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SecurityVelocityTracking = typeof securityVelocityTracking.$inferSelect;

// ============ WALLET CLUSTERS (Auto-detected) ============
export const walletClusters = pgTable("wallet_clusters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clusterName: varchar("cluster_name", { length: 100 }),
  walletAddresses: jsonb("wallet_addresses").$type<string[]>().notNull().default([]),
  sharedFingerprints: jsonb("shared_fingerprints").$type<string[]>().default([]),
  sharedIps: jsonb("shared_ips").$type<string[]>().default([]),
  totalWallets: integer("total_wallets").notNull().default(0),
  totalRewardsEarned: integer("total_rewards_earned").default(0),
  riskScore: integer("risk_score").notNull().default(0), // 0-100
  status: varchar("status", { length: 30 }).notNull().default('detected'), // 'detected', 'reviewed', 'blocked', 'cleared'
  autoBlocked: boolean("auto_blocked").notNull().default(false),
  blockedReason: text("blocked_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type WalletCluster = typeof walletClusters.$inferSelect;

// ============ COURSE COMPLETION VELOCITY ============
export const courseCompletionVelocity = pgTable("course_completion_velocity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  enrolledAt: timestamp("enrolled_at").notNull(),
  firstLessonAt: timestamp("first_lesson_at"),
  lastLessonAt: timestamp("last_lesson_at"),
  quizCompletedAt: timestamp("quiz_completed_at"),
  totalTimeSeconds: integer("total_time_seconds"), // Time from enrollment to quiz completion
  lessonCount: integer("lesson_count").default(0),
  isSuspicious: boolean("is_suspicious").notNull().default(false),
  suspiciousReason: text("suspicious_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CourseCompletionVelocity = typeof courseCompletionVelocity.$inferSelect;
