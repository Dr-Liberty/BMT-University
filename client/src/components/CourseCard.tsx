import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, Star, BookOpen, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';
import type { Course as APICourse } from '@shared/schema';

export interface CourseDisplay {
  id: string;
  title: string;
  description: string;
  shortDescription?: string | null;
  thumbnail?: string | null;
  category: string;
  difficulty: string;
  duration?: number | null;
  enrollmentCount: number;
  rating?: string | null;
  ratingCount?: number;
  bmtReward: number;
  progress?: number;
  quizPassed?: boolean;
  hasFailedAttempt?: boolean;
  failedAttemptCount?: number;
}

interface CourseCardProps {
  course: CourseDisplay;
  enrolled?: boolean;
  onEnroll?: (courseId: string) => void;
  onContinue?: (courseId: string) => void;
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-kaspa-green/20 text-kaspa-green border-kaspa-green/30',
  intermediate: 'bg-bmt-orange/20 text-bmt-orange border-bmt-orange/30',
  advanced: 'bg-destructive/20 text-destructive border-destructive/30',
};

function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return 'Self-paced';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function CourseCard({ course, enrolled, onEnroll, onContinue }: CourseCardProps) {
  const difficulty = (course.difficulty || 'beginner').toLowerCase();
  const difficultyClass = difficultyColors[difficulty] || difficultyColors.beginner;
  const category = course.category || 'general';
  const progressValue = Number(course.progress ?? 0);
  const isCompleted = course.quizPassed === true || progressValue >= 100;

  return (
    <Card 
      className="bg-card border-border hover:border-kaspa-cyan/50 transition-all group overflow-visible flex flex-col h-full"
      data-testid={`card-course-${course.id}`}
    >
      <Link href={`/course/${course.id}`} className="block cursor-pointer flex-1 flex flex-col">
        <div className="relative aspect-video bg-muted rounded-t-md overflow-hidden">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-kaspa-cyan/20 to-bmt-orange/20">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          <Badge 
            className={`absolute top-3 right-3 ${difficultyClass}`}
            data-testid={`badge-difficulty-${course.id}`}
          >
            {capitalizeFirst(difficulty)}
          </Badge>
          <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur text-foreground">
            {capitalizeFirst(category)}
          </Badge>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-heading font-semibold text-lg text-white mb-2 line-clamp-2 group-hover:text-kaspa-cyan transition-colors" data-testid={`text-course-title-${course.id}`}>
            {course.title}
          </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
          {course.shortDescription || course.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDuration(course.duration)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {(course.enrollmentCount ?? 0).toLocaleString()}
          </span>
          {course.rating && (
            <span className="flex items-center gap-1 text-bmt-orange" data-testid={`rating-${course.id}`}>
              <Star className="w-4 h-4 fill-current" />
              {parseFloat(course.rating).toFixed(1)}
              {course.ratingCount ? <span className="text-muted-foreground">({course.ratingCount})</span> : null}
            </span>
          )}
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
        </CardContent>
      </Link>

      <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="font-heading font-bold text-lg text-bmt-orange">{(course.bmtReward ?? 0).toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">$BMT</span>
        </div>
        {enrolled ? (
          isCompleted ? (
            <Button 
              size="sm"
              onClick={() => onContinue?.(course.id)}
              className="bg-kaspa-green text-background hover:bg-kaspa-green/90"
              data-testid={`button-completed-${course.id}`}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Completed
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={() => onContinue?.(course.id)}
              className="bg-kaspa-cyan text-background hover:bg-kaspa-cyan/90"
              data-testid={`button-continue-${course.id}`}
            >
              Continue
            </Button>
          )
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
