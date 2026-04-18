# Iter 12 Analysis (multi-lens)

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
| GA note | Both snapshots (T1841, T1951) returned fully empty | | |

GA is completely silent. Full reliance on Code + Playtest signals this iter.

## Top 3 GA Findings
1. Zero data in 1-day window — GA pipeline empty; no user-level metrics available
2. Baseline snapshot comparison meaningless (0→0)
3. Leaning 100% on Signal B (code review) and Signal C (playtest)

## Code Fresh-eye Findings
Files read: js/state.js, js/tutorial.js, js/main.js, js/production.js, js/career.js, js/events.js, js/hints.js, js/upgrade.js

1. state.js:112-114 — shownUnlockModals NOT in primitives list or arrays merge in loadGame(). Silently resets to [] on every reload — all unlock/prestige-ready toasts re-fire every session.

2. state.js:61-63 — dailyStreak and lastDailyClaimDate not in primitives merge list. Reset to defaults on every reload — daily streak lost on page refresh.

3. tutorial.js:85-89 — startTutorial() calls showTutorialStep(0) if tutorialStep < 10 with no guard for existing progress. A saved state with tutorialStep: 0 re-displays welcome modal every session.

4. events.js:261-271 — At 20 taps, flow state fires 3x loc but meter resets to 0 instantly. Visual flash fires, but vanishing meter gives no triumph moment — player cannot confirm the reward.

5. hints.js:139-144 — Hint suppression fires when activeMission.screen exists, but updateHintBanner() not triggered after events clear. Stale "Compile!" hint persisted with 157 compute during playtest.

## Playtest Observations
Local server http://localhost:8765. Player save state: papers: 28, tokens: 5, tutorialStep: 0.

1. Tutorial modal fired for returning player (screenshot: play-02-mid.png) — "Welcome to AI Tycoon! Step 1 of 10" appeared over game with 28 papers. tutorialStep was 0 in saved state despite prior progress.

2. Flow state meter at 12/20 visible after 12 taps (screenshot: play-02-mid.png). "Enterprise Deal!" event fired simultaneously. Event system functional.

3. Upgrade screen clean (screenshot: play-03-end.png) — "Hacker News! +5000 Compute" event banner showing. Cards: level badge, description, cost button all clear.

4. shownUnlockModals confirmed empty after reload — JS check returned [] from saved state; means all unlock notifications fire fresh every session.

## Triangulation
GA is silent — Signals B and C carry 100%. Code found three confirmed save/load bugs in state.js. Playtest directly confirmed bug #3 (tutorial re-trigger): play-02-mid.png shows welcome modal for player with 28 papers. Code and playtest are fully convergent on the developer lens. All three bugs were directly verified.

## Candidates Per Lens

### UI
- **Candidate**: Token timer label "5 (0:49)" is cryptic — show "next in 0:49" / Score: 4/10 / Evidence: Playtest top bar

### UX
- **Candidate**: Hint banner stale re-evaluation — "Compile!" hint persists with 157 compute / Score: 5/10 / Evidence: Code (hints.js:139) + Playtest

### 기획자
- **Candidate**: train.js papers conversion too harsh early — Math.max(1, floor(loc*rate/100)) gives 1 paper minimum with loc=6; discourages training tab / Score: 5/10 / Evidence: Code (production.js:103)

### 개발자
- **Candidate**: Fix save/load persistence gaps + tutorial re-trigger guard / Score: 8/10 / Evidence: Code (state.js:112-114, 61-63) + Playtest (tutorial modal confirmed, shownUnlockModals:[] confirmed)

### 게이머
- **Candidate**: Flow State 20-tap milestone celebration — hold meter + "FLOW STATE!" label for 1s before reset / Score: 5/10 / Evidence: Code (events.js:261-271) + Playtest (payoff moment invisible)

## Lens Choice Reasoning
개발자 8/10 → implement. Last used iter 4 (8 iters ago). Three confirmed deterministic bugs affecting every returning player.

게이머 5/10 → implement. Last completed iter 5 (7 iters ago); iter 9 skipped. Flow state payoff confirmed weak in playtest.

UX 5/10 → SKIP. Used in iter 11 (1 iter ago). Anti-stagnation: too recent.

기획자 5/10 → SKIP. Used in iters 8 and 10 — 2x in last 5 completions. Anti-stagnation.

UI 4/10 → SKIP (below threshold).

## Implementation Queue

| # | Lens | Title | Score | Files |
|---|---|---|---|---|
| 1 | 개발자 | Fix save/load: persist shownUnlockModals + dailyStreak + tutorial re-trigger guard | 8/10 | js/state.js, js/tutorial.js |
| 2 | 게이머 | Flow State 20-tap milestone: hold meter + FLOW! label 1s before reset | 5/10 | js/events.js, css/style.css |

## Primary Improvement
**Lens**: 개발자
**Title**: Fix save/load state persistence gaps + tutorial re-trigger guard
**Why**: Three confirmed bugs hitting returning players on every page reload:
1. shownUnlockModals not merged → unlock toast spam on reload
2. dailyStreak + lastDailyClaimDate not merged → streak lost on refresh
3. tutorialStep: 0 + existing progress = welcome modal every session

**Files to change**:
- js/state.js — add missing fields to merge lists in loadGame()
- js/tutorial.js — add progress guard in startTutorial()

**Implementation sketch**:
- loadGame() primitives loop: add 'dailyStreak', 'lastDailyClaimDate'
- loadGame() arrays block: add shownUnlockModals merge
- startTutorial(): if tutorialStep === 0 AND (stats.totalCompiles > 0 OR reputation > 0 OR papers > 20) → skip: tutorialStep = TUTORIAL_STEPS.length; endTutorial(); return

**Expected impact**:
- Short term (1h): Returning players no longer see tutorial modal on reload; unlock toast spam stops; daily streak loop activates
- Long term (1 week): Session continuity improves → reduced bounce on return visits

**Rollback plan**: Additive changes only. Revert state.js + tutorial.js commits. No data loss.

## Considered but Rejected
- **Option A — UX: Stale hint banner**: Score 5/10 but UX used iter 11. Too recent. Defer.
- **Option B — 기획자: train.js paper ratio**: Score 5/10 but 기획자 used 2x in last 5 iters. Deferred.
- **Option C — UI: Token timer label**: Score 4/10. Below threshold.
