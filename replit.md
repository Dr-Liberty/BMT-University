# BMT University

## Overview

BMT University is a blockchain-powered educational platform built on the Kaspa network. The platform enables users to learn about cryptocurrency and blockchain through expert-led courses, complete quizzes to earn $BMT tokens (Bitcoin Maxi Tears), and receive on-chain certificates of completion. The application combines meme culture with serious educational content, featuring a dark, neon-tech aesthetic inspired by crypto-native design patterns.

## User Preferences

Preferred communication style: Simple, everyday language.

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

**API Design**: RESTful endpoints under `/api` namespace. Currently implements:
- `/api/about` - GET/PUT for About page content management
- Future endpoints will handle courses, quizzes, user progress, and reward distribution

**Middleware Stack**:
- JSON body parsing with raw body preservation (for webhook verification)
- URL-encoded form data support
- Request logging with timing and response tracking
- Static file serving for production builds

**Error Handling**: Centralized error responses with Zod validation error formatting for client-friendly messages.

### Database Layer

**ORM**: Drizzle ORM for type-safe database queries and schema management.

**Database**: PostgreSQL via Neon serverless, using WebSocket connections for serverless environments.

**Schema Design**:
- `users` table: User authentication with username/password (authentication system to be implemented)
- `about_pages` table: CMS-style content for the About page, including roadmap items stored as JSONB
- Future schemas will include courses, lessons, quizzes, certificates, and reward transactions

**Migrations**: Drizzle Kit for schema migrations, stored in `/migrations` directory.

**Connection Pooling**: Neon serverless pool with WebSocket support for optimal serverless performance.

### Design System

**Component Architecture**: Atomic design pattern with reusable UI primitives in `/components/ui` and feature components in `/components`.

**Theming**: CSS custom properties for runtime theme values, with Tailwind utilities for compile-time styles. Dark mode enforced globally.

**Accessibility**: Radix UI primitives ensure ARIA compliance and keyboard navigation support across all interactive components.

**Responsive Design**: Mobile-first approach with breakpoints at 768px (md), 1024px (lg), and 1280px (xl).

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

### Future Integrations (Planned)
- Wallet connection libraries for Kaspa network
- Smart contract interaction for token rewards
- Certificate NFT minting on Kasplex protocol
- Payment processing for course enrollment
- Email service for notifications