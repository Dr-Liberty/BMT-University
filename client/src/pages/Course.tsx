import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Clock, Users, Star, BookOpen, Play, CheckCircle, Lock, Award, Loader2, AlertCircle, Video, FileText, ChevronDown, ChevronRight, Image as ImageIcon, Edit2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { isAuthenticated, getWalletAddress } from '@/lib/auth';
import type { Course as CourseType, Lesson, Quiz, Enrollment, Module, CourseRating } from '@shared/schema';

function isTwitterUrl(url: string): boolean {
  return url.includes('twitter.com/') || url.includes('x.com/');
}

function TwitterEmbed({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    
    script.onload = () => {
      if ((window as any).twttr && containerRef.current) {
        (window as any).twttr.widgets.load(containerRef.current);
      }
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [url]);
  
  return (
    <div ref={containerRef} className="flex justify-center mb-4">
      <blockquote className="twitter-tweet" data-theme="dark" data-width="550">
        <a href={url}>Loading video...</a>
      </blockquote>
    </div>
  );
}

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

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  // YouTube - various formats
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }
  
  // Already an embed URL or direct video
  if (url.includes('embed') || url.match(/\.(mp4|webm|ogg)$/i)) {
    return url;
  }
  
  return url;
}

function isDirectVideo(url: string): boolean {
  return url.match(/\.(mp4|webm|ogg)$/i) !== null;
}

export default function Course() {
  const { courseId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [isEditingRating, setIsEditingRating] = useState<boolean>(false);

  const walletAddress = getWalletAddress();
  const isDemoWallet = walletAddress?.toLowerCase().startsWith('0xdead');

  const { data: course, isLoading, error } = useQuery<CourseWithDetails>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ['/api/courses', courseId, 'modules'],
    enabled: !!courseId,
  });

  const { data: enrollments = [] } = useQuery<EnrollmentWithCourse[]>({
    queryKey: ['/api/enrollments'],
    retry: false,
  });

  const enrollment = enrollments.find(e => e.courseId === courseId);
  const isEnrolled = !!enrollment;

  // Fetch user's existing rating for this course
  const { data: existingRating } = useQuery<CourseRating | null>({
    queryKey: ['/api/courses', courseId, 'rating', 'me'],
    enabled: !!courseId && isAuthenticated(),
  });

  // Initialize rating state when existing rating loads
  useEffect(() => {
    if (existingRating) {
      setUserRating(existingRating.rating);
      setReviewText(existingRating.review || '');
    }
  }, [existingRating]);

  // Submit rating mutation
  const ratingMutation = useMutation({
    mutationFn: async ({ rating, review }: { rating: number; review?: string }) => {
      const response = await apiRequest('POST', `/api/courses/${courseId}/rating`, { rating, review });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'rating', 'me'] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setIsEditingRating(false);
      toast({
        title: existingRating ? 'Rating updated!' : 'Thanks for rating!',
        description: 'Your feedback helps other learners.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to submit rating',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmitRating = () => {
    if (userRating < 1 || userRating > 5) {
      toast({
        title: 'Select a rating',
        description: 'Please select 1-5 stars.',
        variant: 'destructive',
      });
      return;
    }
    ratingMutation.mutate({ rating: userRating, review: reviewText.trim() || undefined });
  };

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

  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await apiRequest('POST', `/api/lessons/${lessonId}/complete`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      
      if (data.courseCompleted && data.certificate) {
        toast({
          title: 'Course Completed!',
          description: `Congratulations! You earned ${data.reward?.amount?.toLocaleString() || 0} $BMT and a certificate!`,
        });
      } else {
        toast({
          title: 'Lesson completed!',
          description: 'Great progress! Keep going!',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark lesson complete.',
        variant: 'destructive',
      });
    },
  });

  const handleLessonComplete = (lessonId: string) => {
    completeLessonMutation.mutate(lessonId);
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
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

  const getLessonsForModule = (moduleId: string) => {
    return lessons.filter(l => l.moduleId === moduleId).sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const getUnassignedLessons = () => {
    return lessons.filter(l => !l.moduleId).sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const hasModules = modules.length > 0;
  const unassignedLessons = getUnassignedLessons();

  const renderLesson = (lesson: Lesson, index: number, isFirstModule: boolean = true) => {
    const isCompleted = completedLessons.includes(lesson.id);
    const isLocked = !isEnrolled && (!isFirstModule || index > 0);

    return (
      <div key={lesson.id} className="border-b border-border/50 last:border-0">
        <div 
          className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors ${
            expandedLesson === lesson.id ? 'bg-muted/30' : ''
          }`}
          onClick={() => !isLocked && setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
          data-testid={`lesson-item-${lesson.id}`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
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
            ) : lesson.videoUrl ? (
              <Video className="w-4 h-4" />
            ) : lesson.imageUrl ? (
              <ImageIcon className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-sm ${isLocked ? 'text-muted-foreground' : 'text-white'}`}>
              {lesson.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDuration(lesson.duration)}
            </p>
          </div>
          {!isLocked && (
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${
              expandedLesson === lesson.id ? 'rotate-90' : ''
            }`} />
          )}
        </div>

        {expandedLesson === lesson.id && !isLocked && (
          <div className="px-4 pb-4 pl-[60px]">
            {lesson.imageUrl && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={lesson.imageUrl}
                  alt={lesson.title}
                  className="w-full max-h-80 object-cover rounded-lg"
                  data-testid={`img-lesson-${lesson.id}`}
                />
              </div>
            )}
            {lesson.videoUrl && (
              isTwitterUrl(lesson.videoUrl) ? (
                <TwitterEmbed url={lesson.videoUrl} />
              ) : (
                <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                  {isDirectVideo(lesson.videoUrl) ? (
                    <video
                      src={lesson.videoUrl}
                      controls
                      className="w-full h-full"
                      data-testid={`video-lesson-${lesson.id}`}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <iframe
                      src={getVideoEmbedUrl(lesson.videoUrl) || lesson.videoUrl}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title={lesson.title}
                      data-testid={`iframe-lesson-${lesson.id}`}
                    />
                  )}
                </div>
              )
            )}
            {lesson.contentBlocks && lesson.contentBlocks.length > 0 ? (
              <div className="space-y-4 mb-4">
                {lesson.contentBlocks
                  .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
                  .map((block: any) => (
                    <div key={block.id}>
                      {block.type === 'text' && (
                        <div className="prose prose-sm prose-invert text-muted-foreground whitespace-pre-wrap">
                          {block.content}
                        </div>
                      )}
                      {block.type === 'image' && (
                        <div className="rounded-lg overflow-hidden">
                          <img
                            src={block.content}
                            alt={block.caption || lesson.title}
                            className="w-full max-h-96 object-contain rounded-lg bg-muted/30"
                            data-testid={`img-content-block-${block.id}`}
                          />
                          {block.caption && (
                            <p className="text-xs text-muted-foreground mt-2 italic text-center">
                              {block.caption}
                            </p>
                          )}
                        </div>
                      )}
                      {block.type === 'video' && (
                        <div className="aspect-video rounded-lg overflow-hidden">
                          <iframe
                            src={block.content}
                            className="w-full h-full"
                            allowFullScreen
                            title={block.caption || lesson.title}
                          />
                        </div>
                      )}
                      {block.type === 'code' && (
                        <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{block.content}</code>
                        </pre>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="prose prose-sm prose-invert text-muted-foreground mb-4 whitespace-pre-wrap">
                {lesson.content}
              </div>
            )}
            {isEnrolled && !isCompleted && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLessonComplete(lesson.id);
                }}
                disabled={completeLessonMutation.isPending}
                className="bg-kaspa-cyan text-background"
                data-testid={`button-complete-lesson-${lesson.id}`}
              >
                {completeLessonMutation.isPending ? 'Saving...' : 'Mark Complete'}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

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
                  {hasModules ? `${modules.length} modules` : `${lessons.length} lessons`}
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
                  <p className="text-xs text-muted-foreground mt-2">
                    {completedLessons.length} of {lessons.length} lessons completed
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-white">Course Content</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {lessons.length === 0 && modules.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 px-6">
                    Course content is being prepared. Check back soon!
                  </p>
                ) : hasModules ? (
                  <div className="divide-y divide-border">
                    {modules.sort((a, b) => a.orderIndex - b.orderIndex).map((module, moduleIndex) => {
                      const moduleLessons = getLessonsForModule(module.id);
                      const moduleCompleted = moduleLessons.every(l => completedLessons.includes(l.id));
                      const moduleProgress = moduleLessons.length > 0 
                        ? Math.round((moduleLessons.filter(l => completedLessons.includes(l.id)).length / moduleLessons.length) * 100)
                        : 0;
                      const isExpanded = expandedModules.includes(module.id);

                      return (
                        <div key={module.id} data-testid={`module-${module.id}`}>
                          <div 
                            className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => toggleModule(module.id)}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              moduleCompleted 
                                ? 'bg-kaspa-green/20 text-kaspa-green'
                                : 'bg-kaspa-cyan/20 text-kaspa-cyan'
                            }`}>
                              {moduleCompleted ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <span className="font-bold text-sm">{moduleIndex + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-white">{module.title}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {moduleLessons.length} lessons
                                </Badge>
                              </div>
                              {module.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {module.description}
                                </p>
                              )}
                              {isEnrolled && moduleLessons.length > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Progress value={moduleProgress} className="h-1.5 flex-1 max-w-32" />
                                  <span className="text-xs text-muted-foreground">{moduleProgress}%</span>
                                </div>
                              )}
                            </div>
                            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`} />
                          </div>

                          {isExpanded && (
                            <div className="border-t border-border/50 bg-muted/10">
                              {moduleLessons.length > 0 ? (
                                moduleLessons.map((lesson, index) => renderLesson(lesson, index, moduleIndex === 0))
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                  No lessons in this module yet
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {unassignedLessons.length > 0 && (
                      <div>
                        <div className="px-4 py-3 bg-muted/30">
                          <h3 className="font-medium text-white text-sm">Additional Lessons</h3>
                        </div>
                        {unassignedLessons.map((lesson, index) => renderLesson(lesson, index))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {lessons.sort((a, b) => a.orderIndex - b.orderIndex).map((lesson, index) => 
                      renderLesson(lesson, index)
                    )}
                  </div>
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
                          if (nextLesson) {
                            if (nextLesson.moduleId) {
                              setExpandedModules(prev => 
                                prev.includes(nextLesson.moduleId!) ? prev : [...prev, nextLesson.moduleId!]
                              );
                            }
                            setExpandedLesson(nextLesson.id);
                          }
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

                {/* Rating Section - shows when enrolled and all lessons completed */}
                {isEnrolled && allLessonsCompleted && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-heading font-semibold text-white">
                        {existingRating ? 'Your Rating' : 'Rate This Course'}
                      </h4>
                      {existingRating && !isEditingRating && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setIsEditingRating(true)}
                          data-testid="button-edit-rating"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {isDemoWallet ? (
                      <p className="text-sm text-muted-foreground">
                        Connect a real wallet to rate this course.
                      </p>
                    ) : existingRating && !isEditingRating ? (
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= existingRating.rating
                                  ? 'text-bmt-orange fill-current'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                        {existingRating.review && (
                          <p className="text-sm text-muted-foreground italic">
                            "{existingRating.review}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className="p-0.5 transition-transform hover:scale-110"
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setUserRating(star)}
                              data-testid={`button-star-${star}`}
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  star <= (hoverRating || userRating)
                                    ? 'text-bmt-orange fill-current'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <Textarea
                          placeholder="Share your experience (optional)"
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="min-h-[80px] resize-none"
                          data-testid="textarea-review"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-bmt-orange text-background"
                            onClick={handleSubmitRating}
                            disabled={ratingMutation.isPending || userRating === 0}
                            data-testid="button-submit-rating"
                          >
                            {ratingMutation.isPending ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
                          </Button>
                          {isEditingRating && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsEditingRating(false);
                                if (existingRating) {
                                  setUserRating(existingRating.rating);
                                  setReviewText(existingRating.review || '');
                                }
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
