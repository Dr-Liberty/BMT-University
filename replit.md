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
*   **Session Binding (Dec 2025)**: Sessions bound to IP address and user agent at creation. IP mismatches reject requests; UA mismatches logged for monitoring.
*   **CORS Hardening (Dec 2025)**: Dynamic origin validation - production restricts to Replit domains only, development allows localhost.
*   **Atomic Payout Transactions (Dec 2025)**: Reward confirmation/failure uses Drizzle ORM transactions to prevent partial updates during blockchain callbacks.
*   **GDPR Data Retention (Dec 2025)**: 90-day device fingerprint cleanup, expired session deletion runs every 24 hours.
*   **SHA-256 Fingerprint Hashing (Dec 2025)**: Upgraded from weak 32-bit hash to SHA-256 for collision resistance.
*   **Comprehensive Rate Limiting**: 
    - Auth endpoints: 10 requests per 15 minutes per IP
    - Quiz submission: 5 per minute with 5-second per-user throttle
    - Rewards: 10 per minute, claims throttled to 1 per 10 seconds
    - Referrals: 20 per minute, apply limited to 3 per minute with 60-second throttle
*   **Anti-DDoS Protection**: Per-user submission throttling prevents rapid-fire attacks.
*   **Request Deduplication**: 10-15 second windows prevent replay attacks on sensitive endpoints.
*   **Error Sanitization**: Production mode hides internal error details from responses.
*   **Secure Logging (Dec 2025)**: 
    - Response logging redacts sensitive fields (token, password, secret, apiKey, privateKey, sessionToken)
    - Auth endpoints (/api/auth/verify, /api/auth/login) skip response body logging entirely
    - `safeErrorLog()` helper used across all server files to sanitize error objects before logging
    - Error logs truncate messages to 200 chars and extract only safe fields (message, code, reason)
    - Prevents credential leakage through stack traces in: kasplex.ts, security.ts, routes.ts, rateLimiter.ts, storage.ts
*   **Anti-Farming System**: Device fingerprinting, multi-wallet detection, 24-hour cooldowns, flags at 3+ wallets per device.
    - **Policy**: Completing all courses is NOT grounds for flagging - we WANT users to complete courses!
    - Only flag for: unrealistically fast completion (<10% expected time), 3+ wallets per device, 10+ wallets per IP, post-payout dumping.
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

### Network Configuration (Kasplex L2)

The payout system connects to Kasplex Layer 2 (EVM-compatible). Network is selected via the `KASPLEX_NETWORK` environment variable.

| Setting | Testnet | Mainnet (Default) |
|---------|---------|-------------------|
| Chain ID | 167012 | 202555 |
| RPC URL | https://rpc.kasplextest.xyz | https://evmrpc.kasplex.org |
| Explorer | https://frontend.kasplextest.xyz | https://explorer.kasplex.org |
| Name | kasplex-testnet | kasplex-l2 (Igra) |

**Environment Variables:**

| Variable | Description |
|----------|-------------|
| `KASPLEX_NETWORK` | Set to `testnet` for testing, omit for mainnet/Igra |
| `PAYMASTER_PRIVATE_KEY` | Private key for the paymaster wallet (distributes $BMT rewards) |
| `VITE_THIRDWEB_CLIENT_ID` | ThirdWeb client ID for wallet connections |

**Security Notes (Dec 2025):**

*   **Nonce Race Prevention**: NonceManager with mutex lock serializes all payouts. Local nonce tracking avoids chain queries between rapid payouts. Auto-retry on "nonce too low" errors (up to 3 attempts).
*   **Gas Strategy**: 8x base gas + 2x per retry attempt for reliable transaction inclusion.
*   **Circuit Breaker**: Payout system can be disabled via admin controls if issues detected.
*   **Audit Logging**: All paymaster transactions logged to `paymaster_audit_log` table.

**Chain ID Mapping:**

| Network Name | Chain ID | Status |
|--------------|----------|--------|
| Kasplex L2 (Igra) | 202555 | **ACTIVE** - Production mainnet |
| Kasplex Testnet | 167012 | Testing only |

**Important**: When transitioning networks, ensure the `PAYMASTER_PRIVATE_KEY` corresponds to a wallet with sufficient $BMT balance on the target network. The paymaster wallet address is derived from the private key - there is no separate address configuration.

### Operational Runbook: Nonce Management

The NonceManager handles transaction nonce coordination to prevent race conditions in concurrent payouts. This section documents operational procedures.

**Admin Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/nonce/status` | GET | View current nonce cache state, RPC instability alerts |
| `/api/admin/nonce/invalidate` | POST | Manually clear nonce cache (body: `{ "reason": "description" }`) |

**Monitoring Dashboard Fields:**

| Field | Description | Alert Threshold |
|-------|-------------|-----------------|
| `currentNonce` | Last known nonce value | N/A |
| `cacheAge` | Milliseconds since last chain fetch | > 30000ms = stale |
| `isUnstable` | RPC instability flag | `true` = investigate |
| `recentResets` | Nonce resets in last 60 seconds | > 5 = RPC issue |
| `lastResets` | Recent reset events with timestamps | Review for patterns |

**When to Invalidate Nonce Cache:**

1. **External transaction submitted**: If you send a transaction from the paymaster wallet using an external tool (Metamask, Etherscan, etc.), immediately invalidate the cache:
   ```
   POST /api/admin/nonce/invalidate
   { "reason": "external_tx_submitted" }
   ```

2. **Stuck transactions**: If payouts are failing with persistent "nonce too low" errors despite retries, invalidate and check the paymaster wallet on the explorer.

3. **RPC endpoint changed**: If the RPC URL is changed or the node is restarted, invalidate to resync with chain state.

**Troubleshooting RPC Instability:**

If `isUnstable` is `true`:
1. Check Kasplex RPC status (https://evmrpc.kasplex.org health)
2. Review `lastResets` for error patterns
3. Consider enabling circuit breaker to pause payouts
4. Contact Kasplex team if persistent

**Recovery Procedure for Failed Payouts:**

1. Check `/api/admin/nonce/status` for instability
2. Review `/api/admin/payouts` for stuck transactions
3. Verify paymaster wallet balance on explorer
4. If transactions are stuck in mempool, wait or use speed-up with higher gas
5. Once mempool clears, invalidate nonce cache and resume payouts

**Log Markers to Monitor:**

| Log Pattern | Meaning |
|-------------|---------|
| `[NonceManager] Fetched nonce from chain: X` | Fresh nonce from RPC |
| `[NonceManager] Nonce error detected` | Auto-retry triggered |
| `[NonceManager] WARNING: RPC instability` | 5+ resets in 60s - investigate |
| `[NonceManager] Manual cache invalidation` | Admin triggered reset |