# Iter 29 Analysis (multi-lens)

_Generated: 2026-04-19_

## Snapshot Delta Table
| Metric | Current | Previous | Delta |
|---|---|---|---|
| activeUsers | 0 | 0 | 0 |
| newUsers | 0 | 0 | 0 |
| tutorial_step/user | N/A | N/A | N/A |
| challenge_complete_rate | N/A | N/A | N/A |
| upgrade_purchase/user | N/A | N/A | N/A |
| avg_session_sec | 0 | 0 | 0 |
| 30d baseline (stable) | 45 users | avg 124.9s/session | sessions/user ~2.07 |

## Top 3 GA Findings
1. 1d window completely empty — GA silent for both snapshots (Apr 19 13:11 and 17:31). No signal.
2. 30d baseline (from iter 27-28): 45 active users, avg 124.9s session, sessions/user ~2.07 — retention failure is still the core problem, no new data today.
3. Custom dimension gap unresolved — step/action params unqueryable from GA4 API.

## Code Fresh-eye Findings
Files read: career.js, production.js, main.js, offline.js, hints.js, challenge.js, tutorial.js

1. career.js:159 — MANUAL_REP_EST = Math.round(1500 * gameState.prestigeMultiplier) — uses 30 compile/hr x 50 rep estimate but zero passive idle Rep. produceTick generates lps * 0.05 Rep/s. At NullPointer with Chatbot (2 LPS): idle passive = 360 Rep/hr. Career screen shows 1,500/hr but actual idle rate is 360/hr — 4x overestimate for idle players.
2. main.js:57 — renderIdleForecast() correctly computes lps * 0.05 * 3600 = 360 Rep/hr and shows it in the editor as "+360 Rep/hr while away". This directly contradicts career screen's "1.50K Rep/hr" — same player sees two different Rep/hr numbers on different tabs.
3. career.js:33 — getRepRate() returns null when orchLevel === 0. Fallback is MANUAL_REP_EST (1500/hr) ignoring passive idle. "Advance In" calculation: 1943 Rep needed / 1500 = ~1.3h shown, vs actual 1943/360 = ~5.4h if idling only.
4. main.js:821-823 — Challenge button renders "Free (${freeLeft} left)" making label "Bug Fix (Free (5 left))" — nested parens, awkward to parse.
5. hints.js:53-62 — discover-challenge hint fires post-tutorial when challengeStats.played === 0 — correct. Shows after mission "Research!" (screen=research) since discover-challenge is screen=editor (no suppression).
6. tutorial.js:260-291 — endTutorial() "What's Next?" modal mentions challenge, career, research — good post-tutorial orientation.

## Playtest Observations
1. Initial state: LoC 2/2s idle, Compute 0, Papers 25, Tokens 5/10, Rep 0.1. Editor idle forecast shows "+3.60K Code/hr · +360 Rep/hr while away" — correct passive display. (screenshot: play-01-start.png)
2. After compiling and buying Batch Size: Compute 244, Rep 57. Career screen shows "Rep/hr 1.50K~ (est. 30 compiles/hr)" and "Advance In ~1.3h" — directly contradicts editor's 360/hr idle forecast. Both numbers visible in same session by switching tabs. (screenshot: play-02-mid.png)
3. Career timeline readable. Challenge area: "code Bug Fix (Free (5 left)) shuffle Win -> +Rep +Papers +Compute" — nested parens awkward. Flow meter "0/20" in top bar has no contextual label. (screenshot: play-03-end.png)

## Triangulation
Code is the dominant signal — GA completely silent. The career Rep/hr discrepancy (career 1,500/hr vs editor idle 360/hr for same player state) was identified in code then confirmed by playtest (both numbers visible in one session). Deterministic, affects every player who checks both editor and career tabs. Challenge label oddity also confirmed by playtest. Code + Playtest converge on the same two priorities.

## Candidates Per Lens

### UI
- **Candidate**: Flow meter "0/20" — no label explaining what "20" means to a new player / Score: 5/10 / Evidence: Playtest (play-03-end.png), main.js:828

### UX
- **Candidate**: Challenge button nested parens "Bug Fix (Free (5 left))" — clean to "Bug Fix · Free (5/day)" / Score: 6/10 / Evidence: Playtest + code main.js:823

### 기획자
- **Candidate**: Career "Advance In" uses 1,500 Rep/hr (manual only) — ignores passive idle Rep (360/hr for Chatbot). Players who idle first see "1.3h" but actual idle time is 5.4h. Fix: add passiveRepPerHr = getLocPerSecond() * 0.05 * 3600 to MANUAL_REP_EST / Score: 8/10 / Evidence: Code (career.js:159, production.js:29) + Playtest

### 개발자
- **Candidate**: career.js:160 displayRepRate = repRate || MANUAL_REP_EST — formula excludes passive Rep. Same issue as 기획자, framed as correctness bug. Fix is identical. / Score: 7/10 / Evidence: Code review

### 게이머
- **Candidate**: Mission cascade (main.js:9-47) never includes challenge despite player having 5 free tokens. Post-tutorial modal mentions it once — no recurring mission guidance toward challenge loop. / Score: 5/10 / Evidence: Code getCurrentMission + Playtest

## Lens Choice Reasoning
- 기획자 (8/10): PASS — highest score, correctness + balance impact
- 개발자 (7/10): PASS — same fix, unified into one commit with 기획자
- UX (6/10): PASS — challenge label cleanup, separate commit
- 게이머 (5/10): PASS (borderline) — challenge mission gap is real, small addition
- UI (5/10): PASS (borderline) — flow meter label, minimal change

Anti-stagnation check: Last 5 completed: 게이머(28), 기획자(27), 기획자(26), UX/개발자(24), UX/UI(23). 기획자 used in 26+27 (2 consecutive), not 3. Rule not triggered. All lenses eligible.

## Implementation Queue

| # | Lens | Title | Score | Files (예상) |
|---|---|---|---|---|
| 1 | 기획자/개발자 | Fix career Rep/hr: include passive idle Rep in Advance In estimate | 8/10 | js/career.js |
| 2 | UX | Challenge button: clean nested parens label | 6/10 | js/main.js |
| 3 | 게이머 | Add challenge step to mission cascade (post-tutorial, first-time flag) | 5/10 | js/main.js |
| 4 | UI | Flow meter context label beside N/20 counter | 5/10 | js/main.js |

## Primary Improvement (점수 가장 높은 것 상세)
**Lens**: 기획자 / 개발자
**Title**: Fix career "Advance In" to include passive idle Rep from models
**Why**: career.js:159 MANUAL_REP_EST only counts 30 compiles/hr (1500/hr) but produceTick generates lps * 0.05 Rep/s passively. Editor already shows correct idle rate (360/hr for Chatbot). Career shows 1500/hr — 4x overestimate for idle players. Players see "Advance In ~1.3h" but actual idle time is 5.4h. Erodes trust when reality doesn't match career screen promise.
**Files to change**: js/career.js (lines ~157-170)
**Implementation sketch**:
```js
// career.js ~line 159
const passiveRepPerHr = typeof getLocPerSecond === 'function'
  ? Math.round(getLocPerSecond() * 0.05 * 3600) : 0;
const MANUAL_REP_EST = Math.round(1500 * gameState.prestigeMultiplier) + passiveRepPerHr;
const displayRepRate = repRate ? (repRate + passiveRepPerHr) : MANUAL_REP_EST;
// Update sub-label: 'est. 30 compiles/hr' -> 'est. idle + 30 compiles/hr'
```
**Expected impact**:
- 단기(1h 후): Career "Advance In" shows accurate combined rate — fewer players confused when actual progression differs from shown time
- 장기(1주 후): Players who understand passive Rep invest more in models -> longer sessions -> avg_session_sec improvement

**Rollback plan**: Revert career.js:159-160 to original MANUAL_REP_EST = Math.round(1500 * gameState.prestigeMultiplier)

## Considered but Rejected
- **Option A — Show two Rep/hr rows (Idle vs Active) on career screen**: More informative but career cards already dense (4 items). Adding 5th or splitting one risks mobile layout overflow. Unified correct number is simpler.
- **Option B — Remove MANUAL_REP_EST entirely, show "--" when no Orchestrator**: Technically honest but "--" gives zero actionable info to new players. Combined estimate is more useful.
