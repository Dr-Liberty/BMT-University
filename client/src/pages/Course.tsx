import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Clock, Users, Star, BookOpen, Play, CheckCircle, Lock, Award, Loader2, AlertCircle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Course as CourseType, Lesson, Quiz, Enrollment } from '@shared/schema';

interface CourseWithDetails extends CourseType {
  lessons?: Lesson[];
  quiz?: Quiz;
}

interface EnrollmentWithCourse extends Enrollment {
  course?: CourseType;
}

function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return 'Self-paced';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

export default function Course() {
  const { courseId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  const { data: course, isLoading, error } = useQuery<CourseWithDetails>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  const { data: enrollments = [] } = useQuery<EnrollmentWithCourse[]>({
    queryKey: ['/api/enrollments'],
    retry: false,
  });

  const enrollment = enrollments.find(e => e.courseId === courseId);
  const isEnrolled = !!enrollment;

  const enrollMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/courses/${courseId}/enroll`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      toast({
        title: 'Enrolled successfully!',
        description: 'You can now start learning.',
      });
    },
    onError: () => {
      toast({
        title: 'Connect your wallet',
        description: 'Please connect your wallet to enroll.',
        variant: 'destructive',
      });
    },
  });

  const progressMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      return apiRequest('POST', `/api/enrollments/${enrollment?.id}/progress`, { lessonId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
    },
  });

  const handleLessonComplete = (lessonId: string) => {
    if (enrollment) {
      progressMutation.mutate(lessonId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center" data-testid="page-course-loading">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-kaspa-cyan animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center" data-testid="page-course-error">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl text-white mb-2">Course Not Found</h2>
          <p className="text-muted-foreground mb-6">We couldn't find the course you're looking for.</p>
          <Button onClick={() => setLocation('/courses')} variant="outline">
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  const lessons = course.lessons || [];
  const completedLessons = enrollment?.completedLessons || [];
  const progress = enrollment?.progress || 0;
  const allLessonsCompleted = lessons.length > 0 && completedLessons.length >= lessons.length;

  return (
    <div className="min-h-screen pt-20 pb-8" data-testid="page-course">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/courses')}
          className="mb-6 text-muted-foreground"
          data-testid="button-back-to-courses"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className="bg-kaspa-cyan/20 text-kaspa-cyan border-kaspa-cyan/30">
                  {course.category}
                </Badge>
                <Badge className="bg-bmt-orange/20 text-bmt-orange border-bmt-orange/30">
                  {course.difficulty}
                </Badge>
              </div>
              <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-4" data-testid="text-course-title">
                {course.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatDuration(course.duration)}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {course.enrollmentCount.toLocaleString()} enrolled
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {lessons.length} lessons
                </span>
                {course.rating && (
                  <span className="flex items-center gap-2 text-bmt-orange">
                    <Star className="w-4 h-4 fill-current" />
                    {parseFloat(course.rating).toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            {isEnrolled && (
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Your Progress</span>
                    <span className="text-sm font-semibold text-kaspa-cyan">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardContent>
              </Card>
            )}

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-white">Course Content</CardTitle>
              </CardHeader>
              <CardContent>
                {lessons.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Course content is being prepared. Check back soon!
                  </p>
                ) : (
                  <Accordion type="single" collapsible value={expandedLesson || undefined} onValueChange={v => setExpandedLesson(v)}>
                    {lessons.map((lesson, index) => {
                      const isCompleted = completedLessons.includes(lesson.id);
                      const isLocked = !isEnrolled && index > 0;

                      return (
                        <AccordionItem key={lesson.id} value={lesson.id} className="border-border">
                          <AccordionTrigger className="hover:no-underline py-4" data-testid={`accordion-lesson-${lesson.id}`}>
                            <div className="flex items-center gap-3 text-left">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted 
                                  ? 'bg-kaspa-green/20 text-kaspa-green' 
                                  : isLocked 
                                    ? 'bg-muted text-muted-foreground' 
                                    : 'bg-kaspa-cyan/20 text-kaspa-cyan'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : isLocked ? (
                                  <Lock className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-white">{lesson.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDuration(lesson.duration)}
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pl-11 pb-4">
                            {isLocked ? (
                              <p className="text-muted-foreground">Enroll to unlock this lesson.</p>
                            ) : (
                              <>
                                <div className="prose prose-sm prose-invert text-muted-foreground mb-4">
                                  {lesson.content}
                                </div>
                                {isEnrolled && !isCompleted && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleLessonComplete(lesson.id)}
                                    disabled={progressMutation.isPending}
                                    className="bg-kaspa-cyan text-background"
                                    data-testid={`button-complete-lesson-${lesson.id}`}
                                  >
                                    {progressMutation.isPending ? 'Saving...' : 'Mark Complete'}
                                  </Button>
                                )}
                              </>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-card border-border sticky top-24">
              <CardContent className="p-6">
                <div className="aspect-video bg-muted rounded-lg mb-6 flex items-center justify-center">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <BookOpen className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Reward</p>
                    <p className="font-heading font-bold text-2xl text-bmt-orange">
                      {course.bmtReward.toLocaleString()} $BMT
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-bmt-orange" />
                </div>

                {isEnrolled ? (
                  <div className="space-y-3">
                    {allLessonsCompleted && course.quiz ? (
                      <Button
                        className="w-full bg-bmt-orange text-background"
                        onClick={() => setLocation(`/quiz/${courseId}`)}
                        data-testid="button-take-quiz"
                      >
                        Take Final Quiz
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-kaspa-cyan text-background"
                        onClick={() => {
                          const nextLesson = lessons.find(l => !completedLessons.includes(l.id));
                          if (nextLesson) setExpandedLesson(nextLesson.id);
                        }}
                        data-testid="button-continue-learning"
                      >
                        Continue Learning
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation('/dashboard')}
                    >
                      View Dashboard
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-bmt-orange text-background"
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isPending}
                    data-testid="button-enroll"
                  >
                    {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
