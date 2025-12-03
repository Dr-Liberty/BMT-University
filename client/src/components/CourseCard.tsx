import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, Star, BookOpen } from 'lucide-react';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  students: number;
  rating: number;
  price: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  progress?: number;
  thumbnail?: string;
}

interface CourseCardProps {
  course: Course;
  enrolled?: boolean;
  onEnroll?: (courseId: string) => void;
  onContinue?: (courseId: string) => void;
}

const difficultyColors = {
  Beginner: 'bg-kaspa-green/20 text-kaspa-green border-kaspa-green/30',
  Intermediate: 'bg-bmt-orange/20 text-bmt-orange border-bmt-orange/30',
  Advanced: 'bg-destructive/20 text-destructive border-destructive/30',
};

export default function CourseCard({ course, enrolled, onEnroll, onContinue }: CourseCardProps) {
  return (
    <Card 
      className="bg-card border-border hover:border-kaspa-cyan/50 transition-all group overflow-visible"
      data-testid={`card-course-${course.id}`}
    >
      <div className="relative aspect-video bg-muted rounded-t-md overflow-hidden">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-kaspa-cyan/20 to-bmt-orange/20">
            <BookOpen className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <Badge 
          className={`absolute top-3 right-3 ${difficultyColors[course.difficulty]}`}
          data-testid={`badge-difficulty-${course.id}`}
        >
          {course.difficulty}
        </Badge>
        <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur text-foreground">
          {course.category}
        </Badge>
      </div>

      <CardContent className="p-4">
        <h3 className="font-heading font-semibold text-lg text-white mb-2 line-clamp-2 group-hover:text-kaspa-cyan transition-colors" data-testid={`text-course-title-${course.id}`}>
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {course.students.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-bmt-orange">
            <Star className="w-4 h-4 fill-current" />
            {course.rating.toFixed(1)}
          </span>
        </div>

        {enrolled && course.progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-kaspa-cyan">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          By <span className="text-white">{course.instructor}</span>
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="font-heading font-bold text-lg text-bmt-orange">{course.price}</span>
          <span className="text-sm text-muted-foreground">$BMT</span>
        </div>
        {enrolled ? (
          <Button 
            size="sm"
            onClick={() => onContinue?.(course.id)}
            className="bg-kaspa-cyan text-background hover:bg-kaspa-cyan/90"
            data-testid={`button-continue-${course.id}`}
          >
            Continue
          </Button>
        ) : (
          <Button 
            size="sm"
            onClick={() => onEnroll?.(course.id)}
            className="bg-bmt-orange text-background hover:bg-bmt-orange/90"
            data-testid={`button-enroll-${course.id}`}
          >
            Enroll Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
