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

- [x] Implement minimum quiz duration (10s per question) ✓ COMPLETED
- [x] Add `is_banned` check to quiz submission and reward routes ✓ COMPLETED
- [x] Add defense-in-depth ban check in storage.createReward() ✓ COMPLETED
- [ ] Change IP rate limit to rolling 24-hour window
- [x] Randomize quiz answer order ✓ COMPLETED (Fisher-Yates shuffle)
- [x] Add IP blocklist with `185.191.204.203` ✓ COMPLETED
- [x] IP blocklist check on quiz submission, lesson completion, and reward claim ✓ COMPLETED
- [ ] Consider adding CAPTCHA for high-value rewards

---

### Security Controls Implemented (Jan 3, 2026)

#### User Ban System
1. **Quiz Submit Route** - Checks `isBanned` flag, returns 403 if banned
2. **Reward Claim Route** - Checks `isBanned` flag, returns 403 if banned
3. **Lesson Complete Route** - Checks `isBanned` flag, blocks auto-rewards
4. **Referral Qualification** - Checks both referrer and referee for bans
5. **Storage Layer (Defense-in-Depth)** - `createReward()` throws error if user is banned

#### IP Blocklist System
6. **IP Blocklist Table** - `ip_blocklist` table with support for permanent/temporary blocks
7. **Quiz Submit Route** - Checks IP blocklist, returns 403 if blocked
8. **Lesson Complete Route** - Checks IP blocklist, returns 403 if blocked  
9. **Reward Claim Route** - Checks IP blocklist first, then IP reputation service

#### Quiz Security
10. **Minimum Quiz Duration** - Enforces 10 seconds per question server-side
11. **Answer Randomization** - Fisher-Yates shuffle on question order and answer options
12. **Client Timestamp Validation** - Rejects future timestamps (>60s clock drift)

#### Schema Changes
- `users.is_banned`, `users.ban_reason`, `users.banned_at` - User ban tracking
- `ip_blocklist` table - IP-based blocking with expiration support
- Attacker IP `185.191.204.203` added to blocklist

---

*Report generated: January 3, 2026*
*Incident classified: SYBIL-001*
*Status: Mitigated, comprehensive security controls implemented*

---

# Second Major Attack - January 22, 2026

## Incident Report: SYBIL-002

### Executive Summary
A sophisticated coordinated farming attack using rotating VPN/proxy IPs was detected. A single actor created **41 wallets** over ~3.5 hours, using a different IP address and spoofed device fingerprint for each wallet, but all sharing the same timezone (Asia/Jakarta) and platform (Win32).

### Attack Details

**Attack Window:** January 22, 2026, 06:49 - 10:10 UTC (~3.5 hours)

**Attack Pattern:**
- Used rotating VPN/proxy IPs (41 different IPs)
- Spoofed device fingerprints (41 different fingerprints)
- All wallets shared: `timezone: Asia/Jakarta`, `platform: Win32`
- Operated 2 wallets in parallel at a time
- Each wallet completed exactly 3 courses (60,000 BMT daily limit)
- New wallet pair every ~7-10 minutes

### Financial Impact

| Metric | Amount |
|--------|--------|
| **Total Wallets** | 41 |
| **Total Payouts** | 122 |
| **BMT Drained** | **2,440,000 BMT** |
| **Attack Duration** | ~3.5 hours |

### All Attacker Wallets (Blocked)

| # | Wallet | BMT Drained | First Payout |
|---|--------|-------------|--------------|
| 1 | 0x62f823D52a61BbEc0C172BB9e548F9eEc8750226 | 60,000 | 06:49:38 |
| 2 | 0x60dC9797c8ed2A373BE50d184B8C7a3d7320fDBF | 60,000 | 06:49:53 |
| 3 | 0x1922C2017EBC7D20c8fA28DCCEF1C821857b1aDB | 60,000 | 06:56:30 |
| 4 | 0x24aBA7663161659b057da351C31E7E1D709Db1FF | 60,000 | 06:56:43 |
| 5 | 0x571645118a973f563fE21492838EBc1B67797F38 | 60,000 | 07:03:16 |
| 6 | 0x8A32eC8b556b0E269DCE3cC025B249b7abB43A79 | 60,000 | 07:03:28 |
| 7 | 0x1dF1C3E0d4A134230077d8bBd8579A448E2CbE39 | 60,000 | 07:12:16 |
| 8 | 0x985Ab738aEbb9540D07f1F20Ca6F7754bDFaAABa | 60,000 | 07:12:34 |
| 9 | 0x107F3d193E0A80FE3775C6A39Ef888FA6885394D | 60,000 | 07:20:25 |
| 10 | 0xfcA9BEcf3Ea71DbB25EB1D58936dbf3D5fc6a0D1 | 60,000 | 07:20:38 |
| ... | (31 more wallets - all blocked) | ... | ... |
| 40 | 0x1A825C3cE7Ce34FbD93D6F3077433C321a7409fa | 60,000 | 10:08:28 |
| 41 | 0x68260E8AC30e03F8DaDAD80Ba34bDf925A8dd3c2 | 60,000 | 10:08:44 |

### Detection Methodology

1. **Pattern Analysis:** All 41 wallets shared identical timezone (Asia/Jakarta) and platform (Win32) despite different IPs
2. **Parallel Detection:** Pairs of wallets completing the same courses within seconds of each other
3. **Velocity Analysis:** 122 payouts in 3.5 hours from the same timezone cluster

### Response Actions

1. **Immediate:**
   - All 42 wallets added to `wallet_blacklist`
   - All 42 user accounts banned with reason documented
   - All 42 suspicious activity records created

2. **Security Hardening:**
   - **Stricter IP limits:** 1 wallet per IP (was 3)
   - **Stricter fingerprint limits:** 1 wallet per fingerprint (was 2)
   - **Timezone pattern detection:** Blocks when 10+ wallets from same timezone in 1 hour
   - **Parallel farming detection:** Blocks if 2 wallets complete same course within 60 seconds
   - **Pre-payout security check:** Comprehensive check before every payout
   - **Auto-blacklist:** Automatic blacklisting of detected farming wallets

### New Security Thresholds

```javascript
SECURITY_THRESHOLDS = {
  MAX_WALLETS_PER_IP_24H: 1,           // Was 3
  MAX_WALLETS_PER_FINGERPRINT_24H: 1,   // Was 2
  MIN_COURSE_COMPLETION_SECONDS: 120,   // Was 60
  MIN_LESSON_TIME_SECONDS: 10,          // Was 5
  CLUSTER_AUTO_BLOCK_THRESHOLD: 3,      // Was 5
  CLUSTER_HIGH_RISK_THRESHOLD: 2,       // Was 3
  MAX_COMPLETIONS_PER_TIMEZONE_HOUR: 10, // NEW
  PARALLEL_COMPLETION_WINDOW_SECONDS: 60, // NEW
}
```

### Lessons Learned

1. **VPN/Proxy Evasion:** Attackers can rotate IPs but timezone/platform data persists
2. **Parallel Farming:** Running multiple wallets simultaneously is a strong farming indicator
3. **Timezone Clustering:** Unusual spikes from specific timezones signal coordinated attacks
4. **Speed of Attack:** 2.44M BMT drained in 3.5 hours - faster detection needed

---

*Report updated: January 22, 2026*
*Incident classified: SYBIL-002*
*Status: Mitigated, enhanced security controls implemented*
