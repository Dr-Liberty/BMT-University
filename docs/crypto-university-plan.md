# Crypto University - Development Plan

## Overview
Multi-chain white-label Learn-to-Earn SaaS platform. Projects deploy their own branded university, reward learners in their native token.

## Sales Pitch

> **"Why pay for ads when you can pay to educate?"**
>
> Crypto University is the first multi-chain Learn-to-Earn platform that lets any project launch their own branded education hub in minutes. Your holders earn YOUR token for learning about YOUR project - turning passive holders into educated advocates.
>
> **Why projects need this:**
> - **New Holder Acquisition**: Learners discover your project through the Crypto University marketplace and earn their first tokens
> - **Community Engagement**: Transform lurkers into power users who actually understand your tech
> - **Differentiation**: 99% of projects have a Discord and a Twitter. How many have a university? Stand out in a crowded market
> - **Reduced Support Load**: Educated users = fewer "wen" questions, more meaningful contributions
> - **Token Utility**: Give your token real utility beyond speculation - it becomes an education reward
>
> BMT University has already paid out 11M+ tokens to 165+ students with a 93% course completion rate. Your project could be next.

---

## Timeline: 10-14 Days

### Phase 1: Multi-Tenant Foundation (Days 1-3)
- Add tenant/university schema (universities, tenant_settings, tenant_branding tables)
- Implement tenant context middleware - detect university from subdomain/path
- Scope all existing queries to tenant (courses, enrollments, rewards, etc.)
- Create tenant-aware auth system (users belong to universities)

### Phase 2: Admin Branding System (Days 3-4)
- Build theme editor UI (primary/accent colors, logo upload, custom hero)
- Create CSS variable injection system for tenant themes
- Add reward token configuration (contract address, symbol, decimals per chain)

### Phase 3: Hub Landing Page (Day 5)
- Build Crypto University homepage with live stats aggregation
- Create university discovery marketplace (featured, top-rated, newest)
- Add global metrics dashboard (total users, universities, tokens paid, completions)

### Phase 4: University Provisioning (Days 6-7)
- Build self-service university creation wizard (name, chain, token, branding)
- Implement treasury wallet setup per university
- Create university admin onboarding flow with course templates

### Phase 5: Multi-Chain Support (Days 8-10)
- Abstract kasplex.ts into chain adapter interface
- Implement Base chain adapter (EVM, similar to IGRA)
- Implement Polygon chain adapter
- Add chain selector to wallet connect and reward claim flows

### Phase 6: Polish & Migration (Days 11-14)
- Migrate BMT University data as first tenant
- Mobile responsiveness and cross-browser testing
- Security audit - tenant isolation, reward claiming, admin access
- Documentation for project onboarding

---

## AI Credit Estimate: ~$85-120

| Work Type | Estimated Credits |
|-----------|-------------------|
| Core architecture & backend | ~$30-40 |
| Frontend components & pages | ~$20-30 |
| Chain integrations | ~$15-20 |
| Debugging & iteration | ~$20-30 |

---

## Supported Chains (Initial)
- Kasplex/IGRA (current - already built)
- Base Chain
- Polygon

---

## Code Reuse from BMT University
- Course/Module/Lesson/Quiz system (~100%)
- Reward claiming flow (~80%)
- Dashboard UI components (~90%)
- Wallet connection (~70%)
- Quiz engine (~100%)

---

## Key Technical Decisions
1. Single codebase, multi-tenant architecture
2. Tenant detection via subdomain or path prefix
3. Chain adapter pattern for multi-chain support
4. CSS variables for theming (structural layout stays consistent)
5. Per-university treasury wallets
