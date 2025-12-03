import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import QuizCard, { QuizQuestion } from '@/components/QuizCard';
import { ArrowLeft, ArrowRight, Trophy, RefreshCw } from 'lucide-react';

// todo: remove mock functionality
const mockQuiz: QuizQuestion[] = [
  {
    id: '1',
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
    id: '2',
    question: 'What is the main advantage of Kaspa\'s blockDAG structure?',
    options: [
      'Lower energy consumption',
      'Higher throughput with parallel block creation',
      'Smart contract support',
      'Anonymous transactions',
    ],
    correctAnswer: 1,
  },
  {
    id: '3',
    question: 'What is the Kaspa block time?',
    options: [
      '10 minutes',
      '1 minute',
      '1 second',
      '10 seconds',
    ],
    correctAnswer: 2,
  },
  {
    id: '4',
    question: 'What protocol is used for tokens on Kaspa?',
    options: [
      'ERC-20',
      'BRC-20',
      'KRC-20 (Kasplex)',
      'SPL',
    ],
    correctAnswer: 2,
  },
  {
    id: '5',
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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  const handleAnswer = (questionId: string, answer: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    if (currentQuestion < mockQuiz.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
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
    mockQuiz.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return { correct, total: mockQuiz.length, percentage: Math.round((correct / mockQuiz.length) * 100) };
  };

  const score = calculateScore();
  const passed = score.percentage >= 70;

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
                  ? 'You passed the quiz and earned your reward!'
                  : 'You need 70% to pass. Try again!'}
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
                  <p className="font-heading font-bold text-2xl text-bmt-orange">+500 $BMT</p>
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

  return (
    <div className="min-h-screen pt-20 pb-8" data-testid="page-quiz">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/dashboard')}
            className="mb-4 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
          
          <h1 className="font-heading font-bold text-2xl text-white mb-2">
            Introduction to Kaspa Blockchain
          </h1>
          <p className="text-muted-foreground">Final Quiz - Pass with 70% to earn your certificate</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-kaspa-cyan">{currentQuestion + 1} of {mockQuiz.length}</span>
          </div>
          <Progress value={((currentQuestion + 1) / mockQuiz.length) * 100} className="h-2" />
        </div>

        <QuizCard
          question={mockQuiz[currentQuestion]}
          questionNumber={currentQuestion + 1}
          totalQuestions={mockQuiz.length}
          onAnswer={handleAnswer}
          showResult={showResults && answers[mockQuiz[currentQuestion].id] !== undefined}
          selectedAnswer={answers[mockQuiz[currentQuestion].id]}
        />
      </div>
    </div>
  );
}
