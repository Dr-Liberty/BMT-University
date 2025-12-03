import { useState, useMemo } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Trophy, RefreshCw, Loader2, AlertCircle, CheckCircle, XCircle, Award } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { getAuthToken } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Quiz as QuizType, Course, QuizAttempt, Reward, Certificate } from '@shared/schema';

interface QuizQuestion {
  id: string;
  question: string;
  options: Array<{ id: string; text: string }>;
  explanation?: string | null;
  orderIndex?: number;
}

interface QuizWithQuestions extends QuizType {
  questions?: QuizQuestion[];
}

interface CourseWithDetails extends Course {
  quiz?: QuizWithQuestions;
}

interface SubmitQuizResponse {
  attempt: QuizAttempt;
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  feedback: Record<string, { correct: boolean; correctAnswer: string; explanation?: string }>;
  reward: Reward | null;
  certificate: Certificate | null;
}

export default function Quiz() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const courseId = params.courseId || '1';
  const { toast } = useToast();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizResult, setQuizResult] = useState<SubmitQuizResponse | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<{ correct: boolean; explanation?: string } | null>(null);

  const isAuthenticated = !!getAuthToken();

  const { data: courseData, isLoading, error } = useQuery<CourseWithDetails>({
    queryKey: ['/api/courses', courseId],
  });

  const submitMutation = useMutation<SubmitQuizResponse, Error, { quizId: string; answers: Record<string, string> }>({
    mutationFn: async ({ quizId, answers }) => {
      const res = await apiRequest('POST', `/api/quizzes/${quizId}/submit`, { answers });
      return res.json();
    },
    onSuccess: (data) => {
      setQuizResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      
      if (data.passed) {
        toast({
          title: 'Quiz Passed!',
          description: `You scored ${data.score}% and earned ${data.reward?.amount.toLocaleString() || 0} $BMT!`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit quiz. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const questions = useMemo(() => {
    return courseData?.quiz?.questions || [];
  }, [courseData]);

  const quiz = courseData?.quiz;
  const courseName = courseData?.title || 'Course Quiz';
  const bmtReward = courseData?.bmtReward ?? 500;
  const passingScore = quiz?.passingScore ?? 70;

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    if (showFeedback) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setShowFeedback(false);
      setCurrentFeedback(null);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    
    if (Object.keys(answers).length < questions.length) {
      toast({
        title: 'Incomplete Quiz',
        description: 'Please answer all questions before submitting.',
        variant: 'destructive',
      });
      return;
    }
    
    submitMutation.mutate({ quizId: quiz.id, answers });
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowFeedback(false);
    setQuizResult(null);
    setCurrentFeedback(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center" data-testid="page-quiz-auth-required">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-bmt-orange mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl text-white mb-2">Wallet Connection Required</h2>
          <p className="text-muted-foreground mb-6">Please connect your wallet to take quizzes and earn $BMT rewards.</p>
          <Button onClick={() => setLocation('/courses')} variant="outline" className="border-kaspa-cyan text-kaspa-cyan">
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center" data-testid="page-quiz-loading">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-kaspa-cyan animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !courseData?.quiz) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center" data-testid="page-quiz-error">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl text-white mb-2">Quiz Not Available</h2>
          <p className="text-muted-foreground mb-6">This course doesn't have a quiz yet, or it failed to load.</p>
          <Button onClick={() => setLocation(`/course/${courseId}`)} variant="outline">
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center" data-testid="page-quiz-no-questions">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl text-white mb-2">No Questions Available</h2>
          <p className="text-muted-foreground mb-6">This quiz doesn't have any questions yet.</p>
          <Button onClick={() => setLocation(`/course/${courseId}`)} variant="outline">
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  if (quizResult) {
    return (
      <div className="min-h-screen pt-20 pb-8" data-testid="page-quiz-results">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Card className="bg-card border-border text-center py-12">
            <CardContent>
              <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                quizResult.passed ? 'bg-kaspa-green/20' : 'bg-bmt-orange/20'
              }`}>
                <Trophy className={`w-12 h-12 ${quizResult.passed ? 'text-kaspa-green' : 'text-bmt-orange'}`} />
              </div>

              <h1 className="font-heading font-bold text-3xl text-white mb-2" data-testid="text-result-title">
                {quizResult.passed ? 'Congratulations!' : 'Almost There!'}
              </h1>
              <p className="text-muted-foreground mb-8">
                {quizResult.passed 
                  ? 'You passed the quiz and earned your $BMT reward!'
                  : `You need ${passingScore}% to pass. Give it another try!`}
              </p>

              <div className={`text-6xl font-heading font-bold mb-4 ${
                quizResult.passed ? 'text-kaspa-green' : 'text-bmt-orange'
              }`} data-testid="text-score">
                {quizResult.score}%
              </div>
              <p className="text-muted-foreground mb-8" data-testid="text-correct-count">
                {quizResult.correctCount} out of {quizResult.totalQuestions} correct
              </p>

              {quizResult.passed && quizResult.reward && (
                <div className="bg-muted p-4 rounded-lg mb-8" data-testid="reward-earned">
                  <p className="text-sm text-muted-foreground mb-1">Reward Earned</p>
                  <p className="font-heading font-bold text-2xl text-bmt-orange">
                    +{quizResult.reward.amount.toLocaleString()} $BMT
                  </p>
                </div>
              )}

              {quizResult.passed && quizResult.certificate && (
                <div className="bg-kaspa-cyan/10 border border-kaspa-cyan/30 p-4 rounded-lg mb-8" data-testid="certificate-earned">
                  <Award className="w-8 h-8 text-kaspa-cyan mx-auto mb-2" />
                  <p className="text-sm text-kaspa-cyan">Certificate Issued</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verification Code: {quizResult.certificate.verificationCode}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!quizResult.passed && (
                  <Button 
                    onClick={resetQuiz} 
                    className="gap-2 bg-bmt-orange text-background"
                    data-testid="button-try-again"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/dashboard')}
                  className="border-kaspa-cyan text-kaspa-cyan"
                  data-testid="button-back-to-dashboard"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const selectedAnswer = answers[currentQ.id];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="min-h-screen pt-20 pb-8" data-testid="page-quiz">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation(`/course/${courseId}`)}
            className="mb-4 text-muted-foreground"
            data-testid="button-back-to-course"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>

          <h1 className="font-heading font-bold text-2xl text-white mb-2" data-testid="text-quiz-title">
            {quiz.title || courseName}
          </h1>
          <p className="text-muted-foreground">
            Pass with {passingScore}% to earn <span className="text-bmt-orange">{bmtReward.toLocaleString()} $BMT</span>
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-kaspa-cyan" data-testid="text-quiz-progress">
              {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />
        </div>

        <Card className="bg-card border-border" data-testid="card-question">
          <CardContent className="p-6">
            <p className="text-lg text-white mb-6" data-testid="text-question">
              {currentQ.question}
            </p>

            <RadioGroup
              value={selectedAnswer || ''}
              onValueChange={(value) => handleSelectAnswer(currentQ.id, value)}
              className="space-y-3"
            >
              {currentQ.options.map((option, index) => (
                <div 
                  key={option.id} 
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                    selectedAnswer === option.id
                      ? 'border-kaspa-cyan bg-kaspa-cyan/10'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <RadioGroupItem 
                    value={option.id} 
                    id={`option-${option.id}`}
                    data-testid={`radio-option-${index}`}
                  />
                  <Label 
                    htmlFor={`option-${option.id}`}
                    className="flex-1 cursor-pointer text-foreground"
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between mt-8">
              <Button
                variant="ghost"
                onClick={() => {
                  if (currentQuestion > 0) {
                    setCurrentQuestion(prev => prev - 1);
                  }
                }}
                disabled={currentQuestion === 0}
                data-testid="button-previous"
              >
                Previous
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={!allAnswered || submitMutation.isPending}
                  className="bg-kaspa-cyan text-background gap-2"
                  data-testid="button-submit-quiz"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Quiz'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  disabled={!selectedAnswer}
                  className="bg-kaspa-cyan text-background"
                  data-testid="button-next"
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(idx)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                currentQuestion === idx
                  ? 'bg-kaspa-cyan text-background'
                  : answers[q.id]
                    ? 'bg-kaspa-cyan/30 text-kaspa-cyan'
                    : 'bg-muted text-muted-foreground'
              }`}
              data-testid={`button-question-${idx + 1}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
