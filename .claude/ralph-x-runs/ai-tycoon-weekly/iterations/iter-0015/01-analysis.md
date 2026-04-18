# Iter 15 Analysis (multi-lens)

_Generated: 2026-04-18_

## Snapshot Delta Table
| Metric | Current | Previous | Delta |
|---|---|---|---|
| activeUsers | 0 | 0 | 0 |
| newUsers | 0 | 0 | 0 |
| tutorial_step/user | N/A | N/A | N/A |
| challenge_complete_rate | N/A | N/A | N/A |
| upgrade_purchase/user | N/A | N/A | N/A |
| avg_session_sec | N/A | N/A | N/A |
| GA signal | empty | empty | both snapshots (18:41, 19:51) have 0 data points |

## Top 3 GA Findings
1. GA completely silent both 2026-04-18T1841 and T1951 snapshots contain zero records. Zero signal.
2. All prior snapshots show same pattern: 0 events since iter 12. No organic traffic.
3. Falling back 100% to Code + Playtest signals for all candidates.

## Code Fresh-eye Findings
Files read: js/production.js, js/career.js, js/main.js, js/events.js, js/hints.js, js/research.js, js/upgrade.js

1. production.js:118 / index.html:35-57 — rep-display element referenced in compileData() floating text does NOT exist in the HTML. document.getElementById(rep-display) returns null on every compile. Broken silently.
2. index.html:35-57 — Top bar shows LoC, Compute, Papers, Tokens. Reputation absent. Reputation is the sole career progression metric (10K->100K->1M rep required) but has zero presence in the main HUD.
3. career.js:3-14 — Rep requirements: 10,000 / 100,000 / 1,000,000. Gain rate: +1/tap, +10/compile. At 15 compiles/session = 150 rep/session = 67 sessions for first career advance. Severely imbalanced.
4. events.js:54-62 — HALT_EVENTS = Set([criticalBug, serverCrash, overheating]). hallucination event (stopAutoProd) is NOT in this set. Early-game guard misses it. Confirmed by playtest: hallucination spawned ~60s in.
5. production.js:110-112 — totalCompiles % 10 === 0 triggers at totalCompiles=0 (first compile). Off-by-one: new players get +1 Paper on their very first compile.
6. hints.js:139-144 — Hint suppression only when activeMission.screen is set. compile mission has screen: null so suppression does not trigger. Both hint and mission card show compile CTA simultaneously.
7. events.js:39-49 — eventTick uses gameState.lastEventTime with no guard for stale saves. If lastEventTime is old, event fires within first game tick on load.

## Playtest Observations
Direct play via browse skill on http://localhost:8765:

1. Game loaded with existing save (25 papers, Chatbot Lv.1, 5 Tokens). Idle Chatbot produced 2 Code/s. Mission card correctly showed Compile your Code after LoC built up. (screenshot: play-01-start.png)
2. A Hallucination event spawned within ~60 seconds of load. Player has no Orchestrator so auto-compile does not exist. Event + hint + mission = 3 simultaneous banners on screen. (screenshot: play-02-mid.png)
3. After JS-triggering compileData(): Compute went 0->258. Papers went 25->26 (first-compile paper bug). No floating +10 Rep appeared near top bar (rep-display missing). Reputation incremented silently. Goals card showed Unlock Translator READY correctly. (screenshot: play-03-end.png)

## Triangulation
Code and Playtest signals converge on two themes: (1) Reputation feedback loop is broken - no top-bar display, broken floating text anchor, yet Rep is the primary progression metric. (2) Early-game event spawn is hostile - stale lastEventTime triggers hallucination before players understand the loop. GA is completely silent. Code signal provides hardest evidence (missing DOM element verifiable), Playtest confirms both live.

## Candidates Per Lens

### UI
- Candidate: Add Reputation slot to top-bar HUD + create rep-display element for compile floating text / Score: 8/10 / Evidence: Code (production.js:118 references missing element; index.html has no rep slot) + Playtest (no rep feedback on compile)

### UX
- Candidate: Fix stale lastEventTime on load + add hallucination to early-game guard / Score: 7/10 / Evidence: Playtest (hallucination within 60s) + Code (events.js:54 guard misses hallucination)

### 기획자
- Candidate: Rebalance Rep gain: +5/tap +50/compile, reduce first career repReq 10K->2K / Score: 9/10 / Evidence: Code math (career.js:3-14 + production.js:53,116: 50-100 sessions for first advance)

### 개발자
- Candidate: Fix first-compile paper bonus off-by-one (totalCompiles % 10 === 0 fires at 0) / Score: 5/10 / Evidence: Code (production.js:111)

### 게이머
- Candidate: Hide flow-meter-wrap when consecutiveTaps === 0 so 0/20 does not persist as dead UI element / Score: 5/10 / Evidence: Playtest (flow meter showed 0/20 throughout entire session)

## Lens Choice Reasoning
All 5 candidates score >= 5 so all in queue. Anti-stagnation: UX was used in 3 of last 5 iters; ranked 3rd to respect diversity. 개발자 and 게이머 at exactly 5/10 both pass.

## Implementation Queue

| # | Lens | Title | Score | Files |
|---|---|---|---|---|
| 1 | 기획자 | Rebalance Rep gain: +5/tap +50/compile, repReq[1] 10K->2K | 9/10 | js/production.js, js/career.js |
| 2 | UI/개발자 | Add rep-display to top-bar + fix missing DOM anchor | 8/10 | index.html, js/ui.js |
| 3 | UX | Fix stale lastEventTime + add hallucination to early-game guard | 7/10 | js/events.js |
| 4 | 개발자 | Fix first-compile paper bonus off-by-one | 5/10 | js/production.js |
| 5 | 게이머 | Hide flow meter when inactive (0/20 dead state) | 5/10 | js/events.js |

## Primary Improvement (highest score detail)
Lens: 기획자
Title: Rebalance Reputation gain rate - +5/tap +50/compile, first career repReq 10K->2K
Why: At current rates, players need 67+ active sessions to reach first career advance. The prestige loop is the core retention hook but unreachable in practice. Boosting gains 5x and lowering the first gate to 2K makes it achievable in 3-5 sessions.
Files to change: js/production.js (lines 53, 76, 116), js/career.js (repReq values)
Implementation sketch:
- production.js:53: reputation += 1 -> reputation += 5
- production.js:76-77 floating text: +1 Rep -> +5 Rep
- production.js:116: reputation += 10 -> reputation += 50
- career.js BugFarm: repReq: 10000 -> repReq: 2000
- Reduce downstream stages proportionally: 100K->20K, 1M->200K, 10M->2M, 100M->20M, 1B->200M, 10B->2B
Expected impact:
- Short term (1h): Players see career progress bar moving meaningfully; READY within first session for active tappers
- Long term (1 week): Career advance conversion becomes measurable; 2x multiplier motivates return sessions
Rollback plan: Revert numeric constants in 2 files. Existing save rep values preserved (additive only).

## Considered but Rejected
- Option A: Full event system overhaul - too broad; extracted 2 specific guards as UX candidate instead.
- Option B: Add Orchestrator passive rep/s - adds complexity; rate boost is faster to ship and verify.
