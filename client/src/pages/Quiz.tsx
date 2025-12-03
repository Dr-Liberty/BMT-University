import { useState, useMemo } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import QuizCard, { QuizQuestion as DisplayQuestion } from '@/components/QuizCard';
import { ArrowLeft, Trophy, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import type { Quiz as QuizType, Course } from '@shared/schema';

interface QuizWithQuestions extends QuizType {
  questions?: Array<{
    id: string;
    question: string;
    options: Array<{ id?: string; text: string }>;
    explanation?: string | null;
    orderIndex?: number;
  }>;
}

interface CourseWithDetails extends Course {
  quiz?: QuizWithQuestions;
}

function mapToDisplayQuestion(q: { id: string; question: string; options: Array<{ id?: string; text: string }>; explanation?: string | null; }, index: number): DisplayQuestion {
  const options = Array.isArray(q.options) ? q.options : [];
  return {
    id: q.id,
    question: q.question,
    options: options.map(opt => opt.text || String(opt)),
    correctAnswer: index % 4,
  };
}

const fallbackQuestions: DisplayQuestion[] = [
  {
    id: 'fallback-1',
    question: 'What consensus mechanism does Kaspa use?',
    options: [
      'Proof of Stake (PoS)',
      'Proof of Work (PoW) with GHOSTDAG',
      'Delegated Proof of Stake (DPoS)',
      'Proof of Authority (PoA)',
    ],
    correctAnswer: 1,
  },
  {
    id: 'fallback-2',
    question: "What is the main advantage of Kaspa's blockDAG structure?",
    options: [
      'Lower energy consumption',
      'Higher throughput with parallel block creation',
      'Smart contract support',
      'Anonymous transactions',
    ],
    correctAnswer: 1,
  },
  {
    id: 'fallback-3',
    question: 'What is the Kaspa block time?',
    options: ['10 minutes', '1 minute', '1 second', '10 seconds'],
    correctAnswer: 2,
  },
  {
    id: 'fallback-4',
    question: 'What protocol is used for tokens on Kaspa?',
    options: ['ERC-20', 'BRC-20', 'KRC-20 (Kasplex)', 'SPL'],
    correctAnswer: 2,
  },
  {
    id: 'fallback-5',
    question: 'What does $BMT stand for?',
    options: [
      'Bitcoin Mining Token',
      'Bitcoin Maxi Tears',
      'Blockchain Money Transfer',
      'Basic Monetary Token',
    ],
    correctAnswer: 1,
  },
];

export default function Quiz() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const courseId = params.courseId || '1';

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  const { data: courseData, isLoading, error } = useQuery<CourseWithDetails>({
    queryKey: [`/api/courses/${courseId}`],
  });

  const displayQuestions = useMemo(() => {
    if (courseData?.quiz?.questions && courseData.quiz.questions.length > 0) {
      return courseData.quiz.questions.map((q, i) => mapToDisplayQuestion(q, i));
    }
    return fallbackQuestions;
  }, [courseData]);

  const courseName = courseData?.title || 'Course Quiz';
  const bmtReward = courseData?.bmtReward ?? 500;

  const handleAnswer = (questionId: string, answer: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));

    if (currentQuestion < displayQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
        setShowResults(false);
      }, 1500);
    } else {
      setTimeout(() => {
        setQuizComplete(true);
      }, 1500);
    }
    setShowResults(true);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setQuizComplete(false);
  };

  const calculateScore = () => {
    let correct = 0;
    displayQuestions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return { 
      correct, 
      total: displayQuestions.length, 
      percentage: displayQuestions.length > 0 ? Math.round((correct / displayQuestions.length) * 100) : 0
    };
  };

  const score = calculateScore();
  const passed = score.percentage >= 70;

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

  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center" data-testid="page-quiz-error">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl text-white mb-2">Failed to Load Quiz</h2>
          <p className="text-muted-foreground mb-6">We couldn't load the quiz. Please try again.</p>
          <Button onClick={() => setLocation('/courses')} variant="outline">
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <div className="min-h-screen pt-20 pb-8" data-testid="page-quiz-results">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Card className="bg-card border-border text-center py-12">
            <CardContent>
              <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                passed ? 'bg-kaspa-green/20' : 'bg-bmt-orange/20'
              }`}>
                <Trophy className={`w-12 h-12 ${passed ? 'text-kaspa-green' : 'text-bmt-orange'}`} />
              </div>

              <h1 className="font-heading font-bold text-3xl text-white mb-2">
                {passed ? 'Congratulations!' : 'Almost There!'}
              </h1>
              <p className="text-muted-foreground mb-8">
                {passed 
                  ? 'You passed the quiz and earned your $BMT reward!'
                  : 'You need 70% to pass. Give it another try!'}
              </p>

              <div className={`text-6xl font-heading font-bold mb-4 ${
                passed ? 'text-kaspa-green' : 'text-bmt-orange'
              }`}>
                {score.percentage}%
              </div>
              <p className="text-muted-foreground mb-8">
                {score.correct} out of {score.total} correct
              </p>

              {passed && (
                <div className="bg-muted p-4 rounded-lg mb-8">
                  <p className="text-sm text-muted-foreground mb-1">Reward Earned</p>
                  <p className="font-heading font-bold text-2xl text-bmt-orange">+{bmtReward.toLocaleString()} $BMT</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!passed && (
                  <Button onClick={resetQuiz} className="gap-2 bg-bmt-orange text-background">
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/dashboard')}
                  className="border-kaspa-cyan text-kaspa-cyan"
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

  const currentQ = displayQuestions[currentQuestion];

  if (!currentQ) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center" data-testid="page-quiz-no-questions">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl text-white mb-2">No Questions Available</h2>
          <p className="text-muted-foreground mb-6">This quiz doesn't have any questions yet.</p>
          <Button onClick={() => setLocation('/courses')} variant="outline">
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8" data-testid="page-quiz">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/dashboard')}
            className="mb-4 text-muted-foreground"
            data-testid="button-back-to-course"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>

          <h1 className="font-heading font-bold text-2xl text-white mb-2" data-testid="text-quiz-title">
            {courseName}
          </h1>
          <p className="text-muted-foreground">Final Quiz - Pass with 70% to earn your $BMT reward</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-kaspa-cyan" data-testid="text-quiz-progress">{currentQuestion + 1} of {displayQuestions.length}</span>
          </div>
          <Progress value={((currentQuestion + 1) / displayQuestions.length) * 100} className="h-2" />
        </div>

        <QuizCard
          question={currentQ}
          questionNumber={currentQuestion + 1}
          totalQuestions={displayQuestions.length}
          onAnswer={handleAnswer}
          showResult={showResults && answers[currentQ.id] !== undefined}
          selectedAnswer={answers[currentQ.id]}
        />
      </div>
    </div>
  );
}
