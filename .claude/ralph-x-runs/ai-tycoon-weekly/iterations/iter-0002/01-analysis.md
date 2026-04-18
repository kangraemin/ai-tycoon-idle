# Iter 2 Analysis — UX

_Generated: 2026-04-18_

## Snapshot Delta Table
| Metric | Current | Previous | Delta |
|---|---|---|---|
| activeUsers | N/A | 45 | N/A (GA empty) |
| newUsers | N/A | N/A | N/A |
| tutorial_step/user | N/A | 2.00 | N/A |
| challenge_complete_rate | N/A | N/A | N/A |
| upgrade_purchase/user | N/A | N/A | N/A |
| avg_session_sec | N/A | N/A | N/A |

_Both 0942 and 0915 snapshots returned all-empty arrays. GA signal absent this iter — Code + Playtest carry full weight._

## Top 3 GA Findings
1. No data in 1-day window — GA API returned empty sections for all metrics
2. Baseline from iter 1: activeUsers=45, tutorial_step/user=2.00 (most users drop before step 3)
3. Iter 1 delta unavailable — snapshot comparison not possible with empty current snapshot

## Code Fresh-eye Findings
Files: js/state.js, js/ui.js, js/tutorial.js, js/production.js

1. `js/state.js:10` — papers: 20 in createDefaultState(). New players start with 20 Papers, already exceeding the Research unlock threshold of 10. Research is unlocked before the player knows what it is.

2. `js/ui.js:565-569` — checkTabUnlock() runs every 2s. Since new players start with 20 papers >= 10, it calls showUnlockFanfare('papers') within 2 seconds of game start — exactly during the tutorial welcome modal.

3. `js/ui.js:527-542` — showUnlockFanfare() has no isTutorialActive() check. It unconditionally calls showModalHtml('New Feature!', ...), stacking a second modal on top of whatever the tutorial is showing.

4. `js/tutorial.js:95-112` — Spotlight bubble is always left: 50% centered. For elements at screen edges (compile button, top-right), the spotlight highlight and the instruction bubble have no visual connection.

## Playtest Observations

1. Game loads showing two competing modals: Tutorial welcome (Step 1 of 10) is behind "New Feature! Research Unlocked!" modal. New player must dismiss Research modal first, then reads tutorial. Modal-on-modal is literally the first UX a new player sees. (screenshot: play-01-start.png)

2. Tutorial Step 2 editor spotlight is clear (blue border on editor area). The bubble positioning is correct but the progress bar added in iter-1 is visible and working. (screenshot: play-02-mid.png)

3. Tutorial Step 3 Compile spotlight: bubble is centered at mid-screen, but the Compile button is highlighted at top-right corner. The arrow-up element exists but is too subtle to establish visual connection between the centered instruction and the target at the edge. (screenshot: play-03-end.png)

## Triangulation
GA signal is fully absent this iteration. Analysis rests on Code (B) and Playtest (C), which strongly converge on the same issue. Code review reveals the mechanical root cause (papers:20 triggers Research unlock fanfare within 2s of game start). Playtest confirms the exact user experience: Research modal stacks over tutorial welcome. This is the first frame every new player sees. The iter 1 baseline (tutorial_step/user=2.0) is consistent — users who hit a confusing double-modal on step 1 are more likely to skip or quit. Code signal is strongest here: the bug is deterministic and affects 100% of new players.

## Perspective Rotation Reason
This iteration's perspective is UX — flow friction, tutorial dynamics, click clarity, feedback visibility. The playtest uncovered that the very first seconds of onboarding are broken by an unsuppressed unlock modal interrupting the tutorial. This is squarely a UX problem: the tutorial flow assumes it controls the modal stack, but checkTabUnlock() injects a system modal asynchronously without checking tutorial state. The iter 1 baseline (tutorial_step/user=2.0) is consistent with this: the double-modal confusion on step 1 is a plausible explanation for why most users don't make it past step 2.

## Selected Improvement
**Title**: Suppress unlock fanfare modals during active tutorial to eliminate modal-on-modal collision

**Why**: New players start with papers:20 (> 10 threshold), causing checkTabUnlock() to call showUnlockFanfare('papers') within 2 seconds of game start while the tutorial welcome modal is open. Every single new player hits this. Suppressing unlock fanfares during tutorial removes the collision without touching game balance or the unlock system for returning players.

**Files to change**:
- js/ui.js — showUnlockFanfare() at line 527: add tutorial-active guard

**Implementation sketch**:
In showUnlockFanfare(), after the shownUnlockModals.includes(key) guard, add:
```
if (typeof isTutorialActive === 'function' && isTutorialActive()) {
  gameState.shownUnlockModals.push(key);
  if (typeof saveGame === 'function') saveGame();
  return;
}
```
Mark as shown (so it won't re-fire post-tutorial) but skip the modal. The Research tab itself still unlocks (sub-tab-locked class is removed by checkTabUnlock). Tutorial steps 8-9 guide users to Research explicitly, so the fanfare is redundant and harmful during tutorial.

**Expected impact**:
- Short-term (1h): 0% of new players hit modal-on-modal collision. Tutorial flow is uninterrupted from step 1.
- Long-term (1 week): tutorial_step/user should increase from 2.0 baseline toward 4+, as the step-1 friction is removed.

**Rollback plan**: Revert the 3-line guard in showUnlockFanfare(). Zero behavioral risk — only effect of reverting is restoring the double-modal.

## Considered but Rejected
- **Option A — Reduce initial papers to 0**: Would remove root cause, but breaks tutorial step 9 which requires Research to be unlocked. Would require redesigning tutorial paper rewards. Scope too large for one iter.
- **Option B — Fix spotlight bubble horizontal positioning for edge targets**: Real issue (Compile spotlight bubble centered while button is top-right), but secondary severity. Only affects step 3 mildly. The double-modal collision at step 1 affects 100% of new players and is higher priority.
