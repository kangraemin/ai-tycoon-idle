# Iter 26 Analysis (multi-lens)

_Generated: 2026-04-19_

## Snapshot Delta Table

| Metric | Current (30d) | Previous (1d) | Delta |
|---|---|---|---|
| activeUsers | 45 | 0 | N/A (different windows) |
| newUsers | 45 | 0 | 100% new, 0 return |
| sessions | 46 | 0 | 1.02 sessions/user |
| avg_session_sec | 124.9 | N/A | ~2 min |
| tutorial_step/user | 2.00 | N/A | out of 10 steps |
| research_pull/user | 8.67 | N/A | only 9/45 users (20%) |
| challenge_start/user | 1.72 | N/A | 18/45 users (40%) |
| challenge_complete rate | 87% | N/A | 27/31 attempts |
| upgrade_purchase/user | 8.0 | N/A | only 1/45 users (2.2%) |
| Germany engagement | 291s/user | N/A | vs US 54s/user (5.4x) |
| mobile bounce | 3.34s avg | N/A | 2/45 mobile users instant-quit |

## Top 3 GA Findings

1. **tutorial_step/user = 2.0 out of 10**: Only 29/45 users triggered tutorial events. Average 2 steps means most drop at step 1-2 (tap editor / compile prompt). Catastrophically low.
2. **upgrade_purchase: 1/45 users (2.2%)**: Core economy loop invisible to 98% of players.
3. **challenge engagement 40% (18/45) vs upgrade 2.2% (1/45)**: Players engage with challenges at 18x the rate of upgrades. Challenges are the most naturally discovered fun element.

## Code Fresh-eye Findings

Files read: js/tutorial.js, js/production.js, js/main.js, js/career.js, js/challenge.js, js/ui.js, js/upgrade.js, js/offline.js, js/research.js, js/events.js

1. `js/ui.js:17` -- Career locked toast says "Earn 5,000 Rep" but `checkTabUnlock:643` unlocks at reputation >= 2000. Toast is 2.5x the actual threshold. Player with 0 Rep sees "5,000 needed" and gives up; actual requirement (2,000) achievable in ~3 min.
2. `js/ui.js:643` -- Career tab locked for VIEWING until 2,000 Rep. Career screen has the game's most motivating content: 8-stage prestige path (1x to 50x multiplier), Rep/hr, "Advance In" timer. New players never see why Rep matters.
3. `js/main.js:87-89` -- getNextGoalItems() adds career progress to Goals card ("BugFarm 0%"). But clicking it calls switchScreen('career') which hits nav-locked guard and shows wrong "5,000 Rep" toast. The one place players see career progress leads to a discouraging dead end.
4. `js/challenge.js:294-327` -- Challenge rewards: +100 Rep (C grade), +300 Rep (S grade). Need 2,000 Rep for BugFarm = 20 challenges (C) or 7 (S). Achievable! But players don't know because career is locked and toast says 5,000.
5. `js/production.js:53` -- Tap gives 5 Rep/tap. 400 taps = BugFarm in ~3.3 min of active play. Achievable in one session but target is invisible.

## Playtest Observations

Browse skill observations (saved-state player with 1.5K LoC, 25 Papers):

1. Goals card "BugFarm 0%" clickable leads to wrong toast (screenshot: play-01-start.png): Goals card shows BugFarm bar at 0%. Clicking chevron fires switchScreen('career') -> nav-locked guard -> "Earn 5,000 Rep" toast. Wrong and discouraging.
2. Career screen when accessible shows complete motivating path (screenshot: play-02-mid.png): Full path NullPointer to Founder with Rep/hr and "Advance In ~1.3h" estimate. Incredibly motivating -- but locked from new players.
3. Challenge button shows generic "Win to +Rep +Papers +Compute" (screenshot: play-03-end.png): After completing, result shows exact amounts (+100 Compute, +100 Rep). Pre-game text is generic, reducing perceived value before playing.

## Triangulation

GA's clearest signal is 2.0 tutorial step average and 2.2% upgrade engagement -- massive early funnel failure. Code review reveals the mechanism: career tab is locked, Goals card BugFarm entry dead-ends into wrong-threshold toast. Playtest confirms this. All three signals converge: career-progression visibility is broken for new players. The career screen has the game's most motivating content but is gated behind the very metric it's supposed to motivate. Code and playtest provide the strongest signal here; GA is mostly historical (traffic dried up after March launch spike).

## Candidates Per Lens

### UI
- **Candidate**: Fix career nav toast "5,000" to "2,000" / Score: 6/10 / Evidence: js/ui.js:17 hardcoded mismatch vs checkTabUnlock:643 condition

### UX
- **Candidate**: Career tab visible-but-locked earlier -- show full path, gate only Advance button / Score: 7/10 / Evidence: Playtest confirmed BugFarm click to dead-end toast; anti-stagnation (UX 3x of last 5 iters)

### 기획자
- **Candidate**: Remove career nav lock entirely -- Advance button already gated by canPromote() / Score: 9/10 / Evidence: canPromote() guard on button confirmed; nav lock gates player knowledge not game mechanics. 40% challenge vs 2.2% upgrade = players lack direction, not motivation.

### 개발자
- **Candidate**: Fix ui.js:17 "5,000 to 2,000" + investigate mobile 3.34s instant bounce / Score: 7/10 / Evidence: GA mobile avg 3.34s; stale constant in ui.js:17

### 게이머
- **Candidate**: Show career Rep context on challenge result ("You earned X Rep -- Y Rep to BugFarm!") / Score: 7/10 / Evidence: challenge.js:326 shows +repReward with no career context

## Lens Choice Reasoning

Anti-stagnation check (last 5 iters): UX(25), UX(24), UX/UI(23), 게이머(22), 기획자(21). UX used 3x -- avoid as primary.

- 기획자 9/10 -> PASS (primary)
- 개발자 7/10 -> PASS
- 게이머 7/10 -> PASS
- UX 7/10 -> downgrade (3x anti-stagnation); fold naturally if possible
- UI 6/10 -> PASS (quick fix, fold into 개발자 commit)

## Implementation Queue

| # | Lens | Title | Score | Files |
|---|---|---|---|---|
| 1 | 기획자 | Remove career nav lock -- career screen accessible from start | 9/10 | js/ui.js, index.html |
| 2 | 개발자/UI | Fix career toast 5000->2000 + mobile CSS check | 7/10 | js/ui.js |
| 3 | 게이머 | Show career progress context in challenge result screen | 7/10 | js/challenge.js |

## Primary Improvement

**Lens**: 기획자
**Title**: Remove career nav lock -- all players see career screen from the start
**Why**: Career screen is the prestige motivation engine (8-stage path, 1x to 50x multiplier, Rep/hr, Advance In timer). New players have this locked behind 2,000 Rep -- the metric this screen is supposed to motivate. canPromote() guard already exists on the Advance button, so removing the nav lock does not break any mechanic. Players seeing "BugFarm: 0/2,000 Rep -- 2x multiplier" immediately understand why they're tapping.
**Files to change**:
- js/ui.js -- remove career unlock block from checkTabUnlock(), fix toast 5000->2000
- index.html -- remove nav-locked class and data-unlock="career" from career nav button

**Implementation sketch**:
- index.html: Remove nav-locked and data-unlock="career" from career nav button
- js/ui.js:643: Remove the cond === 'career' unlock block (no longer needed)
- js/ui.js:17: Change "5,000" to "2,000"
- js/career.js: canPromote() / "Not Ready Yet" button already correctly gated (confirmed in playtest)

**Expected impact**:
- Short term (1h after deploy): Players who reach career screen see full prestige path; "Advance In ~3m" motivates continued tapping; BugFarm goal now navigable
- Long term (1 week): tutorial_step/user increase past 2.0 as players have clearer direction; challenge +Rep reward has visible purpose

**Rollback plan**: Re-add nav-locked class to career nav in index.html; restore checkTabUnlock career condition.

## Considered but Rejected

- **Option A -- Offline progress enhancement**: js/offline.js + js/ui.js:460-524 already implement complete "Welcome Back!" modal with count-up animation. System is already good. 0% return rate is a user acquisition problem, not a missing feature.
- **Option B -- Tutorial tap-editor friction**: Anti-stagnation prohibits UX as primary (3 of last 5). Iter-25 fixes (step 9 advanceTutorial fix) committed but not yet deployed -- those may improve tutorial completion once deployed this iter.
