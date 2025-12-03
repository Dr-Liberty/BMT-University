# BMT University

## Overview

BMT University is a blockchain-powered learning management system built on the Kaspa network. The platform enables crypto projects to create branded educational courses where learners earn tokens for completing quizzes and receive on-chain certificates. Starting as a proof-of-concept for the $BMT (Bitcoin Maxi Tears) meme coin on Kasplex, with plans to expand to a multi-project subscription service supporting Kasplex and Igra networks.

## Current Status

### Completed Features
- Complete frontend prototype with BMT/Kaspa branding and animated blockdag background
- Course browsing with filtering and search functionality
- Student dashboard with progress tracking and reward history
- Quiz system with multiple choice questions and scoring
- Certificate modal with verification display
- About $BMT page with editable description and roadmap (/about, /admin/about)
- Full database schema for LMS entities
- REST API endpoints for all resources
- Sample course data with real API integration

### In Progress
- Wallet authentication flow (connect, sign message, session)
- Course enrollment and progress tracking
- Quiz attempt recording and grading
- $BMT reward distribution system

## User Preferences

Preferred communication style: Simple, everyday language.
Design approach: Wallet-centric authentication (no traditional credentials), users identified by wallet address.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**UI Component Library**: Radix UI primitives with shadcn/ui styling system, providing accessible and customizable components. The design uses a "New York" variant with dark mode as the default theme.

**Styling**: Tailwind CSS with custom design tokens for the BMT University brand identity. Color palette includes:
- Kaspa Cyan (#00D4FF) - primary brand color
- BMT Orange (#FFB84D) - secondary accent color
- Kaspa Green (#00FF88) - success states
- Dark backgrounds with elevated surfaces for depth

**Typography**: 
- Space Grotesk for headings (tech-forward, geometric)
- Inter for body text (clean readability)
- JetBrains Mono for code/monospace elements

**State Management**: TanStack Query (React Query) for server state management, providing caching, background updates, and optimistic UI patterns.

**Routing**: Wouter for lightweight client-side routing with support for SPA navigation.

**Form Handling**: React Hook Form with Zod for schema validation, using @hookform/resolvers for integration.

### Backend Architecture

**Runtime**: Node.js with Express.js framework for the HTTP server.

**Language**: TypeScript with ES modules, compiled via esbuild for production builds.

**API Design**: RESTful endpoints under `/api` namespace:

**Course Endpoints:**
- `GET /api/courses` - List all published courses
- `GET /api/courses/:id` - Get single course details
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `GET /api/courses/:id/lessons` - Get lessons for a course
- `GET /api/courses/:id/quiz` - Get quiz for a course

**Quiz Endpoints:**
- `GET /api/quizzes/:id` - Get quiz details
- `GET /api/quizzes/:id/questions` - Get quiz questions

**Enrollment Endpoints:**
- `GET /api/users/:userId/enrollments` - Get user enrollments
- `POST /api/enrollments` - Enroll in a course

**Certificate Endpoints:**
- `GET /api/users/:userId/certificates` - Get user certificates

**Reward Endpoints:**
- `GET /api/users/:userId/rewards` - Get user rewards

**About Page:**
- `GET /api/about` - Get about page content
- `PUT /api/about` - Update about page content

**Middleware Stack**:
- JSON body parsing with raw body preservation (for webhook verification)
- URL-encoded form data support
- Request logging with timing and response tracking
- Static file serving for production builds

**Error Handling**: Centralized error responses with Zod validation error formatting for client-friendly messages.

### Database Layer

**ORM**: Drizzle ORM for type-safe database queries and schema management.

**Database**: PostgreSQL via Neon serverless, using WebSocket connections for serverless environments.

**Schema Design** (defined in shared/schema.ts):

**Users Table:**
- `id` (uuid, primary key)
- `walletAddress` (string, unique) - Kaspa wallet address
- `displayName` (string, optional)
- `role` (enum: student, instructor, admin)
- `avatarUrl` (string, optional)
- `createdAt`, `lastLoginAt` (timestamps)

**Courses Table:**
- `id` (uuid, primary key)
- `title`, `description`, `shortDescription`
- `thumbnail` (string, optional)
- `category` (string) - blockchain, tokenomics, development, etc.
- `difficulty` (enum: beginner, intermediate, advanced)
- `instructorId` (foreign key to users)
- `duration` (integer, minutes)
- `bmtReward` (integer) - $BMT tokens awarded on completion
- `isPublished` (boolean)
- `enrollmentCount`, `rating`
- `createdAt`, `updatedAt`

**Lessons Table:**
- `id` (uuid, primary key)
- `courseId` (foreign key)
- `title`, `content`
- `videoUrl` (optional)
- `orderIndex` (integer)
- `duration` (integer, minutes)

**Quizzes Table:**
- `id` (uuid, primary key)
- `courseId` (foreign key)
- `title`, `description`
- `passingScore` (integer, default 70)
- `timeLimit` (integer, minutes, optional)
- `maxAttempts` (integer, optional)

**Quiz Questions Table:**
- `id` (uuid, primary key)
- `quizId` (foreign key)
- `question` (text)
- `options` (jsonb array of {text, isCorrect})
- `explanation` (optional)
- `orderIndex` (integer)

**Enrollments Table:**
- `id` (uuid, primary key)
- `userId`, `courseId` (foreign keys)
- `progress` (integer, 0-100)
- `status` (enum: enrolled, in_progress, completed)
- `completedLessons` (text array)
- `enrolledAt`, `completedAt`

**Quiz Attempts Table:**
- `id` (uuid, primary key)
- `userId`, `quizId` (foreign keys)
- `score` (integer)
- `passed` (boolean)
- `answers` (jsonb)
- `attemptNumber` (integer)
- `startedAt`, `completedAt`

**Certificates Table:**
- `id` (uuid, primary key)
- `userId`, `courseId` (foreign keys)
- `certificateUrl` (string)
- `transactionHash` (string) - on-chain verification
- `issuedAt` (timestamp)

**Rewards Table:**
- `id` (uuid, primary key)
- `userId`, `courseId` (foreign keys)
- `amount` (integer) - $BMT tokens
- `type` (enum: course_completion, quiz_bonus, referral, achievement)
- `transactionHash` (string, optional)
- `status` (enum: pending, processing, confirmed, failed)
- `createdAt` (timestamp)

**Note**: Currently using in-memory storage (MemStorage) for development. Will migrate to PostgreSQL for production.

### Key File Locations

**Schema & Types:**
- `shared/schema.ts` - Database schema and Zod types

**Backend:**
- `server/routes.ts` - API route handlers
- `server/storage.ts` - Storage interface and MemStorage implementation

**Frontend Pages:**
- `client/src/pages/Home.tsx` - Landing page
- `client/src/pages/Courses.tsx` - Course catalog
- `client/src/pages/Dashboard.tsx` - Student dashboard
- `client/src/pages/Quiz.tsx` - Quiz interface
- `client/src/pages/About.tsx` - About $BMT page
- `client/src/pages/AboutEditor.tsx` - Admin editor for About page
- `client/src/pages/Analytics.tsx` - Analytics dashboard

**Key Components:**
- `client/src/components/CourseCard.tsx` - Course display card
- `client/src/components/QuizCard.tsx` - Quiz question card
- `client/src/components/CertificateModal.tsx` - Certificate display
- `client/src/components/Navbar.tsx` - Navigation with wallet connect
- `client/src/components/HeroSection.tsx` - Landing hero with blockdag animation

### Build System

**Development**: Vite dev server with HMR, running on port 5000 (proxied from Express).

**Production Build Process**:
1. Client built with Vite to `dist/public`
2. Server bundled with esbuild to `dist/index.cjs`
3. Dependencies selectively bundled to reduce cold start times
4. Source maps enabled for debugging

**Asset Handling**: Static assets in `/attached_assets` directory, aliased as `@assets` for imports.

## External Dependencies

### Core Framework Dependencies
- **React 18**: UI framework with concurrent rendering
- **Express.js**: Backend HTTP server
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Frontend build tool and dev server
- **esbuild**: Fast server-side bundling

### UI Component Libraries
- **Radix UI**: Unstyled, accessible component primitives
- **shadcn/ui**: Pre-styled components built on Radix
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Framer Motion**: Animation library

### Data & State Management
- **TanStack Query**: Async state management and data fetching
- **React Hook Form**: Form state and validation
- **Zod**: Schema validation and type inference
- **Drizzle ORM**: Type-safe database toolkit

### Database
- **Neon Serverless PostgreSQL**: Managed PostgreSQL with WebSocket support
- **@neondatabase/serverless**: Neon client library with pooling

### Development Tools
- **tsx**: TypeScript execution for development
- **Wouter**: Lightweight routing library
- **class-variance-authority**: Component variant utilities
- **clsx/tailwind-merge**: Conditional className utilities

## Future Roadmap

### Phase 1 (Current): Identity & Data Model
- [x] Database schema for all LMS entities
- [x] Storage interface with CRUD operations
- [x] REST API endpoints
- [x] Frontend connected to real API
- [ ] Wallet authentication flow

### Phase 2: Course Delivery
- [ ] Course enrollment with wallet connection
- [ ] Lesson progress tracking
- [ ] Video lesson support

### Phase 3: Assessments & Rewards
- [ ] Quiz attempt recording
- [ ] Automated grading with pass/fail
- [ ] $BMT reward distribution via Kasplex
- [ ] Certificate generation with on-chain verification

### Phase 4: Analytics & Expansion
- [ ] Instructor analytics dashboard
- [ ] Platform-wide statistics
- [ ] Multi-organization support for subscription model
- [ ] Igra network integration
