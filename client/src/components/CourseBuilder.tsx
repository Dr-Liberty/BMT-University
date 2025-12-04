import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, GripVertical, FileText, Video, Code, Image, BookOpen, HelpCircle, ChevronLeft, Save, Eye, Loader2 } from "lucide-react";
import type { Course, Module, Lesson, Quiz, QuizQuestion, ContentBlock } from "@shared/schema";

interface CourseBuilderProps {
  courseId: string;
  onBack: () => void;
}

interface ModuleWithContent extends Module {
  lessons: Lesson[];
  quizzes: Quiz[];
}

interface QuestionFormData {
  questionType: 'single_choice' | 'multi_select' | 'true_false' | 'short_answer';
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  points: number;
  explanation?: string;
  hint?: string;
}

const defaultQuestion: QuestionFormData = {
  questionType: 'single_choice',
  question: '',
  options: [
    { id: 'a', text: '', isCorrect: false },
    { id: 'b', text: '', isCorrect: false },
    { id: 'c', text: '', isCorrect: false },
    { id: 'd', text: '', isCorrect: false },
  ],
  points: 1,
  explanation: '',
  hint: '',
};

export default function CourseBuilder({ courseId, onBack }: CourseBuilderProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("structure");
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', videoUrl: '', duration: 10 });
  const [quizForm, setQuizForm] = useState({ 
    title: '', 
    description: '', 
    passingScore: 70, 
    timeLimit: 600,
    maxAttempts: 3,
    shuffleQuestions: false,
    showCorrectAnswers: true,
    isPublished: false,
  });
  const [questionForm, setQuestionForm] = useState<QuestionFormData>(defaultQuestion);

  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ['/api/courses', courseId],
  });

  const { data: modules, isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: ['/api/courses', courseId, 'modules'],
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ['/api/courses', courseId, 'lessons'],
  });

  const { data: quizzes, isLoading: quizzesLoading } = useQuery<Quiz[]>({
    queryKey: ['/api/courses', courseId, 'quizzes'],
  });

  const { data: selectedQuizQuestions } = useQuery<QuizQuestion[]>({
    queryKey: ['/api/quizzes', selectedQuizId, 'questions'],
    enabled: !!selectedQuizId,
  });

  // Module mutations
  const createModuleMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      return apiRequest('POST', `/api/courses/${courseId}/modules`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules'] });
      setModuleDialogOpen(false);
      setModuleForm({ title: '', description: '' });
      toast({ title: "Module created", description: "New module added successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Module> }) => {
      return apiRequest('PUT', `/api/modules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules'] });
      setModuleDialogOpen(false);
      setEditingModule(null);
      toast({ title: "Module updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/modules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'modules'] });
      toast({ title: "Module deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Lesson mutations
  const createLessonMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; videoUrl?: string; duration?: number; moduleId?: string }) => {
      const endpoint = selectedModuleId 
        ? `/api/modules/${selectedModuleId}/lessons`
        : `/api/courses/${courseId}/lessons`;
      return apiRequest('POST', endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'lessons'] });
      setLessonDialogOpen(false);
      setLessonForm({ title: '', content: '', videoUrl: '', duration: 10 });
      toast({ title: "Lesson created" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lesson> }) => {
      return apiRequest('PUT', `/api/lessons/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'lessons'] });
      setLessonDialogOpen(false);
      setEditingLesson(null);
      toast({ title: "Lesson updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/lessons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'lessons'] });
      toast({ title: "Lesson deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Quiz mutations
  const createQuizMutation = useMutation({
    mutationFn: async (data: typeof quizForm) => {
      return apiRequest('POST', `/api/courses/${courseId}/quiz`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'quizzes'] });
      setQuizDialogOpen(false);
      setQuizForm({ title: '', description: '', passingScore: 70, timeLimit: 600, maxAttempts: 3, shuffleQuestions: false, showCorrectAnswers: true, isPublished: false });
      toast({ title: "Quiz created" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateQuizMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Quiz> }) => {
      return apiRequest('PUT', `/api/quizzes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'quizzes'] });
      setQuizDialogOpen(false);
      setEditingQuiz(null);
      toast({ title: "Quiz updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/quizzes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'quizzes'] });
      setSelectedQuizId(null);
      toast({ title: "Quiz deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Question mutations
  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      return apiRequest('POST', `/api/quizzes/${selectedQuizId}/questions`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes', selectedQuizId, 'questions'] });
      setQuestionDialogOpen(false);
      setQuestionForm(defaultQuestion);
      toast({ title: "Question added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<QuizQuestion> & { quizId: string } }) => {
      return apiRequest('PUT', `/api/questions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes', selectedQuizId, 'questions'] });
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      toast({ title: "Question updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes', selectedQuizId, 'questions'] });
      toast({ title: "Question deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenModuleDialog = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setModuleForm({ title: module.title, description: module.description || '' });
    } else {
      setEditingModule(null);
      setModuleForm({ title: '', description: '' });
    }
    setModuleDialogOpen(true);
  };

  const handleOpenLessonDialog = (moduleId?: string, lesson?: Lesson) => {
    setSelectedModuleId(moduleId || null);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({ 
        title: lesson.title, 
        content: lesson.content, 
        videoUrl: lesson.videoUrl || '', 
        duration: lesson.duration || 10 
      });
    } else {
      setEditingLesson(null);
      setLessonForm({ title: '', content: '', videoUrl: '', duration: 10 });
    }
    setLessonDialogOpen(true);
  };

  const handleOpenQuizDialog = (quiz?: Quiz) => {
    if (quiz) {
      setEditingQuiz(quiz);
      setQuizForm({ 
        title: quiz.title, 
        description: quiz.description || '', 
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit || 600,
        maxAttempts: quiz.maxAttempts || 3,
        shuffleQuestions: quiz.shuffleQuestions,
        showCorrectAnswers: quiz.showCorrectAnswers,
        isPublished: quiz.isPublished,
      });
    } else {
      setEditingQuiz(null);
      setQuizForm({ title: '', description: '', passingScore: 70, timeLimit: 600, maxAttempts: 3, shuffleQuestions: false, showCorrectAnswers: true, isPublished: false });
    }
    setQuizDialogOpen(true);
  };

  const handleOpenQuestionDialog = (question?: QuizQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        questionType: (question.questionType as any) || 'single_choice',
        question: question.question,
        options: question.options as any,
        correctAnswer: question.correctAnswer || '',
        points: question.points,
        explanation: question.explanation || '',
        hint: question.hint || '',
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm(defaultQuestion);
    }
    setQuestionDialogOpen(true);
  };

  const handleSaveModule = () => {
    if (editingModule) {
      updateModuleMutation.mutate({ id: editingModule.id, data: moduleForm });
    } else {
      createModuleMutation.mutate(moduleForm);
    }
  };

  const handleSaveLesson = () => {
    if (editingLesson) {
      updateLessonMutation.mutate({ id: editingLesson.id, data: lessonForm });
    } else {
      createLessonMutation.mutate(lessonForm);
    }
  };

  const handleSaveQuiz = () => {
    if (editingQuiz) {
      updateQuizMutation.mutate({ id: editingQuiz.id, data: quizForm });
    } else {
      createQuizMutation.mutate(quizForm);
    }
  };

  const handleSaveQuestion = () => {
    if (editingQuestion && selectedQuizId) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data: { ...questionForm, quizId: selectedQuizId } });
    } else {
      createQuestionMutation.mutate(questionForm);
    }
  };

  const getLessonsForModule = (moduleId: string) => {
    return lessons?.filter(l => l.moduleId === moduleId) || [];
  };

  const getUnassignedLessons = () => {
    return lessons?.filter(l => !l.moduleId) || [];
  };

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-kaspa-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} data-testid="button-back">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{course?.title}</h2>
          <p className="text-muted-foreground">{course?.shortDescription}</p>
        </div>
        <Badge variant={course?.isPublished ? "default" : "secondary"}>
          {course?.isPublished ? "Published" : "Draft"}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="structure" data-testid="tab-structure">
            <BookOpen className="w-4 h-4 mr-2" />
            Course Structure
          </TabsTrigger>
          <TabsTrigger value="quizzes" data-testid="tab-quizzes">
            <HelpCircle className="w-4 h-4 mr-2" />
            Quizzes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Modules & Lessons</h3>
            <Button onClick={() => handleOpenModuleDialog()} data-testid="button-add-module">
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </div>

          {modulesLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="h-20 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : modules && modules.length > 0 ? (
            <Accordion type="multiple" className="space-y-4">
              {modules.map((module, index) => (
                <AccordionItem 
                  key={module.id} 
                  value={module.id}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        <Badge variant="outline" className="text-xs">
                          Module {index + 1}
                        </Badge>
                      </div>
                      <span className="font-medium text-white">{module.title}</span>
                      <span className="text-sm text-muted-foreground ml-auto mr-4">
                        {getLessonsForModule(module.id).length} lessons
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-4">
                      {module.description && (
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenModuleDialog(module)}
                          data-testid={`button-edit-module-${module.id}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenLessonDialog(module.id)}
                          data-testid={`button-add-lesson-${module.id}`}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Lesson
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteModuleMutation.mutate(module.id)}
                          data-testid={`button-delete-module-${module.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-2 mt-4">
                        {getLessonsForModule(module.id).map((lesson, lessonIndex) => (
                          <div 
                            key={lesson.id}
                            className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border border-border/50"
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                            <Badge variant="secondary" className="text-xs">
                              {lessonIndex + 1}
                            </Badge>
                            <FileText className="w-4 h-4 text-kaspa-cyan" />
                            <span className="flex-1 text-sm">{lesson.title}</span>
                            {lesson.duration && (
                              <span className="text-xs text-muted-foreground">{lesson.duration} min</span>
                            )}
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenLessonDialog(module.id, lesson)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => deleteLessonMutation.mutate(lesson.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {getLessonsForModule(module.id).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No lessons in this module yet
                          </p>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No modules yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first module to organize your course content
                </p>
                <Button onClick={() => handleOpenModuleDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Module
                </Button>
              </CardContent>
            </Card>
          )}

          {getUnassignedLessons().length > 0 && (
            <Card className="bg-card border-border mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Unassigned Lessons</CardTitle>
                <CardDescription>These lessons are not in any module</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {getUnassignedLessons().map((lesson, index) => (
                  <div 
                    key={lesson.id}
                    className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border border-border/50"
                  >
                    <Badge variant="secondary" className="text-xs">{index + 1}</Badge>
                    <FileText className="w-4 h-4 text-kaspa-cyan" />
                    <span className="flex-1 text-sm">{lesson.title}</span>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenLessonDialog(undefined, lesson)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteLessonMutation.mutate(lesson.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Course Quizzes</h3>
            <Button onClick={() => handleOpenQuizDialog()} data-testid="button-add-quiz">
              <Plus className="w-4 h-4 mr-2" />
              Add Quiz
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              {quizzesLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : quizzes && quizzes.length > 0 ? (
                quizzes.map(quiz => (
                  <Card 
                    key={quiz.id}
                    className={`cursor-pointer transition-colors ${
                      selectedQuizId === quiz.id 
                        ? 'border-kaspa-cyan bg-kaspa-cyan/10' 
                        : 'bg-card border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => setSelectedQuizId(quiz.id)}
                    data-testid={`card-quiz-${quiz.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{quiz.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Pass: {quiz.passingScore}% | Time: {quiz.timeLimit ? `${Math.floor(quiz.timeLimit / 60)}min` : 'No limit'}
                          </p>
                        </div>
                        <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                          {quiz.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="py-8 text-center">
                    <HelpCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">No quizzes yet</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-2">
              {selectedQuizId ? (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>
                          {quizzes?.find(q => q.id === selectedQuizId)?.title}
                        </CardTitle>
                        <CardDescription>Manage quiz questions</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenQuizDialog(quizzes?.find(q => q.id === selectedQuizId))}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit Quiz
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteQuizMutation.mutate(selectedQuizId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={() => handleOpenQuestionDialog()}
                      className="w-full"
                      variant="outline"
                      data-testid="button-add-question"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>

                    {selectedQuizQuestions && selectedQuizQuestions.length > 0 ? (
                      <div className="space-y-3">
                        {selectedQuizQuestions.map((question, index) => (
                          <div 
                            key={question.id}
                            className="p-4 bg-muted/30 rounded-lg border border-border/50"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">Q{index + 1}</Badge>
                                  <Badge variant="secondary" className="text-xs capitalize">
                                    {question.questionType?.replace('_', ' ') || 'Single Choice'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{question.points} pts</span>
                                </div>
                                <p className="text-sm">{question.question}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleOpenQuestionDialog(question)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => deleteQuestionMutation.mutate(question.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No questions yet. Add your first question above.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="py-12 text-center">
                    <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Select a quiz to manage its questions
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingModule ? 'Edit Module' : 'Add Module'}</DialogTitle>
            <DialogDescription>
              Modules help organize your course content into sections
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="module-title">Title</Label>
              <Input
                id="module-title"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="e.g., Introduction to Blockchain"
                data-testid="input-module-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="module-description">Description (optional)</Label>
              <Textarea
                id="module-description"
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="Brief description of this module"
                rows={3}
                data-testid="input-module-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveModule}
              disabled={!moduleForm.title || createModuleMutation.isPending || updateModuleMutation.isPending}
              data-testid="button-save-module"
            >
              {(createModuleMutation.isPending || updateModuleMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingModule ? 'Save Changes' : 'Create Module'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
            <DialogDescription>
              Add content for your lesson
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Title</Label>
                <Input
                  id="lesson-title"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="Lesson title"
                  data-testid="input-lesson-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-duration">Duration (minutes)</Label>
                <Input
                  id="lesson-duration"
                  type="number"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 0 })}
                  data-testid="input-lesson-duration"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-video">Video URL (optional)</Label>
              <Input
                id="lesson-video"
                value={lessonForm.videoUrl}
                onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                data-testid="input-lesson-video"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-content">Content</Label>
              <Textarea
                id="lesson-content"
                value={lessonForm.content}
                onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                placeholder="Write your lesson content here..."
                rows={8}
                data-testid="input-lesson-content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveLesson}
              disabled={!lessonForm.title || !lessonForm.content || createLessonMutation.isPending || updateLessonMutation.isPending}
              data-testid="button-save-lesson"
            >
              {(createLessonMutation.isPending || updateLessonMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingLesson ? 'Save Changes' : 'Create Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? 'Edit Quiz' : 'Create Quiz'}</DialogTitle>
            <DialogDescription>
              Configure quiz settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-title">Title</Label>
              <Input
                id="quiz-title"
                value={quizForm.title}
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                placeholder="e.g., Module 1 Assessment"
                data-testid="input-quiz-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiz-description">Description</Label>
              <Textarea
                id="quiz-description"
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                placeholder="Brief description of the quiz"
                rows={2}
                data-testid="input-quiz-description"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiz-passing">Passing Score (%)</Label>
                <Input
                  id="quiz-passing"
                  type="number"
                  min={0}
                  max={100}
                  value={quizForm.passingScore}
                  onChange={(e) => setQuizForm({ ...quizForm, passingScore: parseInt(e.target.value) || 70 })}
                  data-testid="input-quiz-passing"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiz-time">Time Limit (seconds)</Label>
                <Input
                  id="quiz-time"
                  type="number"
                  min={0}
                  value={quizForm.timeLimit}
                  onChange={(e) => setQuizForm({ ...quizForm, timeLimit: parseInt(e.target.value) || 0 })}
                  data-testid="input-quiz-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiz-attempts">Max Attempts</Label>
                <Input
                  id="quiz-attempts"
                  type="number"
                  min={1}
                  value={quizForm.maxAttempts}
                  onChange={(e) => setQuizForm({ ...quizForm, maxAttempts: parseInt(e.target.value) || 3 })}
                  data-testid="input-quiz-attempts"
                />
              </div>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch
                  id="shuffle"
                  checked={quizForm.shuffleQuestions}
                  onCheckedChange={(checked) => setQuizForm({ ...quizForm, shuffleQuestions: checked })}
                />
                <Label htmlFor="shuffle">Shuffle questions</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="showAnswers"
                  checked={quizForm.showCorrectAnswers}
                  onCheckedChange={(checked) => setQuizForm({ ...quizForm, showCorrectAnswers: checked })}
                />
                <Label htmlFor="showAnswers">Show correct answers after</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="publish"
                  checked={quizForm.isPublished}
                  onCheckedChange={(checked) => setQuizForm({ ...quizForm, isPublished: checked })}
                  data-testid="switch-quiz-publish"
                />
                <Label htmlFor="publish" className="font-medium text-kaspa-cyan">Publish Quiz</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveQuiz}
              disabled={!quizForm.title || createQuizMutation.isPending || updateQuizMutation.isPending}
              data-testid="button-save-quiz"
            >
              {(createQuizMutation.isPending || updateQuizMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingQuiz ? 'Save Changes' : 'Create Quiz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
            <DialogDescription>
              Create a question for this quiz
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question-type">Question Type</Label>
                <Select
                  value={questionForm.questionType}
                  onValueChange={(value: any) => setQuestionForm({ ...questionForm, questionType: value })}
                >
                  <SelectTrigger id="question-type" data-testid="select-question-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_choice">Single Choice</SelectItem>
                    <SelectItem value="multi_select">Multiple Select</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="short_answer">Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="question-points">Points</Label>
                <Input
                  id="question-points"
                  type="number"
                  min={1}
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 1 })}
                  data-testid="input-question-points"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question-text">Question</Label>
              <Textarea
                id="question-text"
                value={questionForm.question}
                onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                placeholder="Enter your question..."
                rows={3}
                data-testid="input-question-text"
              />
            </div>

            {questionForm.questionType === 'short_answer' ? (
              <div className="space-y-2">
                <Label htmlFor="correct-answer">Correct Answer</Label>
                <Input
                  id="correct-answer"
                  value={questionForm.correctAnswer || ''}
                  onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                  placeholder="Enter the correct answer"
                  data-testid="input-correct-answer"
                />
              </div>
            ) : questionForm.questionType === 'true_false' ? (
              <div className="space-y-2">
                <Label>Correct Answer</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={questionForm.options[0]?.isCorrect ? "default" : "outline"}
                    onClick={() => setQuestionForm({
                      ...questionForm,
                      options: [
                        { id: 'true', text: 'True', isCorrect: true },
                        { id: 'false', text: 'False', isCorrect: false },
                      ]
                    })}
                  >
                    True
                  </Button>
                  <Button
                    type="button"
                    variant={questionForm.options[1]?.isCorrect ? "default" : "outline"}
                    onClick={() => setQuestionForm({
                      ...questionForm,
                      options: [
                        { id: 'true', text: 'True', isCorrect: false },
                        { id: 'false', text: 'False', isCorrect: true },
                      ]
                    })}
                  >
                    False
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Label>Answer Options</Label>
                {questionForm.options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-3">
                    <input
                      type={questionForm.questionType === 'multi_select' ? 'checkbox' : 'radio'}
                      checked={option.isCorrect}
                      onChange={() => {
                        const newOptions = [...questionForm.options];
                        if (questionForm.questionType === 'multi_select') {
                          newOptions[index].isCorrect = !newOptions[index].isCorrect;
                        } else {
                          newOptions.forEach((o, i) => o.isCorrect = i === index);
                        }
                        setQuestionForm({ ...questionForm, options: newOptions });
                      }}
                      className="w-4 h-4"
                    />
                    <Input
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = [...questionForm.options];
                        newOptions[index].text = e.target.value;
                        setQuestionForm({ ...questionForm, options: newOptions });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className="flex-1"
                      data-testid={`input-option-${option.id}`}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestionForm({
                    ...questionForm,
                    options: [
                      ...questionForm.options,
                      { id: String.fromCharCode(97 + questionForm.options.length), text: '', isCorrect: false }
                    ]
                  })}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="question-explanation">Explanation (shown after answer)</Label>
              <Textarea
                id="question-explanation"
                value={questionForm.explanation || ''}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                placeholder="Explain why this answer is correct..."
                rows={2}
                data-testid="input-question-explanation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question-hint">Hint (optional)</Label>
              <Input
                id="question-hint"
                value={questionForm.hint || ''}
                onChange={(e) => setQuestionForm({ ...questionForm, hint: e.target.value })}
                placeholder="Give students a hint..."
                data-testid="input-question-hint"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveQuestion}
              disabled={!questionForm.question || createQuestionMutation.isPending || updateQuestionMutation.isPending}
              data-testid="button-save-question"
            >
              {(createQuestionMutation.isPending || updateQuestionMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingQuestion ? 'Save Changes' : 'Add Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
