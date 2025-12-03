import { useState } from 'react';
import QuizCard from '../QuizCard';

// todo: remove mock functionality
const mockQuestion = {
  id: '1',
  question: 'What consensus mechanism does Kaspa use?',
  options: [
    'Proof of Stake (PoS)',
    'Proof of Work (PoW) with GHOSTDAG',
    'Delegated Proof of Stake (DPoS)',
    'Proof of Authority (PoA)',
  ],
  correctAnswer: 1,
};

export default function QuizCardExample() {
  const [showResult, setShowResult] = useState(false);
  const [selected, setSelected] = useState<number>();

  const handleAnswer = (id: string, answer: number) => {
    console.log('Answered question', id, 'with', answer);
    setSelected(answer);
    setShowResult(true);
  };

  return (
    <div className="max-w-2xl p-4 bg-background">
      <QuizCard
        question={mockQuestion}
        questionNumber={1}
        totalQuestions={5}
        onAnswer={handleAnswer}
        showResult={showResult}
        selectedAnswer={selected}
      />
    </div>
  );
}
