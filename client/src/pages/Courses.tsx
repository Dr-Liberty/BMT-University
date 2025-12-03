import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CourseCard, { Course } from '@/components/CourseCard';
import Footer from '@/components/Footer';
import { Search, Filter, Sparkles, TrendingUp, Clock } from 'lucide-react';

// todo: remove mock functionality
const allCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Kaspa Blockchain',
    description: 'Master the fundamentals of the Kaspa blockDAG architecture.',
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
    description: 'Build and deploy your own tokens on the Kasplex protocol.',
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
    description: 'Learn proven trading strategies for decentralized finance.',
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
    description: 'Identify vulnerabilities and audit smart contracts.',
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
    description: 'Everything you need to know about cryptocurrency.',
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
    description: 'Create, mint, and market your NFT collections.',
    instructor: 'NFT Ninja',
    duration: '4h 00m',
    students: 1876,
    rating: 4.4,
    price: 800,
    difficulty: 'Intermediate',
    category: 'NFTs',
  },
  {
    id: '7',
    title: 'Blockchain for Business',
    description: 'Enterprise blockchain solutions and implementation.',
    instructor: 'Business Bob',
    duration: '5h 45m',
    students: 542,
    rating: 4.3,
    price: 1200,
    difficulty: 'Intermediate',
    category: 'Business',
  },
  {
    id: '8',
    title: 'Mining & Node Operations',
    description: 'Set up and run your own Kaspa mining operation.',
    instructor: 'Miner Mike',
    duration: '3h 15m',
    students: 892,
    rating: 4.6,
    price: 600,
    difficulty: 'Intermediate',
    category: 'Mining',
  },
];

const categories = ['All', 'Blockchain', 'Development', 'Trading', 'Security', 'NFTs', 'Business', 'Mining'];
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [filter, setFilter] = useState('all');

  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'All' || course.category === category;
    const matchesDifficulty = difficulty === 'All' || course.difficulty === difficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="min-h-screen pt-20 pb-8" data-testid="page-courses">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-4xl text-white mb-2">All Courses</h1>
          <p className="text-muted-foreground">Explore our complete course catalog</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border"
              data-testid="input-search-courses"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40 bg-muted border-border" data-testid="select-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-40 bg-muted border-border" data-testid="select-difficulty">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((diff) => (
                  <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="bg-muted">
                <TabsTrigger value="all" className="gap-2" data-testid="tab-all">
                  <Sparkles className="w-4 h-4" />
                  All
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
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Badge variant="outline" className="text-muted-foreground">
            {filteredCourses.length} courses found
          </Badge>
          {category !== 'All' && (
            <Badge 
              variant="outline" 
              className="text-kaspa-cyan border-kaspa-cyan/30 cursor-pointer"
              onClick={() => setCategory('All')}
            >
              {category} &times;
            </Badge>
          )}
          {difficulty !== 'All' && (
            <Badge 
              variant="outline" 
              className="text-bmt-orange border-bmt-orange/30 cursor-pointer"
              onClick={() => setDifficulty('All')}
            >
              {difficulty} &times;
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEnroll={(id) => console.log('Enrolling in:', id)}
            />
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-xl text-white mb-2">No courses found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
