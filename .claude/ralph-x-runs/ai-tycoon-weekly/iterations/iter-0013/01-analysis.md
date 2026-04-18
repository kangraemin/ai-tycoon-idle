# Iter 13 Analysis (multi-lens)

_Generated: 2026-04-18_

## Snapshot Delta Table
| Metric | Current | Previous | Delta |
|---|---|---|---|
| activeUsers | 0 | 0 | 0 |
| newUsers | 0 | 0 | 0 |
| tutorial_step/user | N/A | N/A | N/A (0 game events) |
| challenge_complete_rate | N/A | N/A | N/A |
| upgrade_purchase/user | N/A | N/A | N/A |
| avg_session_sec | N/A | N/A | N/A |

> GA entirely silent both snapshots (19:51 and 18:41) have zero users. All signals come from Code review + Playtest only.

## Top 3 GA Findings
1. No GA data in 1-day window - 0 active users across both snapshots
2. No game events recorded - impossible to measure funnel metrics
3. Signal vacuum: code review + playtest are 100% of the signal this iter

## Code Fresh-eye Findings
Files read: js/main.js, js/tutorial.js, js/ui.js, js/career.js, js/events.js, js/research.js, js/production.js, js/state.js

1. **js/main.js:631 vs js/main.js:645** - checkDailyBonus() is called at line 631, BEFORE startTutorial() at line 645. Daily bonus adds +5 Papers to a new player 20 starting papers = total 25. The tutorial guard (tutorial.js:91) then fires papers > 20 and **skips the tutorial entirely for every new player**.

2. **js/tutorial.js:88-96** - The returning-player guard uses papers > 20 as one condition. But createDefaultState() gives papers: 20, and checkDailyBonus() (called before startTutorial()) bumps it to 25. This condition fires for brand-new players on day 1.

3. **js/ui.js:624-631** - checkTabUnlock() fires showUnlockFanfare(papers) when papers >= 10 and the sub-tab is still locked. Because isTutorialActive() returns false (tutorial was skipped due to bug #1), the modal fires unconditionally at the first gameLoop tick - blocking ALL editor interaction.

4. **js/career.js:163-165** - Career screen shows Rep/hr: -- | Need Orchestrator with no indication that taps (+1 rep) and compiles (+10 rep) also generate reputation. Players may think rep is entirely locked behind the Orchestrator upgrade.

5. **js/main.js:703-776** - renderEditorScreen() renders mission card + goals card + challenge area as top stack. During early game, 3 UI elements compete for attention with no clear visual hierarchy.

## Playtest Observations
Local server at http://localhost:8765, played as fresh new player.

1. **Research Unlocked! modal fires immediately** - before the player can tap the editor even once. Modal covers the entire code editor area. Player must find and click Lets Go! to proceed. (screenshot: play-01-start.png)

2. **After dismissing modal, tapping works correctly** - Flow meter showing 8/20 after 8 taps, editor animation advancing, +Code floating text visible. (screenshot: play-02-mid.png)

3. **Compile works and gives correct feedback** - 218 Compute from ~185 LoC, +1 Paper (compile bonus), mission updated to Buy Batch Size upgrade!, goals card showed Unlock Translator READY!. Core loop is functional once the modal friction is removed. (screenshot: play-03-end.png)

## Triangulation
Code review and Playtest produce perfectly consistent signal: the checkDailyBonus -> startTutorial ordering bug is confirmed by both. Code shows the exact lines causing the issue; Playtest shows the modal blocking 100% of new player interaction before they tap even once. GA is silent so contributes nothing. This is a deterministic UX failure affecting 100% of new players on their first session.

## Candidates Per Lens

### UI
- **Candidate**: Suppress competing top-stack elements (hint bar + mission + goals) to show only single highest-priority CTA / Score: 4/10 / Evidence: Playtest (3 elements compete at top), Code (renderEditorScreen layout)

### UX
- **Candidate**: Fix Research Unlocked modal blocking new players - reorder checkDailyBonus after startTutorial + remove fragile papers > 20 tutorial guard / Score: 9/10 / Evidence: Code (main.js:631 ordering, tutorial.js:91 guard), Playtest (modal confirmed blocking first interaction)

### 기획자
- **Candidate**: Show tap/compile rep rate on Career screen so players understand reputation accrues without Orchestrator / Score: 5/10 / Evidence: Code (career.js:163-165 shows -- with Need Orchestrator but omits tap/compile rep)

### 개발자
- **Candidate**: Fix root-cause ordering bug: move checkDailyBonus() after startTutorial() in startGame(), remove papers > 20 from tutorial guard / Score: 8/10 / Evidence: Code (main.js:631, tutorial.js:91), Playtest (confirmed trigger path)

### 게이머
- **Candidate**: Add reward hint to Challenge button (Challenge -> earns Papers + Compute) so players understand the incentive before clicking / Score: 6/10 / Evidence: Playtest (button prominent but reward not visible), Code (renderEditorScreen challenge area only shows cost, no reward)

## Lens Choice Reasoning
- UX: 9/10 implement
- 개발자: 8/10 implement (same code change as UX - unified into one commit)
- 게이머: 6/10 implement
- 기획자: 5/10 implement (borderline - adds useful context on career screen)
- UI: 4/10 skip (below threshold, secondary to blocking modal)

Last 5 iters: 게이머(9), 기획자(10), UX(11), 개발자(12). No repetition issue. UX + 개발자 co-selected justified - same deterministic bug, UX impact + code fix angles.

## Implementation Queue
| # | Lens | Title | Score | Files |
|---|---|---|---|---|
| 1 | UX/개발자 | Fix Research Unlocked modal: reorder checkDailyBonus + fix tutorial guard | 9/10 | js/main.js, js/tutorial.js |
| 2 | 게이머 | Add reward hint to Challenge button label | 6/10 | js/main.js |
| 3 | 기획자 | Show tap/compile rep rate on Career screen | 5/10 | js/career.js |

## Primary Improvement
**Lens**: UX / 개발자
**Title**: Fix Research Unlocked modal blocking new players (checkDailyBonus ordering + tutorial guard)
**Why**: Every new player on their first session sees a blocking Research Unlocked! modal before tapping the editor even once. Root cause: checkDailyBonus() at main.js:631 bumps papers from 20->25 before startTutorial() at line 645, triggering the papers > 20 returning-player guard in tutorial.js:91, which skips the tutorial. Without isTutorialActive()=true, checkTabUnlock() fires showUnlockFanfare(papers) unconditionally on the first gameLoop tick.

**Files to change**:
- js/main.js - move checkDailyBonus() call to after the startTutorial() block
- js/tutorial.js - remove gameState.papers > 20 from the returning-player guard

**Implementation sketch**:
1. In startGame(), move checkDailyBonus() to after if (gameState.tutorialStep < ...) { startTutorial(); }
2. In startTutorial() guard, keep only stats.totalCompiles > 0 and reputation > 0 - remove gameState.papers > 20 clause.

**Expected impact**:
- 단기(1h 후): New players tap editor immediately on load, tutorial runs correctly, first-30s friction eliminated
- 장기(1주 후): tutorial_step/user should increase; avg_session_sec should increase as early-game abandonment drops

**Rollback plan**: Revert main.js and tutorial.js - 2-line edits with zero data risk.

## Considered but Rejected
- **Option A - UI top-stack deduplication**: Real issue but secondary to modal blocking. Score 4/10 below threshold.
- **Option B - Change guard to papers > 30**: Fragile band-aid. Daily bonus value could change. Removing the condition is cleaner.
- **Option C - Suppress Research Unlocked fanfare for session 1**: Symptom fix only. Tutorial still broken. Root cause fix is correct.
