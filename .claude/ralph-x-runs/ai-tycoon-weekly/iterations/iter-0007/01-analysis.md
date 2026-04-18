# Iter 7 Analysis (multi-lens)

_Generated: 2026-04-18_

## Snapshot Delta Table
| Metric | Current (1d) | Previous (7d) | Delta |
|---|---|---|---|
| activeUsers | 0 | 1 | -1 (-100%) |
| newUsers | 0 | 1 | -1 |
| tutorial_step/user | N/A | N/A | no game events |
| challenge_complete_rate | N/A | N/A | no game events |
| upgrade_purchase/user | N/A | N/A | no game events |
| avg_session_sec | 0 | 2.29 | -2.29 |
| Only visitor: Cyprus / desktop, 2.29s, 0 game events | — | — | bounce |

## Top 3 GA Findings
1. **Zero game events from the only known user** — the single Cyprus visitor (2026-04-14) had 0 game events despite 2.29s session. Page loaded but no tap/compile/upgrade fired.
2. **All sessions from direct traffic** — no referral signal yet. Traffic is essentially zero, so GA signal is noise.
3. **Zero engagement duration** — `userEngagementDuration=0` despite 2.29s session means GA did not register the page as "engaged". The user never interacted.

GA is too sparse to derive meaningful deltas. Code + Playtest are the primary signals this iteration.

## Code Fresh-eye Findings

Files reviewed: `js/tutorial.js`, `js/ui.js` (L213-600), `js/main.js` (L620-650), `js/events.js`, `js/career.js`, `js/production.js`, `js/upgrade.js`, `css/style.css`

1. `js/main.js:629` vs `js/main.js:644` — `checkDailyBonus()` is called 15 lines BEFORE `startTutorial()`. This means the Daily Bonus modal fires via `showModalHtml()` while `tutorialWasActive=false`, so the tutorial-aware guard inside `showModalHtml` does not fire. Then `startTutorial()` shows `#tutorial-overlay`. Both overlays (modal + tutorial) are active simultaneously.

2. `js/ui.js:538-570` — `checkDailyBonus()` has no guard against active tutorial state. `showUnlockFanfare()` at line 582-585 correctly checks `isTutorialActive()` and returns early, but `checkDailyBonus()` never does this check. Structural inconsistency between the two modal-triggering functions.

3. `js/tutorial.js:112` — Tutorial modal steps (modal type) use `#tutorial-overlay` + `#tutorial-bubble`, while `showModalHtml` uses `#modal-overlay`. Both can be active simultaneously with no mutual exclusion guard at the overlay level.

4. `js/career.js:3-13` — Career stages look balanced. First prestige (BugFarm) requires 10,000 Rep. From playtest: starting compute is 63 after first compile, first upgrade costs 50. Economy curve is reasonable.

5. `js/events.js:260-271` — Flow State triggers at 20 consecutive taps. Hidden mechanic — no discovery path for new users. The flow meter is visible, but new users will not know 20 taps = reward.

## Playtest Observations

All 3 screenshots captured at `.claude/ralph-x-runs/ai-tycoon-weekly/iterations/iter-0007/`.

1. Tutorial Step 1 modal ("Welcome to AI Tycoon!") renders cleanly over a dimmed background. No issues at this stage. (screenshot: play-01-start.png)

2. **CRITICAL BUG**: Tutorial Step 4 modal ("Your AI Models Auto-Code!") AND Daily Bonus modal ("Day 1 +5 Papers / Collect!") are BOTH visible simultaneously. The Daily Bonus calendar/Collect button bleeds below the tutorial modal within the same dark overlay space. User sees two competing CTAs: "Nice!" (tutorial) vs "Collect!" (daily bonus). Extremely confusing for a new player. (screenshot: play-02-mid.png)

3. Same double-modal state persists. Tutorial is stuck at Step 4 because `#modal-overlay` (Daily Bonus) is competing with `#tutorial-overlay`. Navigation attempts to `[data-screen="upgrade"]` timed out — likely because the overlapping overlays block click-through. (screenshot: play-03-end.png)

## Triangulation

GA is silent (0 users in past 24h, only 1 ever with zero game events). Code review identified the root cause: `checkDailyBonus()` fires unconditionally before `startTutorial()` in main.js, creating a structural race condition that affects 100% of new users on day 1. Playtest confirmed the bug is reproducible and visually jarring — two competing modals render simultaneously at Tutorial Step 4. **Playtest + Code are the dominant signals.** GA merely corroborates that users are not getting past the first session, consistent with this friction.

## Candidates Per Lens

### UI
- **Candidate**: Polish currency display — add LoC/s rate display in top bar / Score: 4/10 / Evidence: playtest — top bar shows "2/s" but contextually unclear without label; very minor

### UX
- **Candidate**: Suppress Daily Bonus modal during tutorial — show papers silently (toast) and skip `showModalHtml` if tutorial not complete / Score: 9/10 / Evidence: Playtest (play-02-mid.png) + Code (main.js:629 vs 644 ordering)

### 기획자
- **Candidate**: Flow State mechanic is invisible — add a one-time tooltip "Tap 20 times fast for a bonus!" when user first reaches 5/20 / Score: 6/10 / Evidence: Code (events.js:261) — mechanic exists but discovery relies on accident

### 개발자
- **Candidate**: Guard `checkDailyBonus()` with `tutorialStep < TUTORIAL_STEPS.length` check, consistent with `showUnlockFanfare()` pattern / Score: 8/10 / Evidence: Code (ui.js:582 has the pattern; checkDailyBonus at 538 lacks it)

### 게이머
- **Candidate**: Tutorial step 4 "Your AI Models Auto-Code!" is informational but disconnects from action — add an idle LoC counter that visibly ticks during the modal to show passive income in real-time / Score: 5/10 / Evidence: Playtest — models panel visible in background but not highlighted

## Lens Choice Reasoning

Recent 5 iters: Iter2=UX, Iter3=기획자, Iter4=개발자, Iter5=게이머, Iter6=UI. No lens appears 3+ consecutive times. UX was last used 5 iters ago.

The Daily Bonus / Tutorial collision scores 9/10 under UX and 8/10 under 개발자. Both lenses see it, but the user experience impact — two competing call-to-action buttons for a brand new player at Tutorial Step 4 — is fundamentally a UX breakdown, not just a code quality issue. UX is the right primary lens: the fix resolves flow friction for 100% of day-1 users.

## Selected Improvement

**Lens**: UX
**Title**: Suppress Daily Bonus modal during tutorial — defer to toast
**Why**: `checkDailyBonus()` is called before `startTutorial()` in main.js; it lacks the `isTutorialActive()` guard that `showUnlockFanfare()` already uses. This causes Daily Bonus modal to overlap Tutorial Step 4 for every new player on day 1. The fix ensures papers are still granted immediately but the modal is deferred — shown as a toast during tutorial, or as a normal modal if tutorial is already complete (returning players).
**Files to change**:
- `js/ui.js` — add tutorial guard inside `checkDailyBonus()` (around line 568, before `showModalHtml` call)

**Implementation sketch**:
In `checkDailyBonus()`, after computing papers + updating state, before the `showModalHtml` call:
```js
if (gameState.tutorialStep < (typeof TUTORIAL_STEPS !== "undefined" ? TUTORIAL_STEPS.length : 10)) {
  if (typeof showToast === "function") showToast("+${papers} Papers (Daily Bonus)", "success");
  return;
}
```
This mirrors the `isTutorialActive()` pattern in `showUnlockFanfare()` but uses persistent state check because `isTutorialActive()` returns false at startup.

**Expected impact**:
- 단기(1h 후): New users no longer see double-modal at Tutorial Step 4. Tutorial navigation clicks stop timing out.
- 장기(1주 후): tutorial_step/user metric increases past 4; avg_session_sec increases from 2.29s baseline

**Rollback plan**: Revert single `if` block in `checkDailyBonus()`. Papers already granted are not affected.

## Considered but Rejected

- **Option A — Flow State tooltip for discoverability**: Low urgency — the flow meter visual exists; adding a tooltip is nice polish but does not fix a blocking bug. Score 6/10 vs 9/10.
- **Option B — Move `checkDailyBonus()` call to after `startTutorial()` in main.js**: Order change alone is insufficient without the guard — both would still fire synchronously and both overlays would still compete.
