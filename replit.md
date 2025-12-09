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

### Security & Performance

*   **Authentication Security**: Proper ECDSA signature verification using ethers.verifyMessage to validate wallet signatures.
*   **Comprehensive Rate Limiting**: 
    - Auth endpoints: 10 requests per 15 minutes per IP
    - Quiz submission: 5 per minute with 5-second per-user throttle
    - Rewards: 10 per minute, claims throttled to 1 per 10 seconds
    - Referrals: 20 per minute, apply limited to 3 per minute with 60-second throttle
*   **Anti-DDoS Protection**: Per-user submission throttling prevents rapid-fire attacks.
*   **Request Deduplication**: 10-15 second windows prevent replay attacks on sensitive endpoints.
*   **Error Sanitization**: Production mode hides internal error details from responses.
*   **Anti-Farming System**: Device fingerprinting, multi-wallet detection, 24-hour cooldowns, flags at 2 wallets per device.
*   **API Pagination**: Courses API supports limit/offset pagination (max 100 per page).
*   **Frontend Caching**: React Query configured with 2-minute staleTime, 10-minute gcTime, and background refetch on window focus.
*   **IP Reputation Scoring**: IPQualityScore API integration blocks VPN, Tor, datacenter, and high fraud score IPs from claiming rewards.
*   **Post-Payout Monitoring**: Tracks wallet activity after rewards to detect token sinks (wallets receiving from many sources).
*   **Wallet Cluster Detection**: Identifies groups of wallets sending to same destination addresses.
*   **Admin Security Dashboard**: Real-time security analytics, suspicious IP monitoring, manual IP lookup, and detection statistics.

### Cloudflare Setup (Recommended for Production)

Cloudflare provides network-level protection that complements the application-level security already built into BMT University.

**Setup Steps:**

1. **Create Cloudflare Account**: Sign up at cloudflare.com (free plan available)
2. **Add Your Domain**: Enter your domain and Cloudflare will scan existing DNS records
3. **Update Nameservers**: Change your domain's nameservers to Cloudflare's (provided in dashboard)
4. **Enable Bot Fight Mode**: Navigate to Security → Bots → Turn "Bot Fight Mode" ON
5. **Configure SSL**: Set SSL/TLS to "Full (strict)" for end-to-end encryption

**Recommended Security Settings:**

| Setting | Location | Value |
|---------|----------|-------|
| Bot Fight Mode | Security → Bots | ON |
| Browser Integrity Check | Security → Settings | ON |
| Challenge Passage | Security → Settings | 30 minutes |
| Security Level | Security → Settings | Medium (or High during attacks) |
| Under Attack Mode | Security → Settings | Enable during active abuse |

**WAF Rules for Additional Protection:**

```
# Block suspicious user agents
Expression: (http.user_agent contains "bot" and not cf.bot_management.verified_bot)
Action: Challenge

# Rate limit reward claims by IP
Expression: (http.request.uri.path contains "/api/rewards/claim")
Action: Rate limit (10 requests per minute)
```

**Benefits:**

- Automatic bot detection using ML (no CAPTCHAs needed)
- DDoS mitigation at network edge
- Global CDN for faster page loads
- SSL certificate management
- Real-time threat analytics

## External Dependencies

*   **Kaspa Network**: Underlying blockchain for the platform.
*   **Kasplex Network**: Layer 2 EVM-compatible chain for token rewards and smart contract interaction.
*   **Igra Network**: Planned future integration for multi-project support.
*   **Neon Serverless**: PostgreSQL database hosting (currently used for persistence).
*   **$BMT Token (ERC-20)**: Custom token contract on Kasplex L2 for rewards.