import RewardHistory from '../RewardHistory';

// todo: remove mock functionality
const mockTransactions = [
  {
    id: '1',
    type: 'course_completion' as const,
    courseName: 'Introduction to Kaspa Blockchain',
    amount: 500,
    txHash: '0x8f7e6d5c4b3a2190f8e7d6c5b4a3f2e1d0c9b8a7',
    status: 'confirmed' as const,
    date: 'Dec 3, 2025',
  },
  {
    id: '2',
    type: 'quiz_bonus' as const,
    courseName: 'Perfect Score Bonus',
    amount: 100,
    txHash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
    status: 'confirmed' as const,
    date: 'Dec 2, 2025',
  },
  {
    id: '3',
    type: 'course_completion' as const,
    courseName: 'DeFi Trading Strategies',
    amount: 750,
    txHash: '0x9h8g7f6e5d4c3b2a1z0y9x8w7v6u5t4s',
    status: 'pending' as const,
    date: 'Dec 1, 2025',
  },
];

export default function RewardHistoryExample() {
  return (
    <div className="max-w-xl p-4 bg-background">
      <RewardHistory transactions={mockTransactions} />
    </div>
  );
}
