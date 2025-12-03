import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizCardProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (questionId: string, selectedAnswer: number) => void;
  showResult?: boolean;
  selectedAnswer?: number;
}

export default function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  showResult = false,
  selectedAnswer,
}: QuizCardProps) {
  const [localSelected, setLocalSelected] = useState<number | undefined>(selectedAnswer);

  const handleSelect = (index: number) => {
    if (showResult) return;
    setLocalSelected(index);
  };

  const handleSubmit = () => {
    if (localSelected !== undefined) {
      onAnswer(question.id, localSelected);
    }
  };

  const getOptionStyles = (index: number) => {
    if (!showResult) {
      return cn(
        'w-full p-4 text-left rounded-lg border-2 transition-all',
        localSelected === index
          ? 'border-kaspa-cyan bg-kaspa-cyan/10 text-white'
          : 'border-border bg-muted/50 text-muted-foreground hover:border-kaspa-cyan/50 hover:bg-muted'
      );
    }

    if (index === question.correctAnswer) {
      return 'w-full p-4 text-left rounded-lg border-2 border-kaspa-green bg-kaspa-green/10 text-white';
    }

    if (localSelected === index && index !== question.correctAnswer) {
      return 'w-full p-4 text-left rounded-lg border-2 border-destructive bg-destructive/10 text-white';
    }

    return 'w-full p-4 text-left rounded-lg border-2 border-border bg-muted/50 text-muted-foreground opacity-50';
  };

  return (
    <Card className="bg-card border-border" data-testid={`card-quiz-question-${question.id}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <Badge variant="outline" className="text-kaspa-cyan border-kaspa-cyan">
            Question {questionNumber} of {totalQuestions}
          </Badge>
          {showResult && (
            localSelected === question.correctAnswer ? (
              <Badge className="bg-kaspa-green/20 text-kaspa-green border-kaspa-green/30">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Correct
              </Badge>
            ) : (
              <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                <XCircle className="w-4 h-4 mr-1" />
                Incorrect
              </Badge>
            )
          )}
        </div>
        <CardTitle className="text-xl text-white flex items-start gap-3">
          <HelpCircle className="w-6 h-6 text-kaspa-cyan shrink-0 mt-1" />
          {question.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            className={getOptionStyles(index)}
            disabled={showResult}
            data-testid={`button-quiz-option-${question.id}-${index}`}
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-sm font-heading font-semibold">
                {String.fromCharCode(65 + index)}
              </span>
              <span>{option}</span>
              {showResult && index === question.correctAnswer && (
                <CheckCircle2 className="w-5 h-5 text-kaspa-green ml-auto" />
              )}
              {showResult && localSelected === index && index !== question.correctAnswer && (
                <XCircle className="w-5 h-5 text-destructive ml-auto" />
              )}
            </div>
          </button>
        ))}

        {!showResult && (
          <Button
            onClick={handleSubmit}
            disabled={localSelected === undefined}
            className="w-full mt-4 bg-bmt-orange text-background hover:bg-bmt-orange/90"
            data-testid={`button-submit-answer-${question.id}`}
          >
            Submit Answer
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
