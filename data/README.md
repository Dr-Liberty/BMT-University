# BMT University Course Data

This directory contains all course content for BMT University, exported for portability and version control.

## Contents

### `courses.json`
Complete course data including:
- **20 Courses** with titles, descriptions, categories, difficulty levels, and BMT rewards
- **88 Lessons** with full content text
- **20 Quizzes** with passing scores and time limits
- **158 Quiz Questions** with options, correct answers, and explanations

### `images/`
Course thumbnail images (PNG format):
- `bmt_jar_*.png` - All course thumbnail images referenced in courses.json

### `videos/`
Lesson video files (MP4 format):
- Local video assets used in lessons
- Note: Some lessons also reference YouTube videos (external links preserved in courses.json)

## Usage

### Loading Course Data
```javascript
const fs = require('fs');
const courseData = JSON.parse(fs.readFileSync('data/courses.json', 'utf8'));

// Access courses
courseData.courses.forEach(course => {
  console.log(course.title);
  console.log(`  Lessons: ${course.lessons.length}`);
  console.log(`  Quiz questions: ${course.quiz?.questions?.length || 0}`);
});
```

### Image Paths
Thumbnails in `courses.json` reference paths like `/assets/generated_images/bmt_jar_*.png`.
The actual files are in `data/images/`. Update paths as needed for your deployment.

### Video Paths
Local videos reference paths like `/assets/*.mp4`.
The actual files are in `data/videos/`. YouTube links are external.

## Data Structure

```
{
  "exportDate": "2026-01-30T05:07:58.77277+00:00",
  "version": "1.0.0",
  "courses": [
    {
      "id": "course-id",
      "title": "Course Title",
      "description": "Full description...",
      "shortDescription": "Brief summary",
      "thumbnail": "/assets/generated_images/image.png",
      "category": "fundamentals|technical|consensus|development",
      "difficulty": "beginner|intermediate|advanced",
      "duration": 23,
      "bmtReward": 15000,
      "isPublished": true,
      "orderIndex": 1,
      "lessons": [
        {
          "id": "lesson-id",
          "title": "Lesson Title",
          "content": "Full lesson content...",
          "videoUrl": "/assets/video.mp4 or https://youtu.be/...",
          "orderIndex": 0,
          "duration": 5
        }
      ],
      "quiz": {
        "id": "quiz-id",
        "title": "Quiz Title",
        "passingScore": 70,
        "timeLimit": 600,
        "questions": [
          {
            "id": "question-id",
            "question": "Question text?",
            "options": [
              {"id": "a", "text": "Option A", "isCorrect": true},
              {"id": "b", "text": "Option B", "isCorrect": false}
            ],
            "explanation": "Why the answer is correct...",
            "orderIndex": 0
          }
        ]
      }
    }
  ]
}
```

## Seeding Database

To seed a fresh database with this data:

```javascript
const courseData = require('./data/courses.json');

for (const course of courseData.courses) {
  // Insert course
  await db.insert(courses).values({
    id: course.id,
    title: course.title,
    description: course.description,
    shortDescription: course.shortDescription,
    thumbnail: course.thumbnail,
    category: course.category,
    difficulty: course.difficulty,
    duration: course.duration,
    bmtReward: course.bmtReward,
    isPublished: course.isPublished,
    orderIndex: course.orderIndex
  });
  
  // Insert lessons
  for (const lesson of course.lessons) {
    await db.insert(lessons).values({
      id: lesson.id,
      courseId: course.id,
      title: lesson.title,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      orderIndex: lesson.orderIndex,
      duration: lesson.duration
    });
  }
  
  // Insert quiz and questions
  if (course.quiz) {
    await db.insert(quizzes).values({
      id: course.quiz.id,
      courseId: course.id,
      title: course.quiz.title,
      passingScore: course.quiz.passingScore,
      timeLimit: course.quiz.timeLimit
    });
    
    for (const q of course.quiz.questions) {
      await db.insert(quizQuestions).values({
        id: q.id,
        quizId: course.quiz.id,
        question: q.question,
        options: q.options,
        explanation: q.explanation,
        orderIndex: q.orderIndex
      });
    }
  }
}
```

## Export Date
Last exported: January 30, 2026
