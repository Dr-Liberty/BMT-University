import CourseCard from '../CourseCard';

// todo: remove mock functionality
const mockCourse = {
  id: '1',
  title: 'Introduction to Kaspa Blockchain',
  description: 'Learn the fundamentals of the Kaspa blockDAG architecture and why it\'s revolutionizing crypto.',
  instructor: 'Satoshi Nakamoto Jr.',
  duration: '4h 30m',
  students: 1247,
  rating: 4.8,
  price: 500,
  difficulty: 'Beginner' as const,
  category: 'Blockchain',
};

export default function CourseCardExample() {
  return (
    <div className="max-w-sm p-4 bg-background">
      <CourseCard 
        course={mockCourse}
        onEnroll={(id) => console.log('Enroll:', id)}
      />
    </div>
  );
}
