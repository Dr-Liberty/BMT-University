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
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Courses
  getCourse(id: string): Promise<Course | undefined>;
  getAllCourses(filters?: { category?: string; difficulty?: string; isPublished?: boolean }): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;
  
  // Lessons
  getLesson(id: string): Promise<Lesson | undefined>;
  getLessonsByCourse(courseId: string): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: string): Promise<boolean>;
  
  // Quizzes
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizByCourse(courseId: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: string, data: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  
  // Quiz Questions
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  updateQuizQuestion(id: string, data: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined>;
  deleteQuizQuestion(id: string): Promise<boolean>;
  
  // Enrollments
  getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined>;
  getEnrollmentsByUser(userId: string): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: string, data: Partial<Enrollment>): Promise<Enrollment | undefined>;
  
  // Quiz Attempts
  getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]>;
  getAllQuizAttempts(): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  
  // Certificates
  getCertificate(id: string): Promise<Certificate | undefined>;
  getCertificatesByUser(userId: string): Promise<Certificate[]>;
  getAllCertificates(): Promise<Certificate[]>;
  getCertificateByVerificationCode(code: string): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  
  // Rewards
  getRewardsByUser(userId: string): Promise<Reward[]>;
  getAllRewards(): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: string, data: Partial<Reward>): Promise<Reward | undefined>;
  
  // About Page
  getAboutPage(): Promise<AboutPage>;
  updateAboutPage(data: UpdateAboutPage): Promise<AboutPage>;
  
  // Auth
  createAuthNonce(walletAddress: string, nonce: string, expiresAt: Date): Promise<void>;
  getAuthNonce(walletAddress: string): Promise<{ nonce: string; expiresAt: Date } | undefined>;
  deleteAuthNonce(walletAddress: string): Promise<void>;
  createAuthSession(userId: string, token: string, walletAddress: string, expiresAt: Date): Promise<void>;
  getAuthSession(token: string): Promise<{ userId: string; walletAddress: string; expiresAt: Date } | undefined>;
  deleteAuthSession(token: string): Promise<void>;
}

// Default about page content
const defaultAboutPage: AboutPage = {
  id: 'default',
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

// Sample courses for demo
const sampleCourses: Course[] = [
  {
    id: '1',
    title: 'Kaspa Blockchain Fundamentals',
    description: 'Learn the basics of Kaspa blockchain technology, including the blockDAG architecture, GHOSTDAG protocol, and what makes Kaspa unique.',
    shortDescription: 'Master the fundamentals of Kaspa blockchain',
    thumbnail: null,
    category: 'blockchain',
    difficulty: 'beginner',
    instructorId: null,
    duration: 120,
    bmtReward: 5000,
    isPublished: true,
    enrollmentCount: 247,
    rating: '4.8',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Understanding $BMT Tokenomics',
    description: 'Deep dive into Bitcoin Maxi Tears token economics, including supply, distribution, and utility within the BMT University ecosystem.',
    shortDescription: 'Explore $BMT token mechanics and value',
    thumbnail: null,
    category: 'tokenomics',
    difficulty: 'intermediate',
    instructorId: null,
    duration: 90,
    bmtReward: 7500,
    isPublished: true,
    enrollmentCount: 183,
    rating: '4.6',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'Kasplex Token Development',
    description: 'Learn how to create, deploy, and manage tokens on the Kasplex protocol. Build your own token from scratch.',
    shortDescription: 'Build tokens on Kasplex protocol',
    thumbnail: null,
    category: 'development',
    difficulty: 'advanced',
    instructorId: null,
    duration: 180,
    bmtReward: 15000,
    isPublished: true,
    enrollmentCount: 89,
    rating: '4.9',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    title: 'BlockDAG Technology Explained',
    description: 'Understand the revolutionary blockDAG architecture that enables Kaspa to achieve unprecedented transaction speeds while maintaining security.',
    shortDescription: 'Deep dive into blockDAG architecture',
    thumbnail: null,
    category: 'blockchain',
    difficulty: 'intermediate',
    instructorId: null,
    duration: 150,
    bmtReward: 10000,
    isPublished: true,
    enrollmentCount: 156,
    rating: '4.7',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Sample lessons
const sampleLessons: Lesson[] = [
  {
    id: '1-1',
    courseId: '1',
    title: 'Introduction to Kaspa',
    content: 'Welcome to Kaspa Blockchain Fundamentals! In this lesson, we will explore what makes Kaspa unique...',
    videoUrl: null,
    orderIndex: 0,
    duration: 15,
    createdAt: new Date(),
  },
  {
    id: '1-2',
    courseId: '1',
    title: 'Understanding BlockDAG',
    content: 'BlockDAG (Directed Acyclic Graph) is the core innovation behind Kaspa...',
    videoUrl: null,
    orderIndex: 1,
    duration: 20,
    createdAt: new Date(),
  },
  {
    id: '1-3',
    courseId: '1',
    title: 'GHOSTDAG Protocol',
    content: 'The GHOSTDAG protocol is what allows Kaspa to process blocks in parallel...',
    videoUrl: null,
    orderIndex: 2,
    duration: 25,
    createdAt: new Date(),
  },
];

// Sample quiz
const sampleQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    courseId: '1',
    title: 'Kaspa Fundamentals Quiz',
    description: 'Test your knowledge of Kaspa blockchain basics',
    passingScore: 70,
    timeLimit: 600,
    maxAttempts: 3,
    createdAt: new Date(),
  },
];

// Sample quiz questions
const sampleQuizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
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
    id: 'q2',
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
    id: 'q3',
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
    id: 'q4',
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
    id: 'q5',
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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private courses: Map<string, Course>;
  private lessons: Map<string, Lesson>;
  private quizzes: Map<string, Quiz>;
  private quizQuestions: Map<string, QuizQuestion>;
  private enrollments: Map<string, Enrollment>;
  private quizAttempts: Map<string, QuizAttempt>;
  private certificates: Map<string, Certificate>;
  private rewards: Map<string, Reward>;
  private aboutPage: AboutPage;
  private authNonces: Map<string, { nonce: string; expiresAt: Date }>;
  private authSessions: Map<string, { userId: string; walletAddress: string; expiresAt: Date }>;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.lessons = new Map();
    this.quizzes = new Map();
    this.quizQuestions = new Map();
    this.enrollments = new Map();
    this.quizAttempts = new Map();
    this.certificates = new Map();
    this.rewards = new Map();
    this.aboutPage = { ...defaultAboutPage };
    this.authNonces = new Map();
    this.authSessions = new Map();

    // Initialize with sample data
    sampleCourses.forEach(course => this.courses.set(course.id, course));
    sampleLessons.forEach(lesson => this.lessons.set(lesson.id, lesson));
    sampleQuizzes.forEach(quiz => this.quizzes.set(quiz.id, quiz));
    sampleQuizQuestions.forEach(q => this.quizQuestions.set(q.id, q));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.walletAddress === walletAddress);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      walletAddress: insertUser.walletAddress || null,
      displayName: insertUser.displayName || null,
      role: insertUser.role || 'student',
      avatarUrl: insertUser.avatarUrl || null,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  // Courses
  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getAllCourses(filters?: { category?: string; difficulty?: string; isPublished?: boolean }): Promise<Course[]> {
    let courses = Array.from(this.courses.values());
    if (filters?.category) {
      courses = courses.filter(c => c.category === filters.category);
    }
    if (filters?.difficulty) {
      courses = courses.filter(c => c.difficulty === filters.difficulty);
    }
    if (filters?.isPublished !== undefined) {
      courses = courses.filter(c => c.isPublished === filters.isPublished);
    }
    return courses;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = randomUUID();
    const newCourse: Course = {
      id,
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription || null,
      thumbnail: course.thumbnail || null,
      category: course.category,
      difficulty: course.difficulty || 'beginner',
      instructorId: course.instructorId || null,
      duration: course.duration || null,
      bmtReward: course.bmtReward || 0,
      isPublished: course.isPublished || false,
      enrollmentCount: 0,
      rating: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    const updated = { ...course, ...data, updatedAt: new Date() };
    this.courses.set(id, updated);
    return updated;
  }

  async deleteCourse(id: string): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Lessons
  async getLesson(id: string): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }

  async getLessonsByCourse(courseId: string): Promise<Lesson[]> {
    return Array.from(this.lessons.values())
      .filter(l => l.courseId === courseId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const id = randomUUID();
    const newLesson: Lesson = {
      id,
      courseId: lesson.courseId,
      title: lesson.title,
      content: lesson.content,
      videoUrl: lesson.videoUrl || null,
      orderIndex: lesson.orderIndex ?? 0,
      duration: lesson.duration || null,
      createdAt: new Date(),
    };
    this.lessons.set(id, newLesson);
    return newLesson;
  }

  async updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const lesson = this.lessons.get(id);
    if (!lesson) return undefined;
    const updated = { ...lesson, ...data };
    this.lessons.set(id, updated);
    return updated;
  }

  async deleteLesson(id: string): Promise<boolean> {
    return this.lessons.delete(id);
  }

  // Quizzes
  async getQuiz(id: string): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async getQuizByCourse(courseId: string): Promise<Quiz | undefined> {
    return Array.from(this.quizzes.values()).find(q => q.courseId === courseId);
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const id = randomUUID();
    const newQuiz: Quiz = {
      id,
      courseId: quiz.courseId,
      title: quiz.title,
      description: quiz.description || null,
      passingScore: quiz.passingScore ?? 70,
      timeLimit: quiz.timeLimit || null,
      maxAttempts: quiz.maxAttempts || null,
      createdAt: new Date(),
    };
    this.quizzes.set(id, newQuiz);
    return newQuiz;
  }

  async updateQuiz(id: string, data: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const quiz = this.quizzes.get(id);
    if (!quiz) return undefined;
    const updated = { ...quiz, ...data };
    this.quizzes.set(id, updated);
    return updated;
  }

  // Quiz Questions
  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    return Array.from(this.quizQuestions.values())
      .filter(q => q.quizId === quizId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const id = randomUUID();
    const newQuestion: QuizQuestion = {
      id,
      quizId: question.quizId,
      question: question.question,
      options: question.options,
      explanation: question.explanation || null,
      orderIndex: question.orderIndex ?? 0,
    };
    this.quizQuestions.set(id, newQuestion);
    return newQuestion;
  }

  async updateQuizQuestion(id: string, data: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined> {
    const question = this.quizQuestions.get(id);
    if (!question) return undefined;
    const updated = { ...question, ...data };
    this.quizQuestions.set(id, updated);
    return updated;
  }

  async deleteQuizQuestion(id: string): Promise<boolean> {
    return this.quizQuestions.delete(id);
  }

  // Enrollments
  async getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    return Array.from(this.enrollments.values()).find(
      e => e.userId === userId && e.courseId === courseId
    );
  }

  async getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(e => e.userId === userId);
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const id = randomUUID();
    const newEnrollment: Enrollment = {
      ...enrollment,
      id,
      progress: 0,
      completedLessons: [],
      status: 'enrolled',
      enrolledAt: new Date(),
      completedAt: null,
    };
    this.enrollments.set(id, newEnrollment);
    
    // Increment course enrollment count
    const course = this.courses.get(enrollment.courseId);
    if (course) {
      course.enrollmentCount += 1;
      this.courses.set(course.id, course);
    }
    
    return newEnrollment;
  }

  async updateEnrollment(id: string, data: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    const updated = { ...enrollment, ...data };
    this.enrollments.set(id, updated);
    return updated;
  }

  // Quiz Attempts
  async getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values())
      .filter(a => a.userId === userId && a.quizId === quizId)
      .sort((a, b) => new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime());
  }

  async getAllQuizAttempts(): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values())
      .sort((a, b) => new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime());
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const id = randomUUID();
    const newAttempt: QuizAttempt = {
      ...attempt,
      id,
      startedAt: new Date(),
      completedAt: new Date(),
    };
    this.quizAttempts.set(id, newAttempt);
    return newAttempt;
  }

  // Certificates
  async getCertificate(id: string): Promise<Certificate | undefined> {
    return this.certificates.get(id);
  }

  async getCertificatesByUser(userId: string): Promise<Certificate[]> {
    return Array.from(this.certificates.values()).filter(c => c.userId === userId);
  }

  async getAllCertificates(): Promise<Certificate[]> {
    return Array.from(this.certificates.values());
  }

  async getCertificateByVerificationCode(code: string): Promise<Certificate | undefined> {
    return Array.from(this.certificates.values()).find(c => c.verificationCode === code);
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const id = randomUUID();
    const verificationCode = `BMT-${randomUUID().slice(0, 8).toUpperCase()}`;
    const newCertificate: Certificate = {
      ...certificate,
      id,
      quizAttemptId: certificate.quizAttemptId || null,
      txHash: certificate.txHash || null,
      verificationCode,
      issuedAt: new Date(),
    };
    this.certificates.set(id, newCertificate);
    return newCertificate;
  }

  // Rewards
  async getRewardsByUser(userId: string): Promise<Reward[]> {
    return Array.from(this.rewards.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getAllRewards(): Promise<Reward[]> {
    return Array.from(this.rewards.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const id = randomUUID();
    const newReward: Reward = {
      ...reward,
      id,
      courseId: reward.courseId || null,
      status: 'pending',
      txHash: null,
      createdAt: new Date(),
      processedAt: null,
    };
    this.rewards.set(id, newReward);
    return newReward;
  }

  async updateReward(id: string, data: Partial<Reward>): Promise<Reward | undefined> {
    const reward = this.rewards.get(id);
    if (!reward) return undefined;
    const updated = { ...reward, ...data };
    this.rewards.set(id, updated);
    return updated;
  }

  // About Page
  async getAboutPage(): Promise<AboutPage> {
    return this.aboutPage;
  }

  async updateAboutPage(data: UpdateAboutPage): Promise<AboutPage> {
    this.aboutPage = {
      ...this.aboutPage,
      description: data.description,
      roadmap: data.roadmap,
      updatedAt: new Date(),
    };
    return this.aboutPage;
  }

  // Auth
  async createAuthNonce(walletAddress: string, nonce: string, expiresAt: Date): Promise<void> {
    this.authNonces.set(walletAddress, { nonce, expiresAt });
  }

  async getAuthNonce(walletAddress: string): Promise<{ nonce: string; expiresAt: Date } | undefined> {
    return this.authNonces.get(walletAddress);
  }

  async deleteAuthNonce(walletAddress: string): Promise<void> {
    this.authNonces.delete(walletAddress);
  }

  async createAuthSession(userId: string, token: string, walletAddress: string, expiresAt: Date): Promise<void> {
    this.authSessions.set(token, { userId, walletAddress, expiresAt });
  }

  async getAuthSession(token: string): Promise<{ userId: string; walletAddress: string; expiresAt: Date } | undefined> {
    return this.authSessions.get(token);
  }

  async deleteAuthSession(token: string): Promise<void> {
    this.authSessions.delete(token);
  }
}

export const storage = new MemStorage();
