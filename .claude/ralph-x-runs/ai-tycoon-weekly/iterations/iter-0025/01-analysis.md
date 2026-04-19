# Iter 25 Analysis (multi-lens)

_Generated: 2026-04-19_

## Snapshot Delta Table
| Metric | Current (30d) | Previous (1d) | Delta |
|---|---|---|---|
| activeUsers | 45 | 0 | N/A (different periods) |
| newUsers | 45 | 0 | N/A |
| tutorial_step/user | 2.00 | N/A | 30d baseline |
| challenge_complete_rate | 87% (27/31) | N/A | 30d baseline |
| upgrade_purchase/user | 0.18 (8 events / 1 user) | N/A | 30d baseline |
| avg_session_sec | 124.9s | N/A | 30d baseline |
| research_pull penetration | 20% (9/45 users) | N/A | 30d baseline |
| Germany avg engagement | 2334s (top country by time) | N/A | 2.9x above US avg 816s |

Note: Latest 1-day snapshot empty (no sessions past 24h). All data from 30d baseline (Mar 30-Apr 14). Iters 23-24 fixes post-date this data.

## Top 3 GA Findings
1. **Tutorial completion catastrophically low**: tutorial_step avg = 2.0/10 - users average only 2 steps before dropping. Even accounting for iter 24 buy-upgrade fix, step 9 (research pull) is broken in code.
2. **Upgrade purchase funnel broken**: 8 purchases from only 1 user (1/45 = 2.2% conversion). Iter 24 fixed the dead selector; GA data predates it.
3. **Research reach = 20%**: Only 9/45 users ever pulled research. Downstream of tutorial failure.

## Code Fresh-eye Findings
1. js/research.js:146-239 - doResearchPull() has a 1.5s async setTimeout before revealing results. Zero call to advanceTutorial() anywhere in this function. Tutorial step 9 trigger is buy, but the only buy trigger check is in main.js:1118 inside doBuyUpgrade(). Research pull is a completely separate code path.
2. js/tutorial.js:72 - Tutorial step 9 (do-research) uses trigger: buy - reused from step 6 (buy-upgrade) without adapting the call site. Step 9 needs advanceTutorial() called inside doResearchPull().
3. js/tutorial.js:154-155 - Spotlight steps auto-advance if !target. However .research-pull-btn IS found at step 9 (papers >= 10, button enabled), so the auto-advance safety net does NOT fire. Players stuck at step 9 indefinitely.
4. js/research.js:168-173 - During the 1.5s spinner, research-result innerHTML is replaced, making .research-pull-btn disappear. Spotlight (positioned at render time) now points at an area with a spinner. Visually broken during spinner.
5. js/main.js:1118 - doBuyUpgrade() correctly calls advanceTutorial() for trigger buy. Same pattern must be added to doResearchPull().

## Playtest Observations
1. Tutorial steps 1-6 all work - welcome modal, tap editor, compile, models modal, go upgrade, buy Batch Size all flow correctly. Iter 24 fix confirmed working. (screenshot: play-01-start.png)
2. Steps 7-8 work - clicking train.js tab advances, navigating to models screen advances. Spotlight and bubble positions correct. (screenshot: play-02-mid.png)
3. Step 9 confirmed permanently STUCK - clicking Research! pulls successfully (spinner + reveal New model discovered!), but tutorial overlay stays fixed at Step 9 of 10 - Pull to discover a new AI model! Player cannot proceed without Skip Tutorial. (screenshot: play-03-end.png)

## Triangulation
Code review and playtest deliver the same deterministic verdict: doResearchPull() never calls advanceTutorial(), making tutorial step 9 uncompletable. GA tutorial_step/user = 2.0 reflects earlier funnel failures (dead selectors fixed in iters 23-24), but step 9 is a code-confirmed blocker affecting ALL post-iter-24 players who reach research. The code signal is unambiguous; GA corroborates with low tutorial penetration; playtest confirmed 100% reproduce. Code is the strongest signal.

## Candidates Per Lens

### UI
- **Candidate**: Research spotlight misposition during spinner - spotlight points at disappearing button for 1.5s / Score: 6/10 / Evidence: Code (research.js:168) + Playtest

### UX
- **Candidate**: Fix tutorial step 9 - doResearchPull() must call advanceTutorial() after reveal / Score: 9/10 / Evidence: Code (research.js:146, tutorial.js:72, main.js:1118) + Playtest (100% confirmed stuck) + GA (tutorial_step/user = 2.0)

### 기획자
- **Candidate**: Tutorial complete modal (step 10) shows discovered model name - personalizes the achievement / Score: 6/10 / Evidence: Code (tutorial.js:75-80) + Playtest

### 개발자
- **Candidate**: Tutorial trigger mismatch - step 9 reuses buy trigger from step 6 but has no handler in research code path; fix by adding advanceTutorial() inside async reveal callback / Score: 9/10 / Evidence: Code (research.js:146-239, tutorial.js:72, main.js:1118)

### 게이머
- **Candidate**: Post-tutorial CTA gap - after Start Building! modal, no visual guide directs player to Challenge as next fun activity / Score: 5/10 / Evidence: Playtest + Code (tutorial.js:78 mentions Try Challenges in text but no spotlight follows)

## Lens Choice Reasoning
UX (9/10) and 개발자 (9/10) identify the same root bug - both pass. UI (6/10) and 기획자 (6/10) are above threshold - both in queue. 게이머 (5/10) is at threshold - included. Anti-stagnation: last 5 iters heavily used UX (iters 23, 24, 18, 17, 16). However step 9 is a deterministic 100% blocker; rotation would be wrong. Secondary items (UI/기획자/게이머) add lens diversity.

## Implementation Queue

| # | Lens | Title | Score | Files (expected) |
|---|---|---|---|---|
| 1 | UX/개발자 | Fix tutorial step 9: add advanceTutorial() after research reveal | 9/10 | js/research.js |
| 2 | UI | Advance tutorial before spinner so spotlight target still valid (merged with #1) | 6/10 | js/research.js |
| 3 | 기획자 | Tutorial complete modal shows discovered model name | 6/10 | js/tutorial.js, js/main.js |
| 4 | 게이머 | Post-tutorial: pulse Challenge button on first idle moment | 5/10 | js/tutorial.js, css/style.css |

## Primary Improvement
**Lens**: UX / 개발자
**Title**: Fix tutorial step 9 - research pull must call advanceTutorial() after reveal
**Why**: doResearchPull() in js/research.js never calls advanceTutorial(). The buy trigger is only checked in main.js:1118 inside doBuyUpgrade(). 100% of players reaching step 9 are permanently stuck. Confirmed by code + playtest. GA tutorial_step/user = 2.0 is downstream evidence.
**Files to change**: js/research.js (inside doResearchPull() setTimeout callback, after resultEl.innerHTML is set for normal pull, ~line 228). Also add same guard for hallucination branch.
**Implementation sketch**:
  After resultEl.innerHTML for normal reveal:
    if (typeof getTutorialTrigger === function && getTutorialTrigger() === buy) {
      setTimeout(() => advanceTutorial(), 400); // let player see reveal, then advance to step 10
    }
**Expected impact**:
- Short term (1h): Tutorial step 9 unblocked for 100% of post-step-8 players
- Long term (1 week): tutorial_step/user rises toward 8-10; research_pull penetration beyond 20%
**Rollback plan**: Remove the advanceTutorial() calls from setTimeout callbacks. No persistent state changes.

## Considered but Rejected
- **Option A - Career rep curve rebalance**: Already done iter 19 (prestige scaling). Not current bottleneck.
- **Option B - Challenge discovery UX**: Hint already added iter 17. Not critical vs step 9 fix.
