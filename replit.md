# BMT University

## Overview

BMT University is a blockchain-powered learning management system built on the Kaspa network. The platform enables crypto projects to create branded educational courses where learners earn tokens for completing quizzes and receive on-chain certificates. Starting as a proof-of-concept for the $BMT (Bitcoin Maxi Tears) meme coin on Kasplex, with plans to expand to a multi-project subscription service supporting Kasplex and Igra networks.

## Current Status: Proof-of-Concept Complete

### Completed Features
- **Wallet Authentication**: Connect via Kaspa wallet with session management
- **Course Catalog**: Browse, search, filter courses by category and difficulty
- **Course Enrollment**: Enroll in courses, track lesson progress
- **Quiz System**: Multiple choice quizzes with grading and pass thresholds
- **$BMT Rewards**: Earn tokens for completing courses, claim pending rewards
- **Certificate System**: Earn certificates with verification codes and shareable links
- **Public Verification**: Verify certificates via public `/verify/:code` page
- **Analytics Dashboard**: Real-time stats, course leaderboard, activity feed
- **About $BMT Page**: Editable content with roadmap display

### Known Limitations (For Production)
- **PostgreSQL Storage**: Data now persists in PostgreSQL database (via Neon serverless)
- **Mock Wallet Signatures**: Signature verification simulated (real Kasplex SDK needed)
- **Mock Blockchain Transactions**: Reward claims and certificates use mock tx hashes (real Kasplex integration needed)

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

**Authentication Endpoints:**
- `POST /api/auth/challenge` - Generate signing challenge for wallet
- `POST /api/auth/verify` - Verify signature and create session
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - End session

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
- `POST /api/quizzes/:quizId/attempt` - Submit quiz attempt

**Enrollment Endpoints:**
- `GET /api/users/:userId/enrollments` - Get user enrollments
- `POST /api/enrollments` - Enroll in a course
- `POST /api/enrollments/:id/progress` - Update lesson progress

**Certificate Endpoints:**
- `GET /api/users/:userId/certificates` - Get user certificates
- `GET /api/certificates/verify/:code` - Public certificate verification

**Reward Endpoints:**
- `GET /api/users/:userId/rewards` - Get user rewards
- `POST /api/rewards/:id/claim` - Claim pending reward

**Analytics Endpoints:**
- `GET /api/stats` - Platform-wide statistics
- `GET /api/analytics/leaderboard` - Top courses by enrollment
- `GET /api/analytics/activity` - Recent platform activity

**About Page:**
- `GET /api/about` - Get about page content
- `PUT /api/about` - Update about page content

### Database Layer

**ORM**: Drizzle ORM for type-safe database queries and schema management.

**Database**: PostgreSQL via Neon serverless (schema defined, currently using MemStorage).

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
- `verificationCode` (string, unique) - short code for public verification
- `certificateUrl` (string)
- `transactionHash` (string) - on-chain verification
- `signature` (string) - blockchain signature
- `issuedAt` (timestamp)

**Rewards Table:**
- `id` (uuid, primary key)
- `userId`, `courseId` (foreign keys)
- `amount` (integer) - $BMT tokens
- `type` (enum: course_completion, quiz_bonus, referral, achievement)
- `txHash` (string, optional) - blockchain transaction hash
- `status` (enum: pending, processing, confirmed, failed)
- `createdAt`, `processedAt` (timestamps)

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
- `client/src/pages/VerifyCertificate.tsx` - Public certificate verification

**Key Components:**
- `client/src/components/CourseCard.tsx` - Course display card
- `client/src/components/QuizCard.tsx` - Quiz question card
- `client/src/components/CertificateModal.tsx` - Certificate display with sharing
- `client/src/components/RewardHistory.tsx` - Reward claim interface
- `client/src/components/Navbar.tsx` - Navigation with wallet connect
- `client/src/components/HeroSection.tsx` - Landing hero with blockdag animation

**Authentication:**
- `client/src/lib/auth.ts` - Wallet connection and auth state management

### Build System

**Development**: Vite dev server with HMR, running on port 5000 (proxied from Express).

**Production Build Process**:
1. Client built with Vite to `dist/public`
2. Server bundled with esbuild to `dist/index.cjs`
3. Dependencies selectively bundled to reduce cold start times
4. Source maps enabled for debugging

**Asset Handling**: Static assets in `/attached_assets` directory, aliased as `@assets` for imports.

## Future Roadmap

### Phase 1: Identity & Data Model ✅
- [x] Database schema for all LMS entities
- [x] Storage interface with CRUD operations
- [x] REST API endpoints
- [x] Frontend connected to real API
- [x] Wallet authentication flow

### Phase 2: Course Delivery ✅
- [x] Course enrollment with wallet connection
- [x] Lesson progress tracking
- [x] Video lesson support (URL-based)

### Phase 3: Assessments & Rewards ✅
- [x] Quiz attempt recording
- [x] Automated grading with pass/fail
- [x] $BMT reward distribution system
- [x] Certificate generation with verification

### Phase 4: Analytics & Dashboard ✅
- [x] Student dashboard with progress and rewards
- [x] Platform analytics dashboard
- [x] Course leaderboard
- [x] Live activity feed

### Phase 5: Paymaster Wallet System ✅
- [x] Paymaster wallet configuration (EVM wallet address)
- [x] $BMT token contract integration (ERC-20 on Kasplex L2)
- [x] Admin interface for wallet management
- [x] Payout transaction tracking (pending/processing/completed)
- [x] Course reward amount adjustment
- [x] Quiz completion auto-creates payout transactions

### Phase 6: Production Hardening (Next)
- [ ] Replace MemStorage with PostgreSQL persistence
- [ ] Integrate real Kasplex SDK for wallet signatures
- [ ] Implement actual blockchain transactions for payouts
- [ ] Add multi-organization support for subscription model
- [ ] Igra network integration

## Paymaster Wallet System

The paymaster system manages $BMT token distribution to students who complete courses.

### Architecture
- **Kasplex Layer 2**: EVM-compatible chain (Chain ID: 202555)
- **RPC Endpoint**: https://evmrpc.kasplex.org
- **$BMT Token**: ERC-20 token contract for rewards

### Database Tables
- `paymasterConfig`: Stores wallet address, private key (encrypted), and token contract address
- `payoutTransactions`: Tracks all reward payouts with status (pending, processing, completed, failed)

### Admin API Endpoints
- `GET /api/admin/paymaster/config` - Get current configuration
- `POST /api/admin/paymaster/config` - Set wallet and token addresses
- `GET /api/admin/paymaster/balance` - Check $BMT balance via RPC
- `GET /api/admin/payouts` - List all payout transactions
- `POST /api/admin/payouts/:id/process` - Process pending payout
- `PUT /api/admin/courses/:id/reward` - Adjust course reward amount

### Reward Flow
1. Student completes quiz with passing score
2. System creates reward record with $BMT amount
3. Payout transaction created with status "pending"
4. Admin processes payout (future: automated via private key)
5. Transaction hash recorded, status updated to "completed"

### Key Files
- `server/kasplex.ts` - EVM RPC integration for balance checking
- `client/src/pages/Admin.tsx` - Paymaster management UI
- `shared/schema.ts` - paymasterConfig and payoutTransactions tables
