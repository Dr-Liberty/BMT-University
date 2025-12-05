import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useLocation } from 'wouter';
import CourseCard, { CourseDisplay } from './CourseCard';
import { Sparkles, TrendingUp, Clock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Course } from '@shared/schema';

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

type FilterType = 'featured' | 'trending' | 'new';

export default function FeaturedCourses() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<FilterType>('featured');
  const { toast } = useToast();

  const { data: courses = [], isLoading, error, refetch } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return apiRequest('POST', `/api/courses/${courseId}/enroll`);
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      toast({
        title: 'Enrolled successfully!',
        description: 'You can now start learning.',
      });
      setLocation(`/course/${courseId}`);
    },
    onError: (error: any, courseId: string) => {
      if (error?.message?.includes('Already enrolled')) {
        toast({
          title: 'Continuing your course',
          description: 'Taking you to where you left off.',
        });
        setLocation(`/course/${courseId}`);
      } else {
        toast({
          title: 'Connect your wallet',
          description: 'Please connect your wallet to enroll in courses.',
          variant: 'destructive',
        });
      }
    },
  });

  const handleEnroll = (courseId: string) => {
    enrollMutation.mutate(courseId);
  };

  const displayCourses = courses.slice(0, 6);

  return (
    <section className="py-16 px-4 sm:px-6" data-testid="section-featured-courses">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-heading font-bold text-3xl text-white mb-2">Explore Courses</h2>
            <p className="text-muted-foreground">Master BlockDAG with expert-led courses</p>
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

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-kaspa-cyan animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading courses...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-xl text-white mb-2">Couldn't load courses</h3>
            <p className="text-muted-foreground mb-6">Please try again in a moment.</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        ) : displayCourses.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-xl text-white mb-2">No courses available yet</h3>
            <p className="text-muted-foreground">Check back soon for new content.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={mapCourseToDisplay(course)}
                onEnroll={handleEnroll}
              />
            ))}
          </div>
        )}

        <div className="flex justify-center mt-10">
          <Link href="/courses">
            <Button 
              variant="outline" 
              className="border-kaspa-cyan text-kaspa-cyan hover:bg-kaspa-cyan/10 font-heading uppercase"
              data-testid="button-view-all-courses"
            >
              View All Courses
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
