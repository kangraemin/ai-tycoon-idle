# Iter 18 Analysis (multi-lens)

_Generated: 2026-04-19_

## Snapshot Delta Table
| Metric | Current | Previous | Delta |
|---|---|---|---|
| activeUsers | 0 | 0 | 0 |
| newUsers | 0 | 0 | 0 |
| tutorial_step/user | N/A | N/A | N/A |
| avg_session_sec | N/A | N/A | N/A |

_GA completely silent. Both snapshots empty. 100% reliance on Code + Playtest._

## Top 3 GA Findings
1. No data — 0 active users.
2. No data — events/funnels empty.
3. No data — code + playtest is sole evidence base.

## Code Fresh-eye Findings
Files read: tutorial.js, hints.js, main.js, career.js, production.js, events.js, challenge.js, state.js

1. `js/tutorial.js:114` — `switchScreen('editor')` called synchronously before `getBoundingClientRect()` on `.editor-tab:last-child`. Spotlight positions against stale/wrong coords when coming from upgrade screen. Confirmed in playtest.
2. `js/hints.js:140` — `updateHintBanner()` has no `isTutorialActive()` guard. During tutorial, hint banner fires concurrently (e.g. both show compile guidance at step 2).
3. `js/hints.js:12-17` — compile-code hint: `loc >= 10 && compute < 10`. Mission 'compile' fires when `loc >= 10 && compute < 50`. Overlap at compute 0-10. Suppression only when `activeMission.screen` is truthy; 'compile' mission has `screen: null` — both show simultaneously.
4. `js/main.js:546-569` — `tokenTick()` always renders `N (mm:ss)` even at session start. Max tokens=10, start=5 — no capacity indicator. Appears as penalty timer.
5. `js/state.js:47` — `challengeStats.bestGrade` tracked but never surfaced in challenge button UI. Removes replay incentive.

## Playtest Observations
localhost:8765 fresh session:

1. **Tutorial step 7 spotlight wrong location** (screenshot: play-05-upgrade.png) — Coming from upgrade screen, step 7 fires switchScreen then positions spotlight. Screenshot: small blue box in upgrade card area, NOT on train.js tab. Bubble says 'Switch to train.js' but visual points elsewhere.
2. **Duplicate compile guidance** (screenshot: play-02-mid.png) — At tutorial step 2 (tap editor), hint banner AND mission card both say 'compile'. Two identical CTAs visible behind overlay dim.
3. **Token display ambiguous** (screenshot: play-01-start.png) — 'Tokens 5 (4:52)' with no max shown. Looks like a countdown penalty. '5/10' would clarify.
4. **Challenge button excellent** (screenshot: play-03-mid2.png) — 'Naming (Free (3 left))' + 'Win -> +Papers +Compute' clear. Iter 17 changes working well.
5. **Career goals anchor works early** — 'BugFarm 2%' in goals card after first compile. Long-term orientation from session start.

## Triangulation
GA silent. Code + playtest independently confirm top 2 issues: tutorial step 7 (deterministic, screenshot proof) and hint/mission duplication (visible in screenshots). Code review found 3 additional smaller improvements. Playtest strongest signal for primary; code drives supporting items.

## Candidates Per Lens

### UI
- **Candidate**: Token display 'N/10' format + hide countdown when at max / Score: 6/10 / Evidence: code (main.js:548) + playtest

### UX
- **Candidate**: Tutorial step 7 spotlight: currentScreen guard + setTimeout re-call / Score: 9/10 / Evidence: playtest confirmed (play-05-upgrade.png)
- **Candidate**: Hint banner isTutorialActive() guard / Score: 8/10 / Evidence: hints.js:140 + playtest

### 기획자
- **Candidate**: Suppress compile-code hint when mission 'compile' active (deduplicate CTA) / Score: 7/10 / Evidence: code overlap (hints.js:12 vs main.js:17) + playtest

### 개발자
- **Candidate**: switchScreen timing dependency — root cause of step 7 bug / Score: 9/10 / Evidence: same as UX primary

### 게이머
- **Candidate**: Show bestGrade on challenge button to reinforce replay / Score: 6/10 / Evidence: challengeStats.bestGrade unused in UI

## Lens Choice Reasoning
All >=5 in queue. Last 5 iters (13-17) covered all lenses — no rotation needed.

- UX/개발자 9/10: in queue — deterministic bug, confirmed in playtest.
- UX 8/10: in queue — tutorial clarity, 3-line fix.
- 기획자 7/10: in queue — compile message de-duplication.
- UI 6/10: in queue — token display clarity.
- 게이머 6/10: in queue — challenge replay incentive.

## Implementation Queue

| # | Lens | Title | Score | Files |
|---|---|---|---|---|
| 1 | UX/개발자 | Tutorial step 7: currentScreen guard + setTimeout for layout reflow | 9/10 | `js/tutorial.js` |
| 2 | UX | Hint banner: isTutorialActive() suppress during tutorial | 8/10 | `js/hints.js` |
| 3 | 기획자 | Suppress compile-code hint when mission 'compile' active | 7/10 | `js/hints.js` |
| 4 | UI | Token display: 'N/10' + hide countdown when tokens=max | 6/10 | `js/main.js` |
| 5 | 게이머 | Challenge button: show bestGrade after first play | 6/10 | `js/main.js`, `js/state.js` |

## Primary Improvement
**Lens**: UX / 개발자
**Title**: Tutorial step 7 spotlight timing fix
**Why**: tutorial.js:114 calls switchScreen('editor') then immediately getBoundingClientRect on .editor-tab:last-child. When entering step 7 from upgrade screen, spotlight positions at wrong coords. Playtest (play-05-upgrade.png) confirms: blue box in upgrade card area, not on train.js tab. Affects 100% of new players who reach tutorial step 6 on upgrade screen.
**Files to change**: js/tutorial.js
**Implementation sketch**: In showTutorialStep(), add guard before spotlight positioning:
```javascript
if (s.id === 'train-tab' && typeof switchScreen === 'function') {
    if (typeof currentScreen !== 'undefined' && currentScreen !== 'editor') {
        switchScreen('editor');
        setTimeout(() => showTutorialStep(step), 50);
        return; // re-called after reflow; currentScreen='editor' prevents loop
    }
}
```
**Expected impact**:
- 단기(1h 후): 100% of step-7 players see correct train.js tab spotlight
- 장기(1주 후): Tutorial completion up; more players discover train.js -> papers -> research loop
**Rollback plan**: Revert js/tutorial.js. No game state changes.

## Considered but Rejected
- **Option A — Full hint system mission-aware refactor**: Too broad. Queue items 2+3 achieve 80% benefit with targeted fixes.
- **Option B — Add train.js tutorial step**: Would extend tutorial to 11 steps. Rejected: players start with 20 papers, can research without training; current 10 steps sufficient.
