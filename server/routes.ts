import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { updateAboutPageSchema, insertCourseSchema, insertModuleSchema, insertLessonSchema, insertQuizSchema, insertQuizQuestionSchema, insertEnrollmentSchema, insertPaymasterConfigSchema, updatePaymasterConfigSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { z } from "zod";
import { randomBytes } from "crypto";
import { 
  getERC20Balance, 
  getERC20TokenInfo, 
  formatTokenAmount, 
  transferERC20, 
  isPaymasterConfigured, 
  getPaymasterWalletAddress,
  getNativeBalance,
  parseTokenAmount,
  getNetworkInfo,
  getKaspacomTokenData
} from "./kasplex";

// Auth middleware (simplified for demo - wallet verification would be added in production)
async function authMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const session = await storage.getAuthSession(token);
  if (!session || new Date() > session.expiresAt) {
    return res.status(401).json({ error: 'Session expired' });
  }
  
  const user = await storage.getUser(session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  req.user = user;
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============ ABOUT PAGE ============
  app.get("/api/about", async (req, res) => {
    try {
      const aboutPage = await storage.getAboutPage();
      res.json(aboutPage);
    } catch (error) {
      console.error("Error fetching about page:", error);
      res.status(500).json({ error: "Failed to fetch about page content" });
    }
  });

  app.put("/api/about", async (req, res) => {
    try {
      const result = updateAboutPageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).message });
      }
      const updatedPage = await storage.updateAboutPage(result.data);
      res.json(updatedPage);
    } catch (error) {
      console.error("Error updating about page:", error);
      res.status(500).json({ error: "Failed to update about page content" });
    }
  });

  // ============ AUTH ============
  app.post("/api/auth/nonce", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }
      
      const nonce = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await storage.createAuthNonce(walletAddress, nonce, expiresAt);
      
      res.json({ 
        nonce,
        message: `Sign this message to authenticate with BMT University: ${nonce}`
      });
    } catch (error) {
      console.error("Error creating nonce:", error);
      res.status(500).json({ error: "Failed to create auth nonce" });
    }
  });

  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { walletAddress, signature } = req.body;
      if (!walletAddress || !signature) {
        return res.status(400).json({ error: "Wallet address and signature required" });
      }
      
      const storedNonce = await storage.getAuthNonce(walletAddress);
      if (!storedNonce || new Date() > storedNonce.expiresAt) {
        return res.status(400).json({ error: "Nonce expired or not found" });
      }
      
      // In production, verify signature here using Kaspa/Kasplex wallet SDK
      // For now, accept any signature for demo purposes
      
      await storage.deleteAuthNonce(walletAddress);
      
      // Find or create user
      let user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        user = await storage.createUser({
          walletAddress,
          role: 'student',
        });
      }
      
      // Create session
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await storage.createAuthSession(user.id, token, walletAddress, expiresAt);
      
      res.json({ token, user });
    } catch (error) {
      console.error("Error verifying auth:", error);
      res.status(500).json({ error: "Failed to verify authentication" });
    }
  });

  app.post("/api/auth/logout", authMiddleware, async (req: any, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await storage.deleteAuthSession(token);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req: any, res) => {
    res.json(req.user);
  });

  // ============ COURSES ============
  app.get("/api/courses", async (req, res) => {
    try {
      const { category, difficulty } = req.query;
      const courses = await storage.getAllCourses({
        category: category as string,
        difficulty: difficulty as string,
        isPublished: true,
      });
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      const lessons = await storage.getLessonsByCourse(req.params.id);
      const quiz = await storage.getQuizByCourse(req.params.id);
      
      let quizWithQuestions: (typeof quiz & { questions?: unknown[] }) | null = quiz || null;
      if (quiz) {
        const questions = await storage.getQuizQuestions(quiz.id);
        const safeQuestions = questions.map(q => ({
          ...q,
          options: q.options.map(o => ({ id: o.id, text: o.text })),
        }));
        quizWithQuestions = { ...quiz, questions: safeQuestions };
      }
      
      res.json({ ...course, lessons, quiz: quizWithQuestions });
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Only instructors can create courses" });
      }
      
      const result = insertCourseSchema.safeParse({
        ...req.body,
        instructorId: req.user.id,
      });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).message });
      }
      
      const course = await storage.createCourse(result.data);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", authMiddleware, async (req: any, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to edit this course" });
      }
      
      const updated = await storage.updateCourse(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  // ============ MODULES ============
  app.get("/api/courses/:courseId/modules", async (req, res) => {
    try {
      const modules = await storage.getModulesByCourse(req.params.courseId);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  app.get("/api/modules/:id", async (req, res) => {
    try {
      const module = await storage.getModule(req.params.id);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      const lessons = await storage.getLessonsByModule(req.params.id);
      const quizzes = await storage.getQuizzesByModule(req.params.id);
      res.json({ ...module, lessons, quizzes });
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ error: "Failed to fetch module" });
    }
  });

  app.post("/api/courses/:courseId/modules", authMiddleware, async (req: any, res) => {
    try {
      const course = await storage.getCourse(req.params.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to add modules" });
      }
      
      const existingModules = await storage.getModulesByCourse(req.params.courseId);
      const orderIndex = existingModules.length;
      
      const result = insertModuleSchema.safeParse({
        ...req.body,
        courseId: req.params.courseId,
        orderIndex,
      });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).message });
      }
      
      const module = await storage.createModule(result.data);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ error: "Failed to create module" });
    }
  });

  app.put("/api/modules/:id", authMiddleware, async (req: any, res) => {
    try {
      const module = await storage.getModule(req.params.id);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      const course = await storage.getCourse(module.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to edit this module" });
      }
      
      const updated = await storage.updateModule(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(500).json({ error: "Failed to update module" });
    }
  });

  app.delete("/api/modules/:id", authMiddleware, async (req: any, res) => {
    try {
      const module = await storage.getModule(req.params.id);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      const course = await storage.getCourse(module.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to delete this module" });
      }
      
      await storage.deleteModule(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ error: "Failed to delete module" });
    }
  });

  app.post("/api/courses/:courseId/modules/reorder", authMiddleware, async (req: any, res) => {
    try {
      const course = await storage.getCourse(req.params.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to reorder modules" });
      }
      
      const { moduleIds } = req.body;
      if (!Array.isArray(moduleIds)) {
        return res.status(400).json({ error: "moduleIds must be an array" });
      }
      
      await storage.reorderModules(req.params.courseId, moduleIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering modules:", error);
      res.status(500).json({ error: "Failed to reorder modules" });
    }
  });

  // ============ LESSONS ============
  app.get("/api/courses/:courseId/lessons", async (req, res) => {
    try {
      const lessons = await storage.getLessonsByCourse(req.params.courseId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.get("/api/modules/:moduleId/lessons", async (req, res) => {
    try {
      const lessons = await storage.getLessonsByModule(req.params.moduleId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  app.post("/api/courses/:courseId/lessons", authMiddleware, async (req: any, res) => {
    try {
      const course = await storage.getCourse(req.params.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to add lessons" });
      }
      
      const existingLessons = await storage.getLessonsByCourse(req.params.courseId);
      const orderIndex = existingLessons.length;
      
      const result = insertLessonSchema.safeParse({
        ...req.body,
        courseId: req.params.courseId,
        orderIndex,
      });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).message });
      }
      
      const lesson = await storage.createLesson(result.data);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  app.post("/api/modules/:moduleId/lessons", authMiddleware, async (req: any, res) => {
    try {
      const module = await storage.getModule(req.params.moduleId);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      const course = await storage.getCourse(module.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to add lessons" });
      }
      
      const existingLessons = await storage.getLessonsByModule(req.params.moduleId);
      const orderIndex = existingLessons.length;
      
      const result = insertLessonSchema.safeParse({
        ...req.body,
        courseId: module.courseId,
        moduleId: req.params.moduleId,
        orderIndex,
      });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).message });
      }
      
      const lesson = await storage.createLesson(result.data);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  app.put("/api/lessons/:id", authMiddleware, async (req: any, res) => {
    try {
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      const course = await storage.getCourse(lesson.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to edit this lesson" });
      }
      
      const updated = await storage.updateLesson(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });

  app.delete("/api/lessons/:id", authMiddleware, async (req: any, res) => {
    try {
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      const course = await storage.getCourse(lesson.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to delete this lesson" });
      }
      
      await storage.deleteLesson(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  app.post("/api/modules/:moduleId/lessons/reorder", authMiddleware, async (req: any, res) => {
    try {
      const module = await storage.getModule(req.params.moduleId);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      const course = await storage.getCourse(module.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to reorder lessons" });
      }
      
      const { lessonIds } = req.body;
      if (!Array.isArray(lessonIds)) {
        return res.status(400).json({ error: "lessonIds must be an array" });
      }
      
      await storage.reorderLessons(req.params.moduleId, lessonIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering lessons:", error);
      res.status(500).json({ error: "Failed to reorder lessons" });
    }
  });

  // ============ LESSON PROGRESS ============
  app.get("/api/courses/:courseId/progress", authMiddleware, async (req: any, res) => {
    try {
      const progress = await storage.getLessonProgressByCourse(req.user.id, req.params.courseId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/lessons/:id/complete", authMiddleware, async (req: any, res) => {
    try {
      const progress = await storage.markLessonComplete(req.user.id, req.params.id);
      
      // Update enrollment progress
      const lesson = await storage.getLesson(req.params.id);
      let reward = null;
      let certificate = null;
      let payoutTransaction = null;
      
      if (lesson) {
        const enrollment = await storage.getEnrollment(req.user.id, lesson.courseId);
        if (enrollment) {
          const allLessons = await storage.getLessonsByCourse(lesson.courseId);
          const completedProgress = await storage.getLessonProgressByCourse(req.user.id, lesson.courseId);
          const completedCount = completedProgress.filter(p => p.status === 'completed').length;
          const progressPercent = Math.round((completedCount / allLessons.length) * 100);
          
          const completedLessons = [...new Set([...(enrollment.completedLessons || []), req.params.id])];
          await storage.updateEnrollment(enrollment.id, {
            progress: progressPercent,
            completedLessons,
            currentLessonId: req.params.id,
            lastAccessedAt: new Date(),
            status: progressPercent === 100 ? 'completed' : 'in_progress',
          });
          
          // If 100% complete and NO quiz exists, auto-issue certificate and reward
          if (progressPercent === 100) {
            const quiz = await storage.getQuizByCourse(lesson.courseId);
            
            if (!quiz) {
              // No quiz - issue certificate and reward upon lesson completion
              const course = await storage.getCourse(lesson.courseId);
              const alreadyRewarded = await storage.hasUserCompletedCourseReward(req.user.id, lesson.courseId);
              
              if (course && !alreadyRewarded && course.bmtReward > 0) {
                // Create reward
                reward = await storage.createReward({
                  userId: req.user.id,
                  courseId: lesson.courseId,
                  amount: course.bmtReward,
                  type: 'course_completion',
                });
                
                // Create payout transaction
                payoutTransaction = await storage.createPayoutTransaction({
                  rewardId: reward.id,
                  userId: req.user.id,
                  amount: course.bmtReward,
                  recipientAddress: req.user.walletAddress,
                });
                
                // Issue certificate
                certificate = await storage.createCertificate({
                  userId: req.user.id,
                  courseId: lesson.courseId,
                });
                
                console.log(`[Auto-Reward] Issued certificate and ${course.bmtReward} BMT for course completion without quiz: user=${req.user.id}, course=${course.id}`);
              }
            }
          }
        }
      }
      
      res.json({ 
        progress, 
        reward, 
        certificate,
        payoutTransaction,
        courseCompleted: !!certificate,
      });
    } catch (error) {
      console.error("Error completing lesson:", error);
      res.status(500).json({ error: "Failed to complete lesson" });
    }
  });

  // ============ QUIZZES ============
  app.get("/api/courses/:courseId/quiz", async (req, res) => {
    try {
      const quiz = await storage.getQuizByCourse(req.params.courseId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      const questions = await storage.getQuizQuestions(quiz.id);
      
      // Remove correct answers for students (they should be hidden)
      const safeQuestions = questions.map(q => ({
        ...q,
        options: q.options.map(o => ({ id: o.id, text: o.text })),
      }));
      
      res.json({ ...quiz, questions: safeQuestions });
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  app.post("/api/courses/:courseId/quiz", authMiddleware, async (req: any, res) => {
    try {
      const course = await storage.getCourse(req.params.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to create quiz" });
      }
      
      const result = insertQuizSchema.safeParse({
        ...req.body,
        courseId: req.params.courseId,
      });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).message });
      }
      
      const quiz = await storage.createQuiz(result.data);
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ error: "Failed to create quiz" });
    }
  });

  app.get("/api/courses/:courseId/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getQuizzesByCourse(req.params.courseId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ error: "Failed to fetch quizzes" });
    }
  });

  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      const questions = await storage.getQuizQuestions(quiz.id);
      
      const safeQuestions = questions.map(q => ({
        ...q,
        options: q.options.map(o => ({ id: o.id, text: o.text })),
      }));
      
      res.json({ ...quiz, questions: safeQuestions });
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  app.get("/api/quizzes/:id/full", authMiddleware, async (req: any, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      const course = await storage.getCourse(quiz.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to view full quiz" });
      }
      
      const questions = await storage.getQuizQuestions(quiz.id);
      res.json({ ...quiz, questions });
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  app.put("/api/quizzes/:id", authMiddleware, async (req: any, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      const course = await storage.getCourse(quiz.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to edit this quiz" });
      }
      
      const updated = await storage.updateQuiz(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(500).json({ error: "Failed to update quiz" });
    }
  });

  app.delete("/api/quizzes/:id", authMiddleware, async (req: any, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      const course = await storage.getCourse(quiz.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to delete this quiz" });
      }
      
      await storage.deleteQuiz(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ error: "Failed to delete quiz" });
    }
  });

  // ============ QUIZ QUESTIONS ============
  app.get("/api/quizzes/:quizId/questions", authMiddleware, async (req: any, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      const course = await storage.getCourse(quiz.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to view questions" });
      }
      
      const questions = await storage.getQuizQuestions(req.params.quizId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.post("/api/quizzes/:quizId/questions", authMiddleware, async (req: any, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      const course = await storage.getCourse(quiz.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to add questions" });
      }
      
      const existingQuestions = await storage.getQuizQuestions(req.params.quizId);
      const orderIndex = existingQuestions.length;
      
      const result = insertQuizQuestionSchema.safeParse({
        ...req.body,
        quizId: req.params.quizId,
        orderIndex,
      });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).message });
      }
      
      const question = await storage.createQuizQuestion(result.data);
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  app.put("/api/questions/:id", authMiddleware, async (req: any, res) => {
    try {
      const questions = await storage.getQuizQuestions(req.body.quizId);
      const question = questions.find(q => q.id === req.params.id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      const quiz = await storage.getQuiz(question.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      const course = await storage.getCourse(quiz.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to edit this question" });
      }
      
      const updated = await storage.updateQuizQuestion(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ error: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", authMiddleware, async (req: any, res) => {
    try {
      await storage.deleteQuizQuestion(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  // ============ QUIZ ATTEMPTS ============
  const submitQuizSchema = z.object({
    answers: z.record(z.string(), z.string()),
    fingerprint: z.object({
      hash: z.string(),
      screenResolution: z.string().optional(),
      timezone: z.string().optional(),
      language: z.string().optional(),
      platform: z.string().optional(),
    }).optional(),
  });

  // Helper function to get client IP
  function getClientIp(req: any): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  // Helper function to create deterministic fingerprint hash from device signals
  function createFingerprintHash(data: { userAgent?: string; screenResolution?: string; timezone?: string; language?: string; platform?: string }): string {
    const str = `${data.userAgent || ''}|${data.screenResolution || ''}|${data.timezone || ''}|${data.language || ''}|${data.platform || ''}`;
    // Use same algorithm as frontend for consistency
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).padStart(12, '0');
  }

  // Helper to normalize IP addresses (strip IPv6 prefix for IPv4-mapped addresses)
  function normalizeIp(ip: string): string {
    if (ip.startsWith('::ffff:')) {
      return ip.substring(7);
    }
    return ip;
  }

  app.post("/api/quizzes/:quizId/submit", authMiddleware, async (req: any, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      const course = await storage.getCourse(quiz.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // ============ ANTI-ABUSE CHECK 1: Per-course reward cap ============
      const alreadyRewarded = await storage.hasUserCompletedCourseReward(req.user.id, course.id);
      
      // Check attempt limit
      const previousAttempts = await storage.getQuizAttempts(req.user.id, quiz.id);
      if (quiz.maxAttempts && previousAttempts.length >= quiz.maxAttempts) {
        return res.status(400).json({ error: "Maximum attempts reached" });
      }
      
      const result = submitQuizSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).message });
      }

      // ============ ANTI-ABUSE CHECK 2: Device/IP fingerprinting ============
      const rawIp = getClientIp(req);
      const clientIp = normalizeIp(rawIp);
      const userAgent = req.headers['user-agent'] || '';
      const fingerprintData = result.data.fingerprint;
      
      // Always compute server-side hash for consistency (don't trust client hash)
      const fingerprintHash = createFingerprintHash({
        userAgent,
        screenResolution: fingerprintData?.screenResolution,
        timezone: fingerprintData?.timezone,
        language: fingerprintData?.language,
        platform: fingerprintData?.platform,
      });

      // Save device fingerprint
      await storage.saveDeviceFingerprint({
        fingerprintHash,
        userId: req.user.id,
        walletAddress: req.user.walletAddress || '',
        ipAddress: clientIp,
        userAgent,
        screenResolution: fingerprintData?.screenResolution,
        timezone: fingerprintData?.timezone,
        language: fingerprintData?.language,
        platform: fingerprintData?.platform,
      });

      // Check for suspicious patterns
      const suspiciousFlags: string[] = [];
      
      // Check if same fingerprint used by multiple wallets
      const fingerprintUsers = await storage.getDeviceFingerprintsByHash(fingerprintHash);
      const uniqueWallets = new Set(fingerprintUsers.map(f => f.walletAddress));
      if (uniqueWallets.size > 1) {
        suspiciousFlags.push(`fingerprint_multiple_wallets:${uniqueWallets.size}`);
        await storage.logSuspiciousActivity({
          userId: req.user.id,
          walletAddress: req.user.walletAddress,
          fingerprintHash,
          ipAddress: clientIp,
          activityType: 'multiple_wallets_same_device',
          description: `Same device fingerprint used by ${uniqueWallets.size} different wallets`,
          severity: uniqueWallets.size > 3 ? 'high' : 'medium',
          courseId: course.id,
          metadata: { wallets: Array.from(uniqueWallets) },
        });
      }

      // Check if same IP used by multiple wallets
      const ipUsers = await storage.getDeviceFingerprintsByIp(clientIp);
      const uniqueWalletsFromIp = new Set(ipUsers.map(f => f.walletAddress));
      if (uniqueWalletsFromIp.size > 2) {
        suspiciousFlags.push(`ip_multiple_wallets:${uniqueWalletsFromIp.size}`);
        await storage.logSuspiciousActivity({
          userId: req.user.id,
          walletAddress: req.user.walletAddress,
          fingerprintHash,
          ipAddress: clientIp,
          activityType: 'multiple_wallets_same_ip',
          description: `Same IP address used by ${uniqueWalletsFromIp.size} different wallets`,
          severity: uniqueWalletsFromIp.size > 5 ? 'high' : 'low',
          courseId: course.id,
          metadata: { wallets: Array.from(uniqueWalletsFromIp) },
        });
      }
      
      // Grade the quiz
      const questions = await storage.getQuizQuestions(quiz.id);
      let correctCount = 0;
      const feedback: Record<string, { correct: boolean; correctAnswer: string; explanation?: string }> = {};
      
      for (const question of questions) {
        const userAnswer = result.data.answers[question.id];
        const correctOption = question.options.find(o => o.isCorrect);
        const isCorrect = userAnswer === correctOption?.id;
        
        if (isCorrect) correctCount++;
        
        feedback[question.id] = {
          correct: isCorrect,
          correctAnswer: correctOption?.id || '',
          explanation: question.explanation || undefined,
        };
      }
      
      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= quiz.passingScore;
      
      // Create attempt record
      const attempt = await storage.createQuizAttempt({
        userId: req.user.id,
        quizId: quiz.id,
        answers: result.data.answers,
        score,
        passed,
      });
      
      // If passed, create reward, certificate, and payout transaction
      let reward = null;
      let certificate = null;
      let payoutTransaction = null;
      let rewardBlocked = false;
      let blockReason = '';
      
      if (passed) {
        // Only issue reward if user hasn't already received one for this course
        if (alreadyRewarded) {
          rewardBlocked = true;
          blockReason = 'You have already received a reward for completing this course. Each wallet can only earn rewards once per course.';
          
          // Log this as informational (not necessarily suspicious, but good to track)
          console.log(`[Anti-Abuse] Blocked duplicate reward: user=${req.user.id}, course=${course.id}, wallet=${req.user.walletAddress}`);
        } else if (course.bmtReward > 0) {
          // Check if this device/IP has high-severity suspicious activity
          const userSuspiciousActivity = await storage.getSuspiciousActivityByUser(req.user.id);
          const highSeverityFlags = userSuspiciousActivity.filter(a => a.severity === 'high');
          
          if (highSeverityFlags.length > 0) {
            rewardBlocked = true;
            blockReason = 'Your account has been flagged for review. Please contact support if you believe this is an error.';
            
            await storage.logSuspiciousActivity({
              userId: req.user.id,
              walletAddress: req.user.walletAddress,
              fingerprintHash,
              ipAddress: clientIp,
              activityType: 'reward_blocked_suspicious',
              description: 'Reward blocked due to high-severity suspicious activity',
              severity: 'high',
              courseId: course.id,
              metadata: { previousFlags: highSeverityFlags.length },
            });
          } else {
            // All checks passed - issue the reward
            reward = await storage.createReward({
              userId: req.user.id,
              courseId: course.id,
              amount: course.bmtReward,
              type: 'course_completion',
            });
            
            // Create payout transaction for admin processing
            payoutTransaction = await storage.createPayoutTransaction({
              rewardId: reward.id,
              userId: req.user.id,
              recipientAddress: req.user.walletAddress || '',
              amount: course.bmtReward,
              tokenTicker: 'BMT',
            });
          }
          
          certificate = await storage.createCertificate({
            userId: req.user.id,
            courseId: course.id,
            quizAttemptId: attempt.id,
          });
          
          // Update enrollment status
          const enrollment = await storage.getEnrollment(req.user.id, course.id);
          if (enrollment) {
            await storage.updateEnrollment(enrollment.id, {
              status: 'completed',
              progress: 100,
              completedAt: new Date(),
            });
          }
        }
      }
      
      res.json({
        attempt,
        score,
        passed,
        correctCount,
        totalQuestions: questions.length,
        feedback,
        reward,
        certificate,
        payoutTransaction,
        rewardBlocked,
        blockReason: rewardBlocked ? blockReason : undefined,
        suspiciousFlags: suspiciousFlags.length > 0 ? suspiciousFlags : undefined,
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // ============ ENROLLMENTS ============
  app.get("/api/enrollments", authMiddleware, async (req: any, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByUser(req.user.id);
      
      // Include course details
      const enrollmentsWithCourses = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          return { ...enrollment, course };
        })
      );
      
      res.json(enrollmentsWithCourses);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/courses/:courseId/enroll", authMiddleware, async (req: any, res) => {
    try {
      const course = await storage.getCourse(req.params.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      const existing = await storage.getEnrollment(req.user.id, req.params.courseId);
      if (existing) {
        return res.status(400).json({ error: "Already enrolled in this course" });
      }
      
      const enrollment = await storage.createEnrollment({
        userId: req.user.id,
        courseId: req.params.courseId,
      });
      
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling:", error);
      res.status(500).json({ error: "Failed to enroll in course" });
    }
  });

  app.post("/api/enrollments/:enrollmentId/progress", authMiddleware, async (req: any, res) => {
    try {
      const { lessonId } = req.body;
      const enrollments = await storage.getEnrollmentsByUser(req.user.id);
      const enrollment = enrollments.find(e => e.id === req.params.enrollmentId);
      
      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      
      const lessons = await storage.getLessonsByCourse(enrollment.courseId);
      const completedLessons = [...(enrollment.completedLessons || [])];
      
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
      }
      
      const progress = Math.round((completedLessons.length / lessons.length) * 100);
      
      const updated = await storage.updateEnrollment(enrollment.id, {
        completedLessons,
        progress,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  // ============ CERTIFICATES ============
  app.get("/api/certificates", authMiddleware, async (req: any, res) => {
    try {
      const certificates = await storage.getCertificatesByUser(req.user.id);
      
      // Include course details
      const certificatesWithDetails = await Promise.all(
        certificates.map(async (cert) => {
          const course = await storage.getCourse(cert.courseId);
          return { ...cert, course };
        })
      );
      
      res.json(certificatesWithDetails);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      res.status(500).json({ error: "Failed to fetch certificates" });
    }
  });

  app.get("/api/certificates/verify/:code", async (req, res) => {
    try {
      const certificate = await storage.getCertificateByVerificationCode(req.params.code);
      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found", valid: false });
      }
      
      const course = await storage.getCourse(certificate.courseId);
      const user = await storage.getUser(certificate.userId);
      
      res.json({
        valid: true,
        certificate: {
          ...certificate,
          courseName: course?.title,
          studentWallet: user?.walletAddress,
          studentName: user?.displayName,
        },
      });
    } catch (error) {
      console.error("Error verifying certificate:", error);
      res.status(500).json({ error: "Failed to verify certificate" });
    }
  });

  // ============ REWARDS ============
  app.get("/api/rewards", authMiddleware, async (req: any, res) => {
    try {
      const rewards = await storage.getRewardsByUser(req.user.id);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  });

  app.post("/api/rewards/:rewardId/claim", authMiddleware, async (req: any, res) => {
    try {
      const rewards = await storage.getRewardsByUser(req.user.id);
      const reward = rewards.find(r => r.id === req.params.rewardId);
      
      if (!reward) {
        return res.status(404).json({ error: "Reward not found" });
      }
      
      if (reward.status !== 'pending') {
        return res.status(400).json({ error: "Reward already processed" });
      }
      
      // Simulate blockchain transaction (in production, this would call Kasplex SDK)
      const mockTxHash = `kas:${randomBytes(32).toString('hex').slice(0, 64)}`;
      
      const updated = await storage.updateReward(reward.id, {
        status: 'confirmed',
        txHash: mockTxHash,
        processedAt: new Date(),
      });
      
      res.json({
        ...updated,
        message: `Successfully claimed ${reward.amount} $BMT!`,
      });
    } catch (error) {
      console.error("Error claiming reward:", error);
      res.status(500).json({ error: "Failed to claim reward" });
    }
  });

  // Admin: Manually issue reward for completed enrollments without rewards
  app.post("/api/admin/issue-reward/:enrollmentId", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const enrollment = await storage.getEnrollmentById(req.params.enrollmentId);
      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      
      if (enrollment.progress !== 100) {
        return res.status(400).json({ error: "Course not completed (progress must be 100%)" });
      }
      
      const alreadyRewarded = await storage.hasUserCompletedCourseReward(enrollment.userId, enrollment.courseId);
      if (alreadyRewarded) {
        return res.status(400).json({ error: "Reward already issued for this course" });
      }
      
      const course = await storage.getCourse(enrollment.courseId);
      if (!course || course.bmtReward <= 0) {
        return res.status(400).json({ error: "Course has no BMT reward configured" });
      }
      
      const user = await storage.getUser(enrollment.userId);
      if (!user || !user.walletAddress) {
        return res.status(404).json({ error: "User or wallet address not found" });
      }
      
      // Create reward
      const reward = await storage.createReward({
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        amount: course.bmtReward,
        type: 'course_completion',
      });
      
      // Create payout transaction
      const payoutTransaction = await storage.createPayoutTransaction({
        rewardId: reward.id,
        userId: enrollment.userId,
        amount: course.bmtReward,
        recipientAddress: user.walletAddress,
      });
      
      // Issue certificate
      const certificate = await storage.createCertificate({
        userId: enrollment.userId,
        courseId: enrollment.courseId,
      });
      
      // Update enrollment status
      await storage.updateEnrollment(enrollment.id, { status: 'completed' });
      
      console.log(`[Admin] Manually issued reward and certificate: user=${enrollment.userId}, course=${course.id}, amount=${course.bmtReward}`);
      
      res.json({ 
        success: true, 
        reward, 
        certificate, 
        payoutTransaction,
        message: `Issued ${course.bmtReward} $BMT and certificate for ${course.title}`
      });
    } catch (error) {
      console.error("Error issuing reward:", error);
      res.status(500).json({ error: "Failed to issue reward" });
    }
  });

  // ============ ANALYTICS (Public stats) ============
  app.get("/api/stats", async (req, res) => {
    try {
      const courses = await storage.getAllCourses({ isPublished: true });
      const allRewards = await storage.getAllRewards();
      const allCertificates = await storage.getAllCertificates();
      const allQuizAttempts = await storage.getAllQuizAttempts();
      
      const totalEnrollments = courses.reduce((sum, c) => sum + c.enrollmentCount, 0);
      const uniqueStudents = new Set(allCertificates.map(c => c.userId)).size;
      
      const totalBmtDistributed = allRewards
        .filter(r => r.status === 'confirmed')
        .reduce((sum, r) => sum + r.amount, 0);
      const pendingBmt = allRewards
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + r.amount, 0);
      
      const avgQuizScore = allQuizAttempts.length > 0
        ? Math.round(allQuizAttempts.reduce((sum, q) => sum + q.score, 0) / allQuizAttempts.length)
        : 0;
      
      const completionRate = totalEnrollments > 0
        ? Math.min(100, Math.round((allCertificates.length / totalEnrollments) * 100))
        : 0;
      
      res.json({
        totalCourses: courses.length,
        totalStudents: totalEnrollments,
        totalBmtDistributed,
        pendingBmt,
        certificatesIssued: allCertificates.length,
        completionRate,
        avgQuizScore,
        averageRating: courses.length > 0 
          ? (courses.reduce((sum, c) => sum + (parseFloat(c.rating || '0')), 0) / courses.length).toFixed(1)
          : '0',
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/analytics/leaderboard", async (req, res) => {
    try {
      const courses = await storage.getAllCourses({ isPublished: true });
      const allRewards = await storage.getAllRewards();
      const allCertificates = await storage.getAllCertificates();
      
      const leaderboard = courses
        .map(course => {
          const courseCertificates = allCertificates.filter(c => c.courseId === course.id);
          const courseRewards = allRewards.filter(r => r.courseId === course.id && r.status === 'confirmed');
          const totalBmtPaid = courseRewards.reduce((sum, r) => sum + r.amount, 0);
          const pendingRewards = allRewards.filter(r => r.courseId === course.id && r.status === 'pending');
          
          return {
            id: course.id,
            title: course.title,
            category: course.category,
            enrollmentCount: course.enrollmentCount,
            completions: courseCertificates.length,
            totalBmtPaid,
            pendingBmt: pendingRewards.reduce((sum, r) => sum + r.amount, 0),
            rating: course.rating,
          };
        })
        .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
        .slice(0, 10);
      
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.get("/api/analytics/activity", async (req, res) => {
    try {
      const allRewards = await storage.getAllRewards();
      const allCertificates = await storage.getAllCertificates();
      const courses = await storage.getAllCourses({ isPublished: true });
      const allCourses = await storage.getAllCourses({});
      
      const activities: Array<{
        id: string;
        type: 'reward_claimed' | 'certificate_issued' | 'course_completed';
        description: string;
        amount?: number;
        timestamp: Date;
      }> = [];
      
      allRewards
        .filter(r => r.status === 'confirmed' && r.processedAt)
        .forEach(r => {
          const course = allCourses.find(c => c.id === r.courseId);
          const courseName = course?.title || 'a completed course';
          activities.push({
            id: r.id,
            type: 'reward_claimed',
            description: `Claimed ${r.amount} $BMT for ${courseName}`,
            amount: r.amount,
            timestamp: r.processedAt!,
          });
        });
      
      allCertificates.forEach(c => {
        const course = allCourses.find(co => co.id === c.courseId);
        const courseName = course?.title || 'a completed course';
        activities.push({
          id: c.id,
          type: 'certificate_issued',
          description: `Certificate issued for ${courseName}`,
          timestamp: c.issuedAt!,
        });
      });
      
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);
      
      res.json(sortedActivities);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  // ============ PAYMASTER WALLET (Admin) ============
  
  // Admin middleware - check if user has admin role
  async function adminMiddleware(req: any, res: any, next: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const session = await storage.getAuthSession(token);
    if (!session || new Date() > session.expiresAt) {
      return res.status(401).json({ error: 'Session expired' });
    }
    
    const user = await storage.getUser(session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = user;
    next();
  }

  // Get paymaster configuration
  app.get("/api/admin/paymaster", adminMiddleware, async (req: any, res) => {
    try {
      const config = await storage.getPaymasterConfig();
      
      if (!config) {
        return res.json({ configured: false });
      }
      
      // Fetch live balance from Kasplex EVM RPC
      let liveBalance = null;
      let formattedBalance = null;
      
      try {
        // Use EVM RPC to get ERC20 token balance
        if (config.tokenContractAddress) {
          const balanceData = await getERC20Balance(config.tokenContractAddress, config.walletAddress);
          if (balanceData) {
            liveBalance = balanceData.balance;
            formattedBalance = balanceData.formattedBalance;
            
            // Update cached balance
            await storage.updatePaymasterBalance(config.id, balanceData.balance);
          }
        }
      } catch (e) {
        console.error('Error fetching live balance:', e);
      }
      
      res.json({
        configured: true,
        privateKeyConfigured: isPaymasterConfigured(),
        network: getNetworkInfo(),
        ...config,
        liveBalance,
        formattedBalance,
      });
    } catch (error) {
      console.error("Error fetching paymaster config:", error);
      res.status(500).json({ error: "Failed to fetch paymaster configuration" });
    }
  });

  // Create or update paymaster configuration
  app.post("/api/admin/paymaster", adminMiddleware, async (req: any, res) => {
    try {
      const existingConfig = await storage.getPaymasterConfig();
      
      if (existingConfig) {
        // Update existing config
        const result = updatePaymasterConfigSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ error: fromError(result.error).message });
        }
        
        const updated = await storage.updatePaymasterConfig(existingConfig.id, result.data);
        res.json(updated);
      } else {
        // Create new config
        const result = insertPaymasterConfigSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ error: fromError(result.error).message });
        }
        
        const created = await storage.createPaymasterConfig(result.data);
        res.status(201).json(created);
      }
    } catch (error) {
      console.error("Error saving paymaster config:", error);
      res.status(500).json({ error: "Failed to save paymaster configuration" });
    }
  });

  // Refresh paymaster balance
  app.post("/api/admin/paymaster/refresh-balance", adminMiddleware, async (req: any, res) => {
    try {
      const config = await storage.getPaymasterConfig();
      
      if (!config) {
        return res.status(404).json({ error: "Paymaster not configured" });
      }
      
      if (!config.tokenContractAddress) {
        return res.status(400).json({ error: "Token contract address not configured" });
      }
      
      const balanceData = await getERC20Balance(config.tokenContractAddress, config.walletAddress);
      
      if (!balanceData) {
        return res.status(500).json({ error: "Failed to fetch balance from Kasplex EVM" });
      }
      
      const updated = await storage.updatePaymasterBalance(config.id, balanceData.balance);
      
      res.json({
        ...updated,
        liveBalance: balanceData.balance,
        formattedBalance: balanceData.formattedBalance,
      });
    } catch (error) {
      console.error("Error refreshing balance:", error);
      res.status(500).json({ error: "Failed to refresh balance" });
    }
  });

  // Get live token data from Kaspacom DEX API
  app.get("/api/admin/token-data", adminMiddleware, async (req: any, res) => {
    try {
      const config = await storage.getPaymasterConfig();
      
      if (!config?.tokenContractAddress) {
        return res.status(400).json({ error: "Token contract address not configured" });
      }
      
      const tokenData = await getKaspacomTokenData(config.tokenContractAddress);
      
      if (!tokenData) {
        return res.status(500).json({ error: "Failed to fetch token data from Kaspacom DEX" });
      }
      
      res.json(tokenData);
    } catch (error) {
      console.error("Error fetching token data:", error);
      res.status(500).json({ error: "Failed to fetch token data" });
    }
  });

  // Get live token data for any token address (public endpoint)
  app.get("/api/token/:address", async (req, res) => {
    try {
      const { address } = req.params;
      
      if (!address || !address.startsWith('0x')) {
        return res.status(400).json({ error: "Invalid token address" });
      }
      
      const tokenData = await getKaspacomTokenData(address);
      
      if (!tokenData) {
        return res.status(404).json({ error: "Token not found or API unavailable" });
      }
      
      res.json(tokenData);
    } catch (error) {
      console.error("Error fetching token data:", error);
      res.status(500).json({ error: "Failed to fetch token data" });
    }
  });

  // Get pending payouts
  app.get("/api/admin/payouts", adminMiddleware, async (req: any, res) => {
    try {
      const payouts = await storage.getAllPayoutTransactions();
      
      // Enrich with user info
      const enrichedPayouts = await Promise.all(
        payouts.map(async (payout) => {
          const user = await storage.getUser(payout.userId);
          return {
            ...payout,
            userWallet: user?.walletAddress,
            userDisplayName: user?.displayName,
          };
        })
      );
      
      res.json(enrichedPayouts);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      res.status(500).json({ error: "Failed to fetch payouts" });
    }
  });

  // Get pending payout summary
  app.get("/api/admin/payouts/summary", adminMiddleware, async (req: any, res) => {
    try {
      const pendingPayouts = await storage.getPendingPayoutTransactions();
      const allPayouts = await storage.getAllPayoutTransactions();
      const config = await storage.getPaymasterConfig();
      
      const pendingTotal = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
      const completedPayouts = allPayouts.filter(p => p.status === 'completed');
      const completedTotal = completedPayouts.reduce((sum, p) => sum + p.amount, 0);
      
      res.json({
        pendingCount: pendingPayouts.length,
        pendingTotal,
        completedCount: completedPayouts.length,
        completedTotal,
        tokenTicker: config?.tokenTicker || 'BMT',
        tokenDecimals: config?.tokenDecimals || 8,
      });
    } catch (error) {
      console.error("Error fetching payout summary:", error);
      res.status(500).json({ error: "Failed to fetch payout summary" });
    }
  });

  // Process payout with real blockchain transaction
  app.post("/api/admin/payouts/:payoutId/process", adminMiddleware, async (req: any, res) => {
    try {
      // Check if paymaster is configured first (before any DB operations)
      if (!isPaymasterConfigured()) {
        return res.status(400).json({ error: "Paymaster wallet not configured. Set PAYMASTER_PRIVATE_KEY secret." });
      }
      
      // Get token contract from config
      const config = await storage.getPaymasterConfig();
      if (!config?.tokenContractAddress) {
        return res.status(400).json({ error: "Token contract address not configured" });
      }
      
      // Atomically claim the payout for processing (prevents concurrent double-processing)
      const payout = await storage.claimPayoutForProcessing(req.params.payoutId);
      if (!payout) {
        // Could be not found OR already processed/processing
        const existing = await storage.getPayoutTransaction(req.params.payoutId);
        if (!existing) {
          return res.status(404).json({ error: "Payout not found" });
        }
        return res.status(400).json({ error: `Payout already ${existing.status}` });
      }
      
      if (!payout.recipientAddress) {
        await storage.releasePayoutFromProcessing(payout.id);
        return res.status(400).json({ error: "Recipient address not set" });
      }
      
      // Get token decimals for amount conversion
      const tokenInfo = await getERC20TokenInfo(config.tokenContractAddress);
      const decimals = tokenInfo?.decimals || 18;
      
      // Convert the reward amount to token units (with decimals)
      const amountInWei = parseTokenAmount(payout.amount.toString(), decimals);
      
      // Execute the real blockchain transfer
      const result = await transferERC20(
        config.tokenContractAddress,
        payout.recipientAddress,
        amountInWei,
        decimals
      );
      
      if (result.success && result.txHash) {
        // Atomically complete the payout (only if still processing)
        const updated = await storage.completePayoutFromProcessing(
          payout.id, 
          result.txHash, 
          result.blockNumber
        );
        
        if (!updated) {
          console.error(`Failed to complete payout ${payout.id} - may have been modified concurrently`);
          return res.status(409).json({ error: "Payout state changed unexpectedly" });
        }
        
        // Also update the associated reward
        if (payout.rewardId) {
          await storage.updateReward(payout.rewardId, {
            status: 'confirmed',
            txHash: result.txHash,
            processedAt: new Date(),
          });
        }
        
        res.json({
          ...updated,
          blockchainResult: {
            txHash: result.txHash,
            gasUsed: result.gasUsed,
            blockNumber: result.blockNumber,
          }
        });
      } else {
        // Atomically mark as failed (only if still processing)
        const failed = await storage.failPayoutFromProcessing(payout.id, result.error || 'Unknown error');
        
        res.status(500).json({ 
          error: "Blockchain transaction failed", 
          details: result.error 
        });
      }
    } catch (error) {
      console.error("Error processing payout:", error);
      res.status(500).json({ error: "Failed to process payout" });
    }
  });

  // Mark payout as completed manually (for external processing)
  app.post("/api/admin/payouts/:payoutId/complete", adminMiddleware, async (req: any, res) => {
    try {
      const { txHash } = req.body;
      
      // First try to atomically claim the payout (pending → processing)
      let payout = await storage.claimPayoutForProcessing(req.params.payoutId);
      
      if (!payout) {
        // Check if already processing (concurrent request might have claimed it)
        const existing = await storage.getPayoutTransaction(req.params.payoutId);
        if (!existing) {
          return res.status(404).json({ error: "Payout not found" });
        }
        if (existing.status === 'processing') {
          // Another admin is processing, we can complete it
          payout = existing;
        } else {
          return res.status(400).json({ error: `Payout already ${existing.status}` });
        }
      }
      
      // Now atomically complete (processing → completed)
      const updated = await storage.completePayoutFromProcessing(
        payout.id,
        txHash || 'manual-completion'
      );
      
      if (!updated) {
        return res.status(409).json({ error: "Payout state changed unexpectedly" });
      }
      
      // Also update the associated reward
      if (payout.rewardId) {
        await storage.updateReward(payout.rewardId, {
          status: 'confirmed',
          txHash: txHash || 'manual-completion',
          processedAt: new Date(),
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error completing payout:", error);
      res.status(500).json({ error: "Failed to complete payout" });
    }
  });

  // Update course reward amount (admin)
  app.patch("/api/admin/courses/:courseId/reward", adminMiddleware, async (req: any, res) => {
    try {
      const { bmtReward } = req.body;
      
      if (typeof bmtReward !== 'number' || bmtReward < 0) {
        return res.status(400).json({ error: "Invalid reward amount" });
      }
      
      const course = await storage.getCourse(req.params.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      const updated = await storage.updateCourse(req.params.courseId, { bmtReward });
      res.json(updated);
    } catch (error) {
      console.error("Error updating course reward:", error);
      res.status(500).json({ error: "Failed to update course reward" });
    }
  });

  // Get all courses with reward info (admin)
  app.get("/api/admin/courses", adminMiddleware, async (req: any, res) => {
    try {
      const courses = await storage.getAllCourses({});
      const allRewards = await storage.getAllRewards();
      
      const coursesWithStats = courses.map(course => {
        const courseRewards = allRewards.filter(r => r.courseId === course.id);
        const paidRewards = courseRewards.filter(r => r.status === 'confirmed');
        const pendingRewards = courseRewards.filter(r => r.status === 'pending');
        
        return {
          ...course,
          totalPaid: paidRewards.reduce((sum, r) => sum + r.amount, 0),
          pendingAmount: pendingRewards.reduce((sum, r) => sum + r.amount, 0),
          rewardsClaimed: paidRewards.length,
          rewardsPending: pendingRewards.length,
        };
      });
      
      res.json(coursesWithStats);
    } catch (error) {
      console.error("Error fetching admin courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  // Get ERC20 token info from Kasplex EVM
  app.get("/api/token/:contractAddress", async (req, res) => {
    try {
      const contractAddress = req.params.contractAddress;
      
      // Validate it looks like an EVM address
      if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
        return res.status(400).json({ error: "Invalid contract address format" });
      }
      
      const tokenInfo = await getERC20TokenInfo(contractAddress);
      
      if (!tokenInfo) {
        return res.status(404).json({ error: "Token not found or not an ERC20 contract" });
      }
      
      res.json(tokenInfo);
    } catch (error) {
      console.error("Error fetching token info:", error);
      res.status(500).json({ error: "Failed to fetch token info" });
    }
  });

  // Public endpoint to check paymaster status (for users to know if payouts are available)
  app.get("/api/paymaster/status", async (req, res) => {
    try {
      const config = await storage.getPaymasterConfig();
      
      if (!config || !config.isActive) {
        return res.json({
          active: false,
          message: "Reward payouts are temporarily unavailable",
        });
      }
      
      res.json({
        active: true,
        tokenTicker: config.tokenTicker,
        minPayout: config.minPayoutAmount,
        autoPayoutEnabled: config.autoPayoutEnabled,
      });
    } catch (error) {
      console.error("Error checking paymaster status:", error);
      res.status(500).json({ error: "Failed to check paymaster status" });
    }
  });

  return httpServer;
}
