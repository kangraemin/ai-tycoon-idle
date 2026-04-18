# Iter 20 Analysis (multi-lens)

_Generated: 2026-04-19_

## Snapshot Delta Table
| Metric | Current | Previous | Delta |
|---|---|---|---|
| activeUsers | 0 | 0 | 0 |
| newUsers | 0 | 0 | 0 |
| tutorial_step/user | N/A | N/A | N/A |
| challenge_complete_rate | N/A | N/A | N/A |
| upgrade_purchase/user | N/A | N/A | N/A |
| avg_session_sec | N/A | N/A | N/A |
| game_events fired | 0 | 0 | 0 |

GA completely silent (both snapshots 2026-04-18T1841 and 2026-04-18T1951 empty).

## Top 3 GA Findings
1. GA still 0 users — no real-user data for any metric (same as iters 16-19)
2. No challenge/compile/career events to analyze
3. Falling back entirely to Code + Playtest signal (B+C dominant)

## Code Fresh-eye Findings
Files read: `challenge.js`, `career.js`, `production.js`, `main.js`, `events.js`, `research.js`

1. `challenge.js:292-294` — Challenge rewards are **flat** (100 LOC x multiplier, 50 Compute x multiplier, 100 Rep x multiplier). No `prestigeMultiplier` scaling. Compare: `tapEditor()` (production.js:53) uses `Math.ceil(5 * gameState.prestigeMultiplier)` and `compileData()` uses `Math.ceil(50 * gameState.prestigeMultiplier)`. At ChatJBT stage (10x), an S-grade challenge gives 300 Rep vs 2,000,000 Rep requirement = 0.015% progress. **Challenges become dead content past stage 2.**

2. `main.js:32-38` — `getCurrentMission()` `nextModel` branch returns `{ sub: formatNumber(def.unlockCost) + ' Compute needed', screen: 'models' }`. But models are obtained ONLY via research (papers + gacha). The mission card sends players to models screen where there is no "buy with compute" button — **misleading sub-text causing navigation dead-end**.

3. `main.js:625-655` — `startGame()` calls `startTutorial()` then `checkDailyBonus()`. In playtest, tutorial step-4 overlay AND offline summary modal appeared simultaneously — "Collect" button click timed out (blocked by tutorial z-index). Same collision pattern that was fixed for other steps (iters 2, 7, 13) but persists for mid-tutorial returning players at step 4.

4. `research.js:6-12` / `main.js:907-912` — Models screen "Coming Next" shows `def.unlockCost` as "Compute" progress (e.g., "Translator 100 Compute 100%"), implying compute-based unlock that doesn't exist. Players may expect to spend compute directly on these.

5. `challenge.js:62` — `DAILY_FREE_CHALLENGES = 3`. With 30s cooldown, even if a player wants to play more, they're capped at 3 free challenges/day. Challenge button subtext "Win -> +Rep +Papers +Compute" doesn't tell player when their next free challenge recharges.

## Playtest Observations
State loaded: 25 papers, 150 compute, 55 rep, 1 model (Chatbot Lv1), tutorial step 4.

1. Tutorial step 4 overlay ("Your AI Models Auto-Code!") AND offline summary modal ("Welcome Back! While you were away") both visible at same time — "Collect" button non-clickable due to tutorial overlay. Returning mid-tutorial players cannot dismiss offline summary normally. (screenshot: play-01-start.png)

2. Mission card shows "Buy Batch Size upgrade!" (50 compute, affordable) — correct guidance. "Coming Next" in models tab shows "Translator 100 Compute 100%" implying compute purchase path that doesn't exist. Player has 25 papers and CAN research, but the label creates confusion about acquisition mechanic. (screenshot: play-02-mid.png)

3. Research pull worked correctly (10 papers -> model acquired, 2/2 GPU filled). Viral Post event fired giving 5x LoC 30s boost. Challenge button shows "Code Complete (Free 3 left)" — challenge rewards at NullPointer are adequate but scale will break at BugFarm+. (screenshot: play-03-end.png)

## Triangulation
GA dead (0 users) again. Signals B+C are fully authoritative. Code review found the most actionable signal: challenge reward scaling is a systemic dead-content bug affecting all players past career stage 1 — the most impactful find. Playtest confirmed the offline+tutorial modal collision persists for step 4 returning players and confirmed the "Coming Next" Compute label confusion. **Code signal was strongest**, identifying challenge scaling as the decisive issue. Playtest corroborated UX and developer bugs.

## Candidates Per Lens

### UI
- **Candidate**: Fix "Coming Next" section — replace "X Compute" label with "Research with Papers" hint / Score: 7/10 / Evidence: Playtest (play-02-mid.png) + code (main.js renderModelsScreen, def.unlockCost display)

### UX
- **Candidate**: Fix mission card "Unlock [model]! X Compute needed" sub-text + change screen from 'models' to 'research' / Score: 8/10 / Evidence: code (main.js:36-38), playtest confirmed navigation dead-end

### 기획자
- **Candidate**: Challenge rewards scale with prestigeMultiplier — apply `* gameState.prestigeMultiplier` to locReward, computeReward, repReward in submitChallenge() / Score: 9/10 / Evidence: code (challenge.js:292-294 vs production.js:53, career.js stage gap analysis)

### 개발자
- **Candidate**: Fix offline modal blocked by tutorial step-4 overlay — defer tutorial or ensure offline modal renders above tutorial z-index / Score: 8/10 / Evidence: Playtest (play-01-start.png), code (main.js:625-655 startGame sequence)

### 게이머
- **Candidate**: Raise free daily challenges from 3 to 5, add token recharge countdown to challenge button subtext / Score: 7/10 / Evidence: Code (challenge.js:62 DAILY_FREE_CHALLENGES=3), playtest (challenge area visible, 3-free limit shown)

## Lens Choice Reasoning

All candidates scored:
- 기획자 9/10 -> **IN QUEUE**
- UX 8/10 -> **IN QUEUE**
- 개발자 8/10 -> **IN QUEUE**
- UI 7/10 -> **IN QUEUE**
- 게이머 7/10 -> **IN QUEUE**

All five >= 5, all implemented. Anti-stagnation check: last 5 primaries were 기획자(19), UX(18), 기획자(17), 개발자(16), 기획자(15). 기획자 appears 3 of 5 but NOT 3-in-a-row (18 was UX). Challenge reward scaling scores 9/10 — decisively highest impact — so 기획자 leads again.

## Implementation Queue

| # | Lens | Title | Score | Files (예상) |
|---|---|---|---|---|
| 1 | 기획자 | Challenge rewards scale with prestigeMultiplier | 9/10 | `js/challenge.js` |
| 2 | UX | Fix mission card model-unlock sub-text + screen routing | 8/10 | `js/main.js` |
| 3 | 개발자 | Fix offline modal blocked by tutorial step-4 overlay | 8/10 | `js/main.js`, `js/ui.js` |
| 4 | UI | Fix "Coming Next" misleading Compute label | 7/10 | `js/main.js` |
| 5 | 게이머 | Raise free challenges 3->5, add token recharge hint | 7/10 | `js/challenge.js`, `js/main.js` |

## Primary Improvement (점수 가장 높은 것 상세)
**Lens**: 기획자  
**Title**: Challenge rewards scale with prestigeMultiplier  
**Why**: `submitChallenge()` at challenge.js:292-294 computes rewards with flat base x grade multiplier x rlhf bonus — no prestige scaling. At BugFarm (2x), challenges already feel weak vs idle income. At ChatJBT (10x), S-grade gives 300 Rep vs 2M Rep requirement. Core active-play mechanic should scale with the game's prestige curve or it becomes vestigial dead content.

**Files to change**: `js/challenge.js` (lines 291-295 in submitChallenge())  
**Implementation sketch**:
```js
const prestige = gameState.prestigeMultiplier || 1;
const locReward = Math.floor(100 * gradeInfo.multiplier * rlhfBonus * prestige);
const computeReward = Math.floor(50 * gradeInfo.multiplier * rlhfBonus * prestige);
const repReward = Math.floor(100 * gradeInfo.multiplier * prestige);
// paperReward unchanged (papers are stage-agnostic)
```

**Expected impact**:
- 단기(1h 후): challenges feel rewarding at BugFarm stage — S-grade gives 600 Rep = 30% of advance requirement vs current 15%
- 장기(1주 후): challenge engagement should persist through all career stages; active-play loop remains meaningful

**Rollback plan**: Remove `* prestige` from challenge.js:292-294 — instant, no save data corruption

## Considered but Rejected
- **Option A — Increase positive event spawn rate**: Would boost mid-session feel but doesn't fix dead-content problem for challenges. Deferred.
- **Option B — Add compute-based direct model unlock path**: Would fix "Compute needed" UX at source, but creates two acquisition paths requiring design work. Simpler label fix is in queue as item 4.
