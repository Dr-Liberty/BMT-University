# BMT University

## Overview

BMT University is a blockchain-powered Learning Management System (LMS) built on the Kaspa network. It enables crypto projects to offer branded educational courses, rewarding learners with tokens for quiz completion and providing on-chain certificates. Initially a proof-of-concept for the $BMT meme coin on Kasplex, the project aims to evolve into a multi-project subscription service supporting both Kasplex and Igra networks.

## User Preferences

Preferred communication style: Simple, everyday language.
Design approach: Wallet-centric authentication (no traditional credentials), users identified by wallet address.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite.
**UI Components**: Radix UI primitives with shadcn/ui styling ("New York" variant, dark mode default).
**Styling**: Tailwind CSS with custom design tokens.
**Typography**: Space Grotesk (headings), Inter (body), JetBrains Mono (monospace).
**State Management**: TanStack Query for server state.
**Routing**: Wouter for client-side routing.
**Form Handling**: React Hook Form with Zod validation.

### Backend Architecture

**Runtime**: Node.js with Express.js.
**Language**: TypeScript with ES modules, compiled with esbuild.
**API Design**: RESTful endpoints under `/api` for authentication, course management, quizzes, enrollments, certificates, rewards, referrals, analytics, and content management.

### Database Layer

**ORM**: Drizzle ORM.
**Database**: PostgreSQL (via Neon serverless, currently using MemStorage for POC).
**Schema**: Key tables include Users, Courses, Modules, Lessons, Lesson Progress, Quizzes, Quiz Questions, Enrollments, Quiz Attempts, Certificates, Rewards, Paymaster Config, and Payout Transactions.

### Key Features

*   **Wallet Authentication**: Kaspa wallet connection with session management.
*   **Course Management**: Creation, browsing, enrollment, progress tracking.
*   **Quiz System**: Multiple-choice quizzes, grading, pass thresholds.
*   **Token Rewards**: $BMT token rewards for course completion, with a referral system.
*   **On-chain Certificates**: Certificates with verification codes and shareable links, publicly verifiable.
*   **Analytics Dashboard**: Real-time statistics, leaderboards, activity feeds.
*   **Paymaster Wallet System**: Manages $BMT token distribution on Kasplex Layer 2 (EVM-compatible) for rewards, including transaction tracking and admin configuration.

## External Dependencies

*   **Kaspa Network**: Underlying blockchain for the platform.
*   **Kasplex Network**: Layer 2 EVM-compatible chain for token rewards and smart contract interaction.
*   **Igra Network**: Planned future integration for multi-project support.
*   **Neon Serverless**: PostgreSQL database hosting (currently used for persistence).
*   **$BMT Token (ERC-20)**: Custom token contract on Kasplex L2 for rewards.