# Sybil Attack Incident Report
## BMT University Security Incident - January 3, 2026

### Executive Summary
A coordinated Sybil attack was detected and mitigated on BMT University. A single actor created 6 wallets from IP address `185.191.204.203` to farm BMT token rewards through automated quiz completion. The attack was identified through behavioral analysis and IP correlation. All malicious wallets have been banned and pending rewards cancelled.

---

### Attack Details

**Attacker IP:** 185.191.204.203

**Attack Window:** December 29, 2025 - January 2, 2026 (4 days)

**Wallets Created:**
| Wallet | Created | Quiz Score | Quiz Time | BMT Farmed | Status |
|--------|---------|------------|-----------|------------|--------|
| 0x8DCb575ebBfB1827cfB36E1Cc531c44eEF061379 | Dec 29, 09:45 | 98.57% avg | ~24 min total | 136,000 | Cancelled |
| 0x31f4a4a0ede1C56CE49b5c9197Fb0c7bc2c086c9 | Dec 29, 12:27 | 96.57% avg | ~5 min total | 118,000 | Confirmed* |
| 0x0b878C44CB1c0D2CC0F2108dbbe486B0dC773ca1 | Dec 30, 11:34 | 100% avg | ~7 min total | 100,000 | Confirmed* |
| 0x1DcE94203DBC24b1Adf9F74F13B4957e11297Ef7 | Jan 2, 09:55 | 100% avg | ~6 min total | 136,000 | Confirmed* |
| 0x675D219eC3334da103d885Cf23c2f3E8AbE56B6a | Jan 2, 13:14 | 100% avg | ~6 min total | 136,000 | Confirmed* |
| 0x3f6b689503a77fb5Da6fe5E05c884EfB64dF3516 | Jan 2, 13:27 | 100% avg | ~7 min total | 136,000 | Confirmed* |

*Already confirmed on-chain before ban was implemented

---

### Detection Methodology

1. **IP Correlation:** All 6 wallets traced to same IP through `security_velocity_tracking` table
2. **Behavioral Patterns:**
   - Near-perfect scores (96-100%) across all quizzes
   - Impossibly fast completion times (completing 7 quizzes in under 10 minutes)
   - All 7 available course quizzes completed within minutes of wallet creation
3. **Temporal Clustering:** 3 wallets created on same day (Jan 2), likely after earlier wallets hit daily limits

---

### Financial Impact

| Metric | Amount |
|--------|--------|
| Total BMT Farmed by Attacker | 762,000 BMT |
| Pending Rewards Cancelled | 136,000 BMT |
| Already Confirmed (Unrecoverable) | 626,000 BMT |
| Legitimate User Total | 29,458,750 BMT |
| Attack % of Total Distribution | 2.5% |

---

### Mitigation Actions Taken

1. **User Bans:** All 6 wallets banned with `is_banned=true` flag
2. **Reward Cancellation:** 7 pending rewards (136,000 BMT) cancelled
3. **Ban Reason Recorded:** "Sybil attack: 6 wallets from same IP - multi-account farming"
4. **Timestamp Logged:** Ban applied 2026-01-03 10:17:40 UTC

---

### Vulnerability Analysis

**Attack Vector Exploited:**
- No minimum quiz completion time enforcement
- Daily rate limit (3 wallets/IP/day) can be bypassed by creating wallets on different days
- No device fingerprinting or behavioral analysis
- Quiz answers not randomized per attempt

**Why Attack Succeeded:**
1. Bot could access quiz answers (possibly from browser cache or API inspection)
2. No server-side validation of quiz completion time vs lesson reading time
3. Rolling 24-hour window resets at midnight, allowing burst creation over midnight

---

### Recommended Security Improvements

#### Immediate Priority (Critical)
1. **Minimum Quiz Duration:** Enforce minimum 30 seconds per question server-side
2. **Lesson Time Requirement:** Track time spent on lessons; require minimum reading time before quiz unlock
3. **Rolling Rate Limit:** Change from daily reset to rolling 24-hour window for IP limits

#### Medium Priority (Important)
4. **Answer Randomization:** Shuffle answer order for each quiz attempt
5. **IP Blocklist:** Add `185.191.204.203` and similar suspicious IPs to blocklist
6. **Device Fingerprinting:** Collect browser fingerprint to detect same device across wallets
7. **Ban Enforcement in Routes:** Check `is_banned` flag before allowing quiz submissions or reward claims

#### Lower Priority (Enhancement)
8. **CAPTCHA Integration:** Add reCAPTCHA on quiz submission for suspicious patterns
9. **Machine Learning Detection:** Flag accounts with statistical anomalies (perfect scores, fast completion)
10. **Rate Limiting per Wallet:** Limit quiz attempts per wallet per hour

---

### Database Schema Update

Added to `users` table:
```sql
is_banned BOOLEAN NOT NULL DEFAULT false
ban_reason TEXT
banned_at TIMESTAMP
```

---

### Lessons Learned

1. **Testnet tokens have value** - Even testnet BMT was worth attacking, indicating mainnet will require stronger security
2. **Speed limits matter** - Human-impossible completion speeds are a clear red flag
3. **IP clustering is detectable** - Velocity tracking successfully identified the attack
4. **Prevention > Detection** - Proactive rate limits would have prevented most of the damage

---

### Action Items

- [ ] Implement minimum quiz duration (30s per question)
- [x] Add `is_banned` check to quiz submission and reward routes ✓ COMPLETED
- [x] Add defense-in-depth ban check in storage.createReward() ✓ COMPLETED
- [ ] Change IP rate limit to rolling 24-hour window
- [ ] Randomize quiz answer order
- [ ] Add IP blocklist with `185.191.204.203`
- [ ] Consider adding CAPTCHA for high-value rewards

---

### Security Controls Implemented (Jan 3, 2026)

1. **Quiz Submit Route** - Checks `isBanned` flag, returns 403 if banned
2. **Reward Claim Route** - Checks `isBanned` flag, returns 403 if banned
3. **Lesson Complete Route** - Checks `isBanned` flag, blocks auto-rewards
4. **Referral Qualification** - Checks both referrer and referee for bans
5. **Storage Layer (Defense-in-Depth)** - `createReward()` throws error if user is banned

---

*Report generated: January 3, 2026*
*Incident classified: SYBIL-001*
*Status: Mitigated, core security controls implemented*
