# Security Improvements - BMT University

## Suspicious Activity Analysis (Jan 3, 2026)

### Wallet 1: `0x08432f8fB8183706fd46b670Eca0F961bb27956a`
- **Enrollments**: 20 (all courses)
- **Total Rewards**: 6.66M BMT (2.7M confirmed, 3.96M pending)
- **Account Created**: Dec 24, 2025
- **Red Flags**:
  - All quizzes completed in 0 seconds (started_at = completed_at)
  - Lessons completed 2-3 seconds apart
  - No actual reading time (time_spent = 0)

### Wallet 2: `0x3f6b689503a77fb5Da6fe5E05c884EfB64dF3516`
- **Enrollments**: 7 courses
- **Total Rewards**: 952K BMT (all claimed)
- **Account Created**: Jan 2, 2026
- **Red Flags**:
  - All 7 quizzes completed in 0 seconds
  - All 7 quizzes scored 100% (perfect with instant submission)

---

## Security Improvements Needed

### 1. Minimum Quiz Duration
- Require at least 30 seconds before quiz submission
- Track actual time between quiz start and submit
- Reject submissions that are too fast

### 2. Lesson Time Tracking
- Require minimum time on each lesson before marking "complete"
- Calculate expected reading time based on content length
- Enforce 70% of expected time minimum

### 3. Answer Randomization
- Shuffle answer order per user/attempt
- Prevents answer key sharing
- Unique question order per attempt

### 4. Rate Limiting
- Maximum X course completions per hour (suggest 2-3)
- Daily cap on total rewards earnable
- Cooldown between quiz attempts

### 5. Anti-Bot Measures
- Captcha on quiz submit (high-value action)
- Honeypot fields in forms
- Behavioral analysis for automated patterns

### 6. IP/Device Fingerprinting
- Track device fingerprints per account
- Flag multiple accounts from same source
- Geographic velocity checks (impossible travel)

### 7. Quiz Integrity
- Time each question individually
- Flag suspiciously fast correct answers
- Randomize question pool (don't show all questions)

---

## Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| HIGH | Minimum quiz duration | Low | High |
| HIGH | Answer randomization | Medium | High |
| MEDIUM | Rate limiting | Low | Medium |
| MEDIUM | Lesson time requirements | Medium | Medium |
| LOW | Device fingerprinting | High | Medium |
| LOW | Captcha integration | Medium | Low |
