import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CourseCard, { CourseDisplay } from '@/components/CourseCard';
import Footer from '@/components/Footer';
import { Search, Filter, Sparkles, TrendingUp, Clock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { Course } from '@shared/schema';

const categories = ['All', 'blockchain', 'development', 'tokenomics', 'trading', 'security'];
const difficulties = ['All', 'beginner', 'intermediate', 'advanced'];

function mapCourseToDisplay(course: Course): CourseDisplay {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    shortDescription: course.shortDescription,
    thumbnail: course.thumbnail,
    category: course.category,
    difficulty: course.difficulty,
    duration: course.duration,
    enrollmentCount: course.enrollmentCount,
    rating: course.rating,
    bmtReward: course.bmtReward,
  };
}

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [filter, setFilter] = useState('all');

  const { data: courses = [], isLoading, error, refetch } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'All' || course.category === category;
    const matchesDifficulty = difficulty === 'All' || course.difficulty === difficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleEnroll = (courseId: string) => {
    console.log('Enrolling in course:', courseId);
  };

  return (
    <div className="min-h-screen pt-20 pb-8" data-testid="page-courses">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-4xl text-white mb-2">All Courses</h1>
          <p className="text-muted-foreground">Explore our complete course catalog and start earning $BMT</p>
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
                  <SelectItem key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-40 bg-muted border-border" data-testid="select-difficulty">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((diff) => (
                  <SelectItem key={diff} value={diff}>
                    {diff === 'All' ? 'All Levels' : diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </SelectItem>
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

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-kaspa-cyan animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading courses...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-xl text-white mb-2">Failed to load courses</h3>
            <p className="text-muted-foreground mb-6">We couldn't fetch the course catalog. Please try again.</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={mapCourseToDisplay(course)}
                  onEnroll={handleEnroll}
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
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
