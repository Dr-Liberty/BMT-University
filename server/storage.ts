import { 
  type User, type InsertUser, 
  type AboutPage, type UpdateAboutPage, type RoadmapItem,
  type Course, type InsertCourse,
  type Module, type InsertModule,
  type Lesson, type InsertLesson,
  type LessonProgress, type InsertLessonProgress,
  type Quiz, type InsertQuiz,
  type QuizQuestion, type InsertQuizQuestion,
  type Enrollment, type InsertEnrollment,
  type QuizAttempt, type InsertQuizAttempt,
  type Certificate, type InsertCertificate,
  type Reward, type InsertReward,
  type PaymasterConfig, type InsertPaymasterConfig, type UpdatePaymasterConfig,
  type PayoutTransaction, type InsertPayoutTransaction,
  type DeviceFingerprint, type SuspiciousActivity, type InsertSuspiciousActivity,
  type ReferralSettings, type UpdateReferralSettings,
  type ReferralCode, type InsertReferralCode,
  type Referral, type InsertReferral,
  users, courses, modules, lessons, lessonProgress,
  quizzes, quizQuestions, 
  enrollments, quizAttempts, certificates, rewards,
  aboutPages, authNonces, authSessions,
  paymasterConfig, payoutTransactions,
  deviceFingerprints, suspiciousActivity,
  referralSettings, referralCodes, referrals,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, gt, isNull, or } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  
  getCourse(id: string): Promise<Course | undefined>;
  getAllCourses(filters?: { category?: string; difficulty?: string; isPublished?: boolean; limit?: number; offset?: number }): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;
  
  // Module methods
  getModule(id: string): Promise<Module | undefined>;
  getModulesByCourse(courseId: string): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: string, data: Partial<InsertModule>): Promise<Module | undefined>;
  deleteModule(id: string): Promise<boolean>;
  reorderModules(courseId: string, moduleIds: string[]): Promise<void>;
  
  getLesson(id: string): Promise<Lesson | undefined>;
  getLessonsByCourse(courseId: string): Promise<Lesson[]>;
  getLessonsByModule(moduleId: string): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: string): Promise<boolean>;
  reorderLessons(moduleId: string, lessonIds: string[]): Promise<void>;
  
  // Lesson progress methods
  getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | undefined>;
  getLessonProgressByCourse(userId: string, courseId: string): Promise<LessonProgress[]>;
  createOrUpdateLessonProgress(data: InsertLessonProgress): Promise<LessonProgress>;
  markLessonComplete(userId: string, lessonId: string): Promise<LessonProgress>;
  
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizByCourse(courseId: string): Promise<Quiz | undefined>;
  getQuizzesByCourse(courseId: string): Promise<Quiz[]>;
  getQuizzesByModule(moduleId: string): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: string, data: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: string): Promise<boolean>;
  
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  updateQuizQuestion(id: string, data: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined>;
  deleteQuizQuestion(id: string): Promise<boolean>;
  
  getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined>;
  getEnrollmentById(enrollmentId: string): Promise<Enrollment | undefined>;
  getEnrollmentsByUser(userId: string): Promise<Enrollment[]>;
  getAllEnrollments(): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: string, data: Partial<Enrollment>): Promise<Enrollment | undefined>;
  
  getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]>;
  getFailedAttemptsLast24Hours(userId: string, quizId: string): Promise<QuizAttempt[]>;
  getAllQuizAttempts(): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  
  getCertificate(id: string): Promise<Certificate | undefined>;
  getCertificatesByUser(userId: string): Promise<Certificate[]>;
  getAllCertificates(): Promise<Certificate[]>;
  getCertificateByVerificationCode(code: string): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  
  getRewardsByUser(userId: string): Promise<Reward[]>;
  getAllRewards(): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: string, data: Partial<Reward>): Promise<Reward | undefined>;
  
  getAboutPage(): Promise<AboutPage>;
  updateAboutPage(data: UpdateAboutPage): Promise<AboutPage>;
  
  createAuthNonce(walletAddress: string, nonce: string, expiresAt: Date): Promise<void>;
  getAuthNonce(walletAddress: string): Promise<{ nonce: string; expiresAt: Date } | undefined>;
  deleteAuthNonce(walletAddress: string): Promise<void>;
  createAuthSession(userId: string, token: string, walletAddress: string, expiresAt: Date): Promise<void>;
  getAuthSession(token: string): Promise<{ userId: string; walletAddress: string; expiresAt: Date } | undefined>;
  deleteAuthSession(token: string): Promise<void>;
  
  getPaymasterConfig(): Promise<PaymasterConfig | undefined>;
  createPaymasterConfig(config: InsertPaymasterConfig): Promise<PaymasterConfig>;
  updatePaymasterConfig(id: string, data: UpdatePaymasterConfig): Promise<PaymasterConfig | undefined>;
  updatePaymasterBalance(id: string, balance: string): Promise<PaymasterConfig | undefined>;
  
  getPayoutTransaction(id: string): Promise<PayoutTransaction | undefined>;
  getPayoutTransactionsByUser(userId: string): Promise<PayoutTransaction[]>;
  getPayoutsByReward(rewardId: string): Promise<PayoutTransaction[]>;
  getPendingPayoutTransactions(): Promise<PayoutTransaction[]>;
  getAllPayoutTransactions(): Promise<PayoutTransaction[]>;
  createPayoutTransaction(payout: InsertPayoutTransaction): Promise<PayoutTransaction>;
  updatePayoutTransaction(id: string, data: Partial<PayoutTransaction>): Promise<PayoutTransaction | undefined>;
  claimPayoutForProcessing(id: string): Promise<PayoutTransaction | null>;
  releasePayoutFromProcessing(id: string): Promise<boolean>;
  completePayoutFromProcessing(id: string, txHash: string, blockNumber?: number): Promise<PayoutTransaction | null>;
  failPayoutFromProcessing(id: string, errorMessage: string): Promise<PayoutTransaction | null>;
  
  // Anti-abuse methods
  hasUserCompletedCourseReward(userId: string, courseId: string): Promise<boolean>;
  getRewardByUserAndCourse(userId: string, courseId: string): Promise<Reward | undefined>;
  
  // Device fingerprint methods
  saveDeviceFingerprint(data: {
    fingerprintHash: string;
    userId: string;
    walletAddress: string;
    ipAddress?: string;
    userAgent?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
  }): Promise<DeviceFingerprint>;
  getDeviceFingerprintsByHash(fingerprintHash: string): Promise<DeviceFingerprint[]>;
  getDeviceFingerprintsByIp(ipAddress: string): Promise<DeviceFingerprint[]>;
  getDeviceFingerprintsByUser(userId: string): Promise<DeviceFingerprint[]>;
  
  // Suspicious activity methods
  logSuspiciousActivity(activity: InsertSuspiciousActivity): Promise<SuspiciousActivity>;
  getSuspiciousActivityByUser(userId: string): Promise<SuspiciousActivity[]>;
  getSuspiciousActivityByFingerprint(fingerprintHash: string): Promise<SuspiciousActivity[]>;
  
  // Referral program methods
  getReferralSettings(): Promise<ReferralSettings | undefined>;
  updateReferralSettings(data: UpdateReferralSettings): Promise<ReferralSettings>;
  
  getReferralCode(userId: string): Promise<ReferralCode | undefined>;
  getReferralCodeByCode(code: string): Promise<ReferralCode | undefined>;
  createReferralCode(data: InsertReferralCode): Promise<ReferralCode>;
  incrementReferralCodeUseCount(codeId: string): Promise<void>;
  
  getReferral(referrerId: string, referredUserId: string): Promise<Referral | undefined>;
  getReferralsByReferrer(referrerId: string): Promise<Referral[]>;
  getReferralByReferredUser(referredUserId: string): Promise<Referral | undefined>;
  createReferral(data: InsertReferral): Promise<Referral>;
  updateReferral(id: string, data: Partial<Referral>): Promise<Referral | undefined>;
  getReferralStats(userId: string): Promise<{ totalReferrals: number; pendingReferrals: number; qualifiedReferrals: number; rewardedReferrals: number; totalBmtEarned: number }>;
  getAllReferrals(): Promise<Referral[]>;
}

const defaultAboutPage: Omit<AboutPage, 'id'> = {
  description: `Bitcoin Maxi Tears ($BMT) is the ultimate meme token on the Kaspa blockchain, launched on Kasplex. Every time a Bitcoin maximalist dismisses Kaspa's superior technology, we collect their tears and turn them into tokens.

Built on the fastest proof-of-work blockchain, $BMT combines the power of meme culture with the revolutionary blockDAG technology of Kaspa. Learn, earn, and collect tears with BMT University!

Our mission is to educate the crypto community about the revolutionary potential of Kaspa's blockDAG architecture while having fun along the way. Join us on this journey to collect those sweet, sweet Bitcoin Maxi Tears.`,
  roadmap: [
    {
      id: '1',
      title: 'BMT University Launch',
      description: 'Launch the learning platform with initial courses on Kaspa blockchain fundamentals.',
      status: 'completed',
      targetDate: 'Q4 2024',
    },
    {
      id: '2',
      title: 'Quiz & Certification System',
      description: 'Implement quiz functionality with on-chain certificate issuance and $BMT rewards.',
      status: 'in-progress',
      targetDate: 'Q1 2025',
    },
    {
      id: '3',
      title: 'Multi-Project Platform',
      description: 'Open platform to other Kaspa ecosystem projects with subscription-based white-labeling.',
      status: 'planned',
      targetDate: 'Q2 2025',
    },
    {
      id: '4',
      title: 'Igra Network Integration',
      description: 'Expand to support Igra network for cross-chain learning experiences.',
      status: 'planned',
      targetDate: 'Q3 2025',
    },
  ],
  updatedAt: new Date(),
};

const sampleCourses = [
  {
    id: 'course-1',
    title: 'Kaspa Blockchain Fundamentals',
    description: 'Learn the basics of Kaspa blockchain technology, including the blockDAG architecture, GHOSTDAG protocol, and what makes Kaspa unique.',
    shortDescription: 'Master the fundamentals of Kaspa blockchain',
    category: 'blockchain',
    difficulty: 'beginner',
    duration: 120,
    bmtReward: 5000,
    isPublished: true,
  },
  {
    id: 'course-2',
    title: 'Understanding $BMT Tokenomics',
    description: 'Deep dive into Bitcoin Maxi Tears token economics, including supply, distribution, and utility within the BMT University ecosystem.',
    shortDescription: 'Explore $BMT token mechanics and value',
    category: 'tokenomics',
    difficulty: 'intermediate',
    duration: 90,
    bmtReward: 7500,
    isPublished: true,
  },
  {
    id: 'course-3',
    title: 'Kasplex Token Development',
    description: 'Learn how to create, deploy, and manage tokens on the Kasplex protocol. Build your own token from scratch.',
    shortDescription: 'Build tokens on Kasplex protocol',
    category: 'development',
    difficulty: 'advanced',
    duration: 180,
    bmtReward: 15000,
    isPublished: true,
  },
  {
    id: 'course-4',
    title: 'BlockDAG Technology Explained',
    description: 'Understand the revolutionary blockDAG architecture that enables Kaspa to achieve unprecedented transaction speeds while maintaining security.',
    shortDescription: 'Deep dive into blockDAG architecture',
    category: 'blockchain',
    difficulty: 'intermediate',
    duration: 150,
    bmtReward: 10000,
    isPublished: true,
  },
];

const sampleLessons = [
  {
    id: 'lesson-1-1',
    courseId: 'course-1',
    title: 'Introduction to Kaspa',
    content: 'Welcome to Kaspa Blockchain Fundamentals! In this lesson, we will explore what makes Kaspa unique...',
    orderIndex: 0,
    duration: 15,
  },
  {
    id: 'lesson-1-2',
    courseId: 'course-1',
    title: 'Understanding BlockDAG',
    content: 'BlockDAG (Directed Acyclic Graph) is the core innovation behind Kaspa...',
    orderIndex: 1,
    duration: 20,
  },
  {
    id: 'lesson-1-3',
    courseId: 'course-1',
    title: 'GHOSTDAG Protocol',
    content: 'The GHOSTDAG protocol is what allows Kaspa to process blocks in parallel...',
    orderIndex: 2,
    duration: 25,
  },
];

const sampleQuizzes = [
  {
    id: 'quiz-1',
    courseId: 'course-1',
    title: 'Kaspa Fundamentals Quiz',
    description: 'Test your knowledge of Kaspa blockchain basics',
    passingScore: 70,
    timeLimit: 600,
    maxAttempts: 3,
  },
];

const sampleQuizQuestions = [
  {
    id: 'question-1',
    quizId: 'quiz-1',
    question: 'What data structure does Kaspa use instead of a traditional blockchain?',
    options: [
      { id: 'a', text: 'Linked List', isCorrect: false },
      { id: 'b', text: 'BlockDAG (Directed Acyclic Graph)', isCorrect: true },
      { id: 'c', text: 'Binary Tree', isCorrect: false },
      { id: 'd', text: 'Hash Table', isCorrect: false },
    ],
    explanation: 'Kaspa uses a BlockDAG structure which allows multiple blocks to be created in parallel.',
    orderIndex: 0,
  },
  {
    id: 'question-2',
    quizId: 'quiz-1',
    question: 'What is the name of Kaspa\'s consensus protocol?',
    options: [
      { id: 'a', text: 'Proof of Stake', isCorrect: false },
      { id: 'b', text: 'Proof of Work', isCorrect: false },
      { id: 'c', text: 'GHOSTDAG', isCorrect: true },
      { id: 'd', text: 'Delegated Proof of Stake', isCorrect: false },
    ],
    explanation: 'GHOSTDAG (Greedy Heaviest Observed SubTree DAG) is Kaspa\'s innovative consensus protocol.',
    orderIndex: 1,
  },
  {
    id: 'question-3',
    quizId: 'quiz-1',
    question: 'What is a key advantage of Kaspa\'s BlockDAG architecture?',
    options: [
      { id: 'a', text: 'Lower energy consumption', isCorrect: false },
      { id: 'b', text: 'Faster transaction throughput', isCorrect: true },
      { id: 'c', text: 'Smaller block size', isCorrect: false },
      { id: 'd', text: 'Simpler mining process', isCorrect: false },
    ],
    explanation: 'BlockDAG allows parallel block creation, significantly increasing transaction throughput.',
    orderIndex: 2,
  },
  {
    id: 'question-4',
    quizId: 'quiz-1',
    question: 'What platform is $BMT (Bitcoin Maxi Tears) built on?',
    options: [
      { id: 'a', text: 'Ethereum', isCorrect: false },
      { id: 'b', text: 'Solana', isCorrect: false },
      { id: 'c', text: 'Kasplex', isCorrect: true },
      { id: 'd', text: 'Polygon', isCorrect: false },
    ],
    explanation: '$BMT is a KRC-20 token built on Kasplex, the token standard for the Kaspa ecosystem.',
    orderIndex: 3,
  },
  {
    id: 'question-5',
    quizId: 'quiz-1',
    question: 'Approximately how many blocks per second can Kaspa produce?',
    options: [
      { id: 'a', text: '1 block per second', isCorrect: false },
      { id: 'b', text: '10 blocks per second', isCorrect: true },
      { id: 'c', text: '100 blocks per second', isCorrect: false },
      { id: 'd', text: '1000 blocks per second', isCorrect: false },
    ],
    explanation: 'Kaspa can currently produce approximately 10 blocks per second, with plans to scale further.',
    orderIndex: 4,
  },
];

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      lastLoginAt: new Date(),
    }).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async getAllCourses(filters?: { category?: string; difficulty?: string; isPublished?: boolean; limit?: number; offset?: number }): Promise<Course[]> {
    const conditions = [];
    if (filters?.category) {
      conditions.push(eq(courses.category, filters.category));
    }
    if (filters?.difficulty) {
      conditions.push(eq(courses.difficulty, filters.difficulty));
    }
    if (filters?.isPublished !== undefined) {
      conditions.push(eq(courses.isPublished, filters.isPublished));
    }
    
    const baseQuery = conditions.length > 0 
      ? db.select().from(courses).where(and(...conditions))
      : db.select().from(courses);
    
    let query = baseQuery.orderBy(asc(courses.orderIndex), asc(courses.createdAt));
    
    // Apply pagination if specified
    if (filters?.limit !== undefined) {
      query = query.limit(filters.limit) as typeof query;
    }
    if (filters?.offset !== undefined) {
      query = query.offset(filters.offset) as typeof query;
    }
    
    return query;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const [course] = await db.update(courses).set({ ...data, updatedAt: new Date() }).where(eq(courses.id, id)).returning();
    return course || undefined;
  }

  async deleteCourse(id: string): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return true;
  }

  // Module methods
  async getModule(id: string): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module || undefined;
  }

  async getModulesByCourse(courseId: string): Promise<Module[]> {
    return db.select().from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(asc(modules.orderIndex));
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values(module).returning();
    return newModule;
  }

  async updateModule(id: string, data: Partial<InsertModule>): Promise<Module | undefined> {
    const [module] = await db.update(modules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(modules.id, id))
      .returning();
    return module || undefined;
  }

  async deleteModule(id: string): Promise<boolean> {
    await db.delete(modules).where(eq(modules.id, id));
    return true;
  }

  async reorderModules(courseId: string, moduleIds: string[]): Promise<void> {
    for (let i = 0; i < moduleIds.length; i++) {
      await db.update(modules)
        .set({ orderIndex: i })
        .where(and(eq(modules.id, moduleIds[i]), eq(modules.courseId, courseId)));
    }
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson || undefined;
  }

  async getLessonsByCourse(courseId: string): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.orderIndex));
  }

  async getLessonsByModule(moduleId: string): Promise<Lesson[]> {
    return db.select().from(lessons)
      .where(eq(lessons.moduleId, moduleId))
      .orderBy(asc(lessons.orderIndex));
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  async updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [lesson] = await db.update(lessons).set(data).where(eq(lessons.id, id)).returning();
    return lesson || undefined;
  }

  async deleteLesson(id: string): Promise<boolean> {
    await db.delete(lessons).where(eq(lessons.id, id));
    return true;
  }

  async reorderLessons(moduleId: string, lessonIds: string[]): Promise<void> {
    for (let i = 0; i < lessonIds.length; i++) {
      await db.update(lessons)
        .set({ orderIndex: i })
        .where(and(eq(lessons.id, lessonIds[i]), eq(lessons.moduleId, moduleId)));
    }
  }

  // Lesson progress methods
  async getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | undefined> {
    const [progress] = await db.select().from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)));
    return progress || undefined;
  }

  async getLessonProgressByCourse(userId: string, courseId: string): Promise<LessonProgress[]> {
    return db.select().from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.courseId, courseId)));
  }

  async createOrUpdateLessonProgress(data: InsertLessonProgress): Promise<LessonProgress> {
    const existing = await this.getLessonProgress(data.userId, data.lessonId);
    if (existing) {
      const [updated] = await db.update(lessonProgress)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(lessonProgress.id, existing.id))
        .returning();
      return updated;
    }
    const [newProgress] = await db.insert(lessonProgress).values(data).returning();
    return newProgress;
  }

  async markLessonComplete(userId: string, lessonId: string): Promise<LessonProgress> {
    const lesson = await this.getLesson(lessonId);
    if (!lesson) throw new Error('Lesson not found');
    
    return this.createOrUpdateLessonProgress({
      userId,
      lessonId,
      courseId: lesson.courseId,
      moduleId: lesson.moduleId || undefined,
      status: 'completed',
      timeSpent: 0,
    });
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async getQuizByCourse(courseId: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.courseId, courseId));
    return quiz || undefined;
  }

  async getQuizzesByCourse(courseId: string): Promise<Quiz[]> {
    return db.select().from(quizzes)
      .where(eq(quizzes.courseId, courseId))
      .orderBy(asc(quizzes.orderIndex));
  }

  async getQuizzesByModule(moduleId: string): Promise<Quiz[]> {
    return db.select().from(quizzes)
      .where(eq(quizzes.moduleId, moduleId))
      .orderBy(asc(quizzes.orderIndex));
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async updateQuiz(id: string, data: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const [quiz] = await db.update(quizzes).set({ ...data, updatedAt: new Date() }).where(eq(quizzes.id, id)).returning();
    return quiz || undefined;
  }

  async deleteQuiz(id: string): Promise<boolean> {
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, id));
    await db.delete(quizzes).where(eq(quizzes.id, id));
    return true;
  }

  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    return db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId)).orderBy(asc(quizQuestions.orderIndex));
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [newQuestion] = await db.insert(quizQuestions).values(question).returning();
    return newQuestion;
  }

  async updateQuizQuestion(id: string, data: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined> {
    const [question] = await db.update(quizQuestions).set(data).where(eq(quizQuestions.id, id)).returning();
    return question || undefined;
  }

  async deleteQuizQuestion(id: string): Promise<boolean> {
    await db.delete(quizQuestions).where(eq(quizQuestions.id, id));
    return true;
  }

  async getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
    );
    return enrollment || undefined;
  }

  async getEnrollmentById(enrollmentId: string): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, enrollmentId));
    return enrollment || undefined;
  }

  async getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async getAllEnrollments(): Promise<Enrollment[]> {
    return db.select().from(enrollments);
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values({
      ...enrollment,
      progress: 0,
      completedLessons: [],
      status: 'enrolled',
    }).returning();
    
    await db.update(courses)
      .set({ enrollmentCount: sql`${courses.enrollmentCount} + 1` })
      .where(eq(courses.id, enrollment.courseId));
    
    return newEnrollment;
  }

  async updateEnrollment(id: string, data: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const [enrollment] = await db.update(enrollments).set(data).where(eq(enrollments.id, id)).returning();
    return enrollment || undefined;
  }

  async getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    return db.select().from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)))
      .orderBy(desc(quizAttempts.startedAt));
  }

  async getFailedAttemptsLast24Hours(userId: string, quizId: string): Promise<QuizAttempt[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return db.select().from(quizAttempts)
      .where(and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.quizId, quizId),
        eq(quizAttempts.passed, false),
        gt(quizAttempts.startedAt, twentyFourHoursAgo)
      ))
      .orderBy(asc(quizAttempts.startedAt));
  }

  async getAllQuizAttempts(): Promise<QuizAttempt[]> {
    return db.select().from(quizAttempts).orderBy(desc(quizAttempts.startedAt));
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return newAttempt;
  }

  async getCertificate(id: string): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.id, id));
    return certificate || undefined;
  }

  async getCertificatesByUser(userId: string): Promise<Certificate[]> {
    return db.select().from(certificates).where(eq(certificates.userId, userId));
  }

  async getAllCertificates(): Promise<Certificate[]> {
    return db.select().from(certificates);
  }

  async getCertificateByVerificationCode(code: string): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.verificationCode, code));
    return certificate || undefined;
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const verificationCode = `BMT-${randomUUID().slice(0, 8).toUpperCase()}`;
    const [newCertificate] = await db.insert(certificates).values({
      ...certificate,
      verificationCode,
    }).returning();
    return newCertificate;
  }

  async getRewardsByUser(userId: string): Promise<Reward[]> {
    return db.select().from(rewards).where(eq(rewards.userId, userId)).orderBy(desc(rewards.createdAt));
  }

  async getAllRewards(): Promise<Reward[]> {
    return db.select().from(rewards).orderBy(desc(rewards.createdAt));
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db.insert(rewards).values(reward).returning();
    return newReward;
  }

  async updateReward(id: string, data: Partial<Reward>): Promise<Reward | undefined> {
    const [reward] = await db.update(rewards).set(data).where(eq(rewards.id, id)).returning();
    return reward || undefined;
  }

  async getAboutPage(): Promise<AboutPage> {
    const [page] = await db.select().from(aboutPages).limit(1);
    if (page) return page;
    
    const [newPage] = await db.insert(aboutPages).values({
      id: 'default',
      description: defaultAboutPage.description,
      roadmap: defaultAboutPage.roadmap,
    }).returning();
    return newPage;
  }

  async updateAboutPage(data: UpdateAboutPage): Promise<AboutPage> {
    const existing = await this.getAboutPage();
    const [page] = await db.update(aboutPages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(aboutPages.id, existing.id))
      .returning();
    return page;
  }

  async createAuthNonce(walletAddress: string, nonce: string, expiresAt: Date): Promise<void> {
    await db.delete(authNonces).where(eq(authNonces.walletAddress, walletAddress));
    await db.insert(authNonces).values({ walletAddress, nonce, expiresAt });
  }

  async getAuthNonce(walletAddress: string): Promise<{ nonce: string; expiresAt: Date } | undefined> {
    const [row] = await db.select().from(authNonces)
      .where(and(
        eq(authNonces.walletAddress, walletAddress),
        gt(authNonces.expiresAt, new Date())
      ));
    if (!row) return undefined;
    return { nonce: row.nonce, expiresAt: row.expiresAt };
  }

  async deleteAuthNonce(walletAddress: string): Promise<void> {
    await db.delete(authNonces).where(eq(authNonces.walletAddress, walletAddress));
  }

  async createAuthSession(userId: string, token: string, walletAddress: string, expiresAt: Date): Promise<void> {
    await db.insert(authSessions).values({ userId, token, walletAddress, expiresAt });
  }

  async getAuthSession(token: string): Promise<{ userId: string; walletAddress: string; expiresAt: Date } | undefined> {
    const [row] = await db.select().from(authSessions)
      .where(and(
        eq(authSessions.token, token),
        gt(authSessions.expiresAt, new Date())
      ));
    if (!row) return undefined;
    return { userId: row.userId, walletAddress: row.walletAddress, expiresAt: row.expiresAt };
  }

  async deleteAuthSession(token: string): Promise<void> {
    await db.delete(authSessions).where(eq(authSessions.token, token));
  }

  async getPaymasterConfig(): Promise<PaymasterConfig | undefined> {
    const [config] = await db.select().from(paymasterConfig).where(eq(paymasterConfig.isActive, true)).limit(1);
    return config || undefined;
  }

  async createPaymasterConfig(config: InsertPaymasterConfig): Promise<PaymasterConfig> {
    const [newConfig] = await db.insert(paymasterConfig).values(config).returning();
    return newConfig;
  }

  async updatePaymasterConfig(id: string, data: UpdatePaymasterConfig): Promise<PaymasterConfig | undefined> {
    const [config] = await db.update(paymasterConfig)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymasterConfig.id, id))
      .returning();
    return config || undefined;
  }

  async updatePaymasterBalance(id: string, balance: string): Promise<PaymasterConfig | undefined> {
    const [config] = await db.update(paymasterConfig)
      .set({ cachedBalance: balance, lastBalanceCheck: new Date(), updatedAt: new Date() })
      .where(eq(paymasterConfig.id, id))
      .returning();
    return config || undefined;
  }

  async getPayoutTransaction(id: string): Promise<PayoutTransaction | undefined> {
    const [payout] = await db.select().from(payoutTransactions).where(eq(payoutTransactions.id, id));
    return payout || undefined;
  }

  async getPayoutTransactionsByUser(userId: string): Promise<PayoutTransaction[]> {
    return db.select().from(payoutTransactions)
      .where(eq(payoutTransactions.userId, userId))
      .orderBy(desc(payoutTransactions.createdAt));
  }

  async getPayoutsByReward(rewardId: string): Promise<PayoutTransaction[]> {
    return db.select().from(payoutTransactions)
      .where(eq(payoutTransactions.rewardId, rewardId))
      .orderBy(desc(payoutTransactions.createdAt));
  }

  async getPendingPayoutTransactions(): Promise<PayoutTransaction[]> {
    return db.select().from(payoutTransactions)
      .where(eq(payoutTransactions.status, 'pending'))
      .orderBy(asc(payoutTransactions.createdAt));
  }

  async getAllPayoutTransactions(): Promise<PayoutTransaction[]> {
    return db.select().from(payoutTransactions).orderBy(desc(payoutTransactions.createdAt));
  }

  async createPayoutTransaction(payout: InsertPayoutTransaction): Promise<PayoutTransaction> {
    const [newPayout] = await db.insert(payoutTransactions).values(payout).returning();
    return newPayout;
  }

  async updatePayoutTransaction(id: string, data: Partial<PayoutTransaction>): Promise<PayoutTransaction | undefined> {
    const [payout] = await db.update(payoutTransactions)
      .set(data)
      .where(eq(payoutTransactions.id, id))
      .returning();
    return payout || undefined;
  }

  async claimPayoutForProcessing(id: string): Promise<PayoutTransaction | null> {
    const [payout] = await db.update(payoutTransactions)
      .set({ status: 'processing' })
      .where(and(
        eq(payoutTransactions.id, id),
        eq(payoutTransactions.status, 'pending')
      ))
      .returning();
    return payout || null;
  }

  async releasePayoutFromProcessing(id: string): Promise<boolean> {
    const [payout] = await db.update(payoutTransactions)
      .set({ status: 'pending' })
      .where(and(
        eq(payoutTransactions.id, id),
        eq(payoutTransactions.status, 'processing')
      ))
      .returning();
    return !!payout;
  }

  async completePayoutFromProcessing(id: string, txHash: string, blockNumber?: number): Promise<PayoutTransaction | null> {
    const [payout] = await db.update(payoutTransactions)
      .set({ 
        status: 'completed',
        txHash,
        blockNumber: blockNumber || null,
        processedAt: new Date(),
      })
      .where(and(
        eq(payoutTransactions.id, id),
        eq(payoutTransactions.status, 'processing')
      ))
      .returning();
    return payout || null;
  }

  async failPayoutFromProcessing(id: string, errorMessage: string): Promise<PayoutTransaction | null> {
    const [payout] = await db.update(payoutTransactions)
      .set({ 
        status: 'failed',
        errorMessage,
        processedAt: new Date(),
      })
      .where(and(
        eq(payoutTransactions.id, id),
        eq(payoutTransactions.status, 'processing')
      ))
      .returning();
    return payout || null;
  }

  // Anti-abuse: Check if user already received reward for a course
  async hasUserCompletedCourseReward(userId: string, courseId: string): Promise<boolean> {
    const [existingReward] = await db.select().from(rewards)
      .where(and(
        eq(rewards.userId, userId),
        eq(rewards.courseId, courseId),
        eq(rewards.type, 'course_completion')
      ));
    return !!existingReward;
  }

  async getRewardByUserAndCourse(userId: string, courseId: string): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards)
      .where(and(
        eq(rewards.userId, userId),
        eq(rewards.courseId, courseId)
      ));
    return reward || undefined;
  }

  // Device fingerprint methods
  async saveDeviceFingerprint(data: {
    fingerprintHash: string;
    userId: string;
    walletAddress: string;
    ipAddress?: string;
    userAgent?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
  }): Promise<DeviceFingerprint> {
    // Check if this fingerprint already exists for this user
    const [existing] = await db.select().from(deviceFingerprints)
      .where(and(
        eq(deviceFingerprints.fingerprintHash, data.fingerprintHash),
        eq(deviceFingerprints.userId, data.userId)
      ));
    
    if (existing) {
      // Update last seen
      const [updated] = await db.update(deviceFingerprints)
        .set({ lastSeenAt: new Date() })
        .where(eq(deviceFingerprints.id, existing.id))
        .returning();
      return updated;
    }
    
    // Create new fingerprint record
    const [fingerprint] = await db.insert(deviceFingerprints).values(data).returning();
    return fingerprint;
  }

  async getDeviceFingerprintsByHash(fingerprintHash: string): Promise<DeviceFingerprint[]> {
    return db.select().from(deviceFingerprints)
      .where(eq(deviceFingerprints.fingerprintHash, fingerprintHash))
      .orderBy(desc(deviceFingerprints.createdAt));
  }

  async getDeviceFingerprintsByIp(ipAddress: string): Promise<DeviceFingerprint[]> {
    return db.select().from(deviceFingerprints)
      .where(eq(deviceFingerprints.ipAddress, ipAddress))
      .orderBy(desc(deviceFingerprints.createdAt));
  }

  async getDeviceFingerprintsByUser(userId: string): Promise<DeviceFingerprint[]> {
    return db.select().from(deviceFingerprints)
      .where(eq(deviceFingerprints.userId, userId))
      .orderBy(desc(deviceFingerprints.createdAt));
  }

  // Suspicious activity methods
  async logSuspiciousActivity(activity: InsertSuspiciousActivity): Promise<SuspiciousActivity> {
    const [newActivity] = await db.insert(suspiciousActivity).values(activity).returning();
    return newActivity;
  }

  async getSuspiciousActivityByUser(userId: string): Promise<SuspiciousActivity[]> {
    return db.select().from(suspiciousActivity)
      .where(eq(suspiciousActivity.userId, userId))
      .orderBy(desc(suspiciousActivity.createdAt));
  }

  async getSuspiciousActivityByFingerprint(fingerprintHash: string): Promise<SuspiciousActivity[]> {
    return db.select().from(suspiciousActivity)
      .where(eq(suspiciousActivity.fingerprintHash, fingerprintHash))
      .orderBy(desc(suspiciousActivity.createdAt));
  }

  // Referral program methods
  async getReferralSettings(): Promise<ReferralSettings | undefined> {
    const [settings] = await db.select().from(referralSettings).limit(1);
    return settings || undefined;
  }

  async updateReferralSettings(data: UpdateReferralSettings): Promise<ReferralSettings> {
    const existing = await this.getReferralSettings();
    if (existing) {
      const [updated] = await db.update(referralSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(referralSettings.id, existing.id))
        .returning();
      return updated;
    }
    // Create default settings with updates applied
    const [newSettings] = await db.insert(referralSettings)
      .values({
        isEnabled: data.isEnabled ?? true,
        rewardAmount: data.rewardAmount ?? 100,
        triggerAction: data.triggerAction ?? 'enrollment',
        referrerRewardAmount: data.referrerRewardAmount ?? 100,
        refereeRewardAmount: data.refereeRewardAmount ?? 50,
        maxReferralsPerUser: data.maxReferralsPerUser ?? null,
        codeExpirationDays: data.codeExpirationDays ?? null,
      })
      .returning();
    return newSettings;
  }

  async getReferralCode(userId: string): Promise<ReferralCode | undefined> {
    const [code] = await db.select().from(referralCodes)
      .where(and(eq(referralCodes.userId, userId), eq(referralCodes.isActive, true)));
    return code || undefined;
  }

  async getReferralCodeByCode(code: string): Promise<ReferralCode | undefined> {
    const [referralCode] = await db.select().from(referralCodes)
      .where(eq(referralCodes.code, code));
    return referralCode || undefined;
  }

  async createReferralCode(data: InsertReferralCode): Promise<ReferralCode> {
    const [code] = await db.insert(referralCodes).values(data).returning();
    return code;
  }

  async incrementReferralCodeUseCount(codeId: string): Promise<void> {
    await db.update(referralCodes)
      .set({ useCount: sql`${referralCodes.useCount} + 1` })
      .where(eq(referralCodes.id, codeId));
  }

  async getReferral(referrerId: string, referredUserId: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals)
      .where(and(eq(referrals.referrerId, referrerId), eq(referrals.referredUserId, referredUserId)));
    return referral || undefined;
  }

  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    return db.select().from(referrals)
      .where(eq(referrals.referrerId, referrerId))
      .orderBy(desc(referrals.createdAt));
  }

  async getReferralByReferredUser(referredUserId: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals)
      .where(eq(referrals.referredUserId, referredUserId));
    return referral || undefined;
  }

  async createReferral(data: InsertReferral): Promise<Referral> {
    const [referral] = await db.insert(referrals).values(data).returning();
    return referral;
  }

  async updateReferral(id: string, data: Partial<Referral>): Promise<Referral | undefined> {
    const [referral] = await db.update(referrals)
      .set(data)
      .where(eq(referrals.id, id))
      .returning();
    return referral || undefined;
  }

  async getReferralStats(userId: string): Promise<{ totalReferrals: number; pendingReferrals: number; qualifiedReferrals: number; rewardedReferrals: number; totalBmtEarned: number }> {
    const userReferrals = await this.getReferralsByReferrer(userId);
    
    const pendingReferrals = userReferrals.filter(r => r.status === 'pending').length;
    const qualifiedReferrals = userReferrals.filter(r => r.status === 'qualified').length;
    const rewardedReferrals = userReferrals.filter(r => r.status === 'rewarded').length;
    
    // Get total BMT earned from referral rewards
    const referralRewards = await db.select().from(rewards)
      .where(and(
        eq(rewards.userId, userId),
        eq(rewards.type, 'referral_bonus')
      ));
    
    const totalBmtEarned = referralRewards.reduce((sum, r) => sum + r.amount, 0);
    
    return {
      totalReferrals: userReferrals.length,
      pendingReferrals,
      qualifiedReferrals,
      rewardedReferrals,
      totalBmtEarned,
    };
  }

  async getAllReferrals(): Promise<Referral[]> {
    return await db.select().from(referrals).orderBy(desc(referrals.createdAt));
  }
}

async function seedDatabase(storage: DatabaseStorage) {
  const existingCourses = await storage.getAllCourses({});
  if (existingCourses.length > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }
  
  console.log('Seeding database with sample data...');
  
  for (const course of sampleCourses) {
    await db.insert(courses).values({
      id: course.id,
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription,
      category: course.category,
      difficulty: course.difficulty,
      duration: course.duration,
      bmtReward: course.bmtReward,
      isPublished: course.isPublished,
      enrollmentCount: 0,
    }).onConflictDoNothing();
  }
  
  for (const lesson of sampleLessons) {
    await db.insert(lessons).values({
      id: lesson.id,
      courseId: lesson.courseId,
      title: lesson.title,
      content: lesson.content,
      orderIndex: lesson.orderIndex,
      duration: lesson.duration,
    }).onConflictDoNothing();
  }
  
  for (const quiz of sampleQuizzes) {
    await db.insert(quizzes).values({
      id: quiz.id,
      courseId: quiz.courseId,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      maxAttempts: quiz.maxAttempts,
    }).onConflictDoNothing();
  }
  
  for (const question of sampleQuizQuestions) {
    await db.insert(quizQuestions).values({
      id: question.id,
      quizId: question.quizId,
      question: question.question,
      options: question.options,
      explanation: question.explanation,
      orderIndex: question.orderIndex,
    }).onConflictDoNothing();
  }
  
  console.log('Database seeding complete!');
}

const databaseStorage = new DatabaseStorage();

seedDatabase(databaseStorage).catch(console.error);

export const storage: IStorage = databaseStorage;
