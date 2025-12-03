import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourseCard, { Course } from './CourseCard';
import { Sparkles, TrendingUp, Clock } from 'lucide-react';

// todo: remove mock functionality
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Kaspa Blockchain',
    description: 'Master the fundamentals of the Kaspa blockDAG architecture and understand why it\'s revolutionizing the crypto space.',
    instructor: 'Shai Wyborski',
    duration: '4h 30m',
    students: 1247,
    rating: 4.9,
    price: 500,
    difficulty: 'Beginner',
    category: 'Blockchain',
  },
  {
    id: '2',
    title: 'KRC-20 Token Development',
    description: 'Build and deploy your own tokens on the Kasplex protocol. Hands-on coding with real examples.',
    instructor: 'Dev McDevface',
    duration: '6h 15m',
    students: 856,
    rating: 4.7,
    price: 1000,
    difficulty: 'Advanced',
    category: 'Development',
  },
  {
    id: '3',
    title: 'DeFi Trading Strategies',
    description: 'Learn proven trading strategies for decentralized finance. Risk management and portfolio optimization.',
    instructor: 'Whale Watcher',
    duration: '3h 45m',
    students: 2134,
    rating: 4.6,
    price: 750,
    difficulty: 'Intermediate',
    category: 'Trading',
  },
  {
    id: '4',
    title: 'Smart Contract Security',
    description: 'Identify vulnerabilities and audit smart contracts. Essential knowledge for any blockchain developer.',
    instructor: 'Security Sam',
    duration: '5h 20m',
    students: 634,
    rating: 4.8,
    price: 1500,
    difficulty: 'Advanced',
    category: 'Security',
  },
  {
    id: '5',
    title: 'Crypto Fundamentals',
    description: 'Everything you need to know about cryptocurrency, from Bitcoin basics to advanced tokenomics.',
    instructor: 'Crypto Chad',
    duration: '2h 30m',
    students: 3421,
    rating: 4.5,
    price: 250,
    difficulty: 'Beginner',
    category: 'Fundamentals',
  },
  {
    id: '6',
    title: 'NFT Creation & Marketing',
    description: 'Create, mint, and market your NFT collections. Full guide from art to launch.',
    instructor: 'NFT Ninja',
    duration: '4h 00m',
    students: 1876,
    rating: 4.4,
    price: 800,
    difficulty: 'Intermediate',
    category: 'NFTs',
  },
];

type FilterType = 'featured' | 'trending' | 'new';

export default function FeaturedCourses() {
  const [filter, setFilter] = useState<FilterType>('featured');

  const handleEnroll = (courseId: string) => {
    console.log('Enrolling in course:', courseId);
  };

  return (
    <section className="py-16 px-4 sm:px-6" data-testid="section-featured-courses">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-heading font-bold text-3xl text-white mb-2">Explore Courses</h2>
            <p className="text-muted-foreground">Master blockchain with expert-led courses</p>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList className="bg-muted">
              <TabsTrigger value="featured" className="gap-2" data-testid="tab-featured">
                <Sparkles className="w-4 h-4" />
                Featured
              </TabsTrigger>
              <TabsTrigger value="trending" className="gap-2" data-testid="tab-trending">
                <TrendingUp className="w-4 h-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2" data-testid="tab-new">
                <Clock className="w-4 h-4" />
                New
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEnroll={handleEnroll}
            />
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Button 
            variant="outline" 
            className="border-kaspa-cyan text-kaspa-cyan hover:bg-kaspa-cyan/10 font-heading uppercase"
            data-testid="button-view-all-courses"
          >
            View All Courses
          </Button>
        </div>
      </div>
    </section>
  );
}
