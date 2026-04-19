# Iter 27 Analysis (multi-lens)

_Generated: 2026-04-19_

## Snapshot Delta Table
| Metric | Current (30d) | Previous (1d-window) | Delta |
|---|---|---|---|
| activeUsers | 45 | 0 | -45 (no recent traffic) |
| newUsers | 45 | 0 | N/A (1d window empty) |
| tutorial_step/user | 2.00 | N/A | stable (29/45 users, avg 2 steps) |
| challenge_complete_rate | 87% (27/31) | N/A | good signal |
| upgrade_purchase/user | 0.02 (1 user total) | N/A | CRITICAL bottleneck |
| avg_session_sec | 124.9s | N/A | ~2 min only |
| mobile sessions | 3.3s avg | N/A | mobile essentially broken |
| Germany engagement | 2334s total | US: 816s | 3x higher per-user time |

## Top 3 GA Findings
1. upgrade_purchase = 1/45 users (2.2%) -- the core economic loop never starts for 98% of users. Defining funnel failure.
2. tutorial_step/user = 2.00 -- average player completes only 2 tutorial steps (of 10). Most drop off before upgrade step (step 5). Explains #1.
3. avg_session_sec = 124.9s -- 2-minute avg session. No offline progress hook. Idle tycoon without offline earnings = one-shot visits.

## Code Fresh-eye Findings
Files read: state.js, production.js, tutorial.js, career.js, challenge.js, events.js, hints.js, main.js

1. state.js:102 -- loadGame() has zero offline earnings calculation. No elapsed-time to LoC/Compute award on load. Core idle tycoon mechanic missing.
2. production.js:53 -- Rep gain ONLY from tapEditor() (+5x prestige) and compileData() (+50x prestige). Idle model production generates zero Rep. Career metric disconnected from idle loop.
3. career.js:6 -- BugFarm requires 2000 Rep. At 5 Rep/tap = 400 manual taps. Idle players earn 0 Rep/hr. Career loop requires active tapping only.
4. tutorial.js:128-134 -- buy-upgrade step has 500ms polling loop waiting for 50 Compute. No visual feedback while polling.
5. hints.js:65 -- try-fusion hint fires at owned >= 2 models but does not check Compute affordability. Misleading for broke players.

## Playtest Observations
1. Rep stayed at 0 throughout entire session even as LoC accumulated to 351 from idle Chatbot. Career bar showed BugFarm 0% with no indication of how to earn Rep or that idle models do not contribute. (screenshot: play-01-start.png)
2. Editor click timeouts -- .editor-body click selector timed out but idle production still worked. LoC went 0->81->351 from Chatbot. Core idle loop functional. (screenshot: play-02-mid.png)
3. Token display jumped 0 to 5/10 countdown without user action. Token recharge applied retroactively from stale lastTokenRecharge. Correct behavior but confusing visual flash on load. (screenshot: play-03-end.png)

## Triangulation
All 3 signals converge: the idle game loop is disconnected from career progression. GA shows 2-min sessions and 98% non-upgraders. Code confirms no offline earnings in state.js and Rep-from-idle gap in production.js. Playtest confirmed Rep=0 while models run. Code review is the strongest signal here -- GA is stale baseline from pre-fix period; playtest directly validated the code finding. The defining fix is offline earnings to create a re-engagement hook.

## Candidates Per Lens

### UI
- Candidate: Offline earnings welcome-back modal styling / Score: 5/10 / Evidence: Playtest shows 0 to resources transition with no context

### UX
- Candidate: Post-tutorial "what's next" 3-item checklist (Try Challenge, Earn Rep, Research) shown after endTutorial() / Score: 6/10 / Evidence: Playtest -- after tutorial complete, no next-steps guidance; challenge button appears without framing

### 기획자
- Candidate: **Offline Earnings System** -- elapsed time x LPS on loadGame(), award LoC, welcome-back modal / Score: 9/10 / Evidence: state.js:102 no offline calc; GA 2-min sessions; idle tycoon without offline progress violates core genre contract
- Candidate: Passive Rep gain from model LPS in produceTick() / Score: 7/10 / Evidence: production.js:19-27 produceTick adds only LoC; Rep fully manual; career loop incompatible with idle behavior

### 개발자
- Candidate: Passive Rep implementation in produceTick() (overlaps with 기획자 secondary -- one commit) / Score: 6/10 / Evidence: fundamental idle-game logic gap between model running and career progress

### 게이머
- Candidate: Challenge cooldown live countdown -- replace disabled button with "Play again in Xs" live countdown / Score: 7/10 / Evidence: challenge.js:60 CHALLENGE_COOLDOWN=30000ms; 87% completion rate = players want to replay but find a dead button with no timer

## Lens Choice Reasoning
- 기획자 (9/10): Passes -- PRIMARY. Missing idle mechanic.
- 게이머 (7/10): Passes -- challenge cooldown countdown improves replay momentum for the strongest existing mechanic.
- 기획자-secondary (7/10): Passes -- passive Rep from LPS connects idle loop to career.
- UX (6/10): Passes -- post-tutorial next-steps fills guidance void.
- 개발자 (6/10): Passes but overlaps with 기획자-secondary; merged into one commit.
- UI (5/10): Borderline -- no standalone commit, styling folded into offline modal.

Anti-stagnation: last 5 completed iters: 26(기획자), 24(UX/dev), 23(UX/UI), 22(게이머), 21(기획자). Two 기획자 in last 6, not 3 in a row -- rule not triggered.

## Implementation Queue

| # | Lens | Title | Score | Files |
|---|---|---|---|---|
| 1 | 기획자 | Offline earnings: LoC award on load + welcome-back modal | 9/10 | js/state.js, js/ui.js |
| 2 | 게이머 | Challenge cooldown live countdown on button | 7/10 | js/challenge.js, css/style.css |
| 3 | 기획자/개발자 | Passive Rep from model LPS in produceTick() | 7/10 | js/production.js |
| 4 | UX | Post-tutorial "what's next" checklist toast | 6/10 | js/tutorial.js |

## Primary Improvement
**Lens**: 기획자
**Title**: Offline Earnings System -- LoC accumulation while away
**Why**: loadGame() in state.js:102 has no offline calculation. Players who return after 30+ minutes find the exact same state they left. An idle tycoon without offline progress violates the core genre contract. The 2-minute avg session confirms no reason to return. Offline earnings creates the re-engagement hook.
**Files to change**:
- js/state.js -- add applyOfflineEarnings() called after loadGame() resolves
- js/ui.js -- showOfflineModal() to display welcome-back breakdown

**Implementation sketch**:
After loadGame(): compute elapsed = min((now - lastSaveTime)/1000, 8*3600). If elapsed < 60, skip.
offlineLoc = floor(getLocPerSecond() * elapsed) using loaded model state.
Award full offlineLoc to gameState.loc + gameState.totalLoc.
Show toast for short absence, modal for long absence (> 10 min). No auto-compile to preserve player agency.

**Expected impact**:
- Short-term (1h): Returning players see offline earnings, immediate engagement with accumulated LoC
- Long-term (1wk): Return rate increases; avg session length increases as players compile accumulated LoC

**Rollback plan**: Remove applyOfflineEarnings() call from init. No state corruption risk.

## Considered but Rejected
- Option A -- Mobile Layout Fix: Mobile sessions = 3.3s but CSS fixes require device testing. Deferred.
- Option B -- hints.js fusion Compute check: Minor edge case. Low priority.
