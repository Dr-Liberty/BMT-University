import { 
  type User, type InsertUser, 
  type AboutPage, type UpdateAboutPage, type RoadmapItem,
  type Course, type InsertCourse,
  type Lesson, type InsertLesson,
  type Quiz, type InsertQuiz,
  type QuizQuestion, type InsertQuizQuestion,
  type Enrollment, type InsertEnrollment,
  type QuizAttempt, type InsertQuizAttempt,
  type Certificate, type InsertCertificate,
  type Reward, type InsertReward,
  users, courses, lessons, quizzes, quizQuestions, 
  enrollments, quizAttempts, certificates, rewards,
  aboutPages, authNonces, authSessions,
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
  getAllCourses(filters?: { category?: string; difficulty?: string; isPublished?: boolean }): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;
  
  getLesson(id: string): Promise<Lesson | undefined>;
  getLessonsByCourse(courseId: string): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: string): Promise<boolean>;
  
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizByCourse(courseId: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: string, data: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  updateQuizQuestion(id: string, data: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined>;
  deleteQuizQuestion(id: string): Promise<boolean>;
  
  getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined>;
  getEnrollmentsByUser(userId: string): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: string, data: Partial<Enrollment>): Promise<Enrollment | undefined>;
  
  getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]>;
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

  async getAllCourses(filters?: { category?: string; difficulty?: string; isPublished?: boolean }): Promise<Course[]> {
    let query = db.select().from(courses);
    
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
    
    if (conditions.length > 0) {
      return db.select().from(courses).where(and(...conditions));
    }
    return db.select().from(courses);
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

  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson || undefined;
  }

  async getLessonsByCourse(courseId: string): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.orderIndex));
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

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async getQuizByCourse(courseId: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.courseId, courseId));
    return quiz || undefined;
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async updateQuiz(id: string, data: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const [quiz] = await db.update(quizzes).set(data).where(eq(quizzes.id, id)).returning();
    return quiz || undefined;
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

  async getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.userId, userId));
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
