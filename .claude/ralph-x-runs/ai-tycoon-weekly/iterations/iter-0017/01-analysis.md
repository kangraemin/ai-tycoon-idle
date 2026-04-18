# Iter 17 Analysis (multi-lens)

_Generated: 2026-04-19_

## Snapshot Delta Table
| Metric | Current (T1951) | Previous (T1841) | Delta |
|---|---|---|---|
| activeUsers | 0 | 0 | 0 |
| newUsers | 0 | 0 | 0 |
| tutorial_step/user | N/A | N/A | N/A |
| challenge_complete_rate | N/A | N/A | N/A |
| upgrade_purchase/user | N/A | N/A | N/A |
| avg_session_sec | N/A | N/A | N/A |
| (all sections empty — GA completely silent) | | | |

## Top 3 GA Findings
1. Both snapshots (T1841 and T1951) return empty arrays for all sections — no traffic in the 1d window
2. GA is contributing 0 signal for iter 17 — all analysis comes from Code + Playtest
3. Clarity.ms tracking is embedded (index.html:26-30) but data not accessible via snapshot script

## Code Fresh-eye Findings
Files reviewed: tutorial.js, career.js, production.js, main.js, events.js, ui.js, state.js, index.html

1. `main.js:14-43 + 80-108` — `getCurrentMission()` and `getNextGoalItems()` are independent systems. When compute >= 100 (Translator cost), Goals shows "Unlock Translator READY!" while Mission shows "Buy Batch Size (50 compute)" — two conflicting CTAs simultaneously visible. No coordination between the two systems.

2. `main.js:708-730` — Challenge area is rendered as the *first* element inside `.code-editor` in `renderEditorScreen()`, above the tab bar and editor body. The green "Challenge (Free (3 left))" btn-primary button is visually dominant. No tutorial step teaches challenges — only a passing mention in the final tutorial modal text.

3. `index.html:65` — `compile-btn-mini` always says "Compile" regardless of active editor tab. When on train.js, compiling produces Papers not Compute (`production.js:101-116`), but button gives zero visual indication of this mode change.

4. `career.js:25-43` — `getRepRate()` returns null when Orchestrator=0, causing "Advance In" to show `--` for all new players. No fallback estimate for manual tap/compile rep rate despite clear constants: +5 Rep/tap, +50 Rep/compile.

5. `state.js:10` — Default `papers: 20`. Combined with early achievements (Hello World = +2 papers at 10 taps), new players reach papers >= 10 quickly without going through train.js tab. Mission system handles this correctly at `main.js:26` but it means some mission steps are skipped.

## Playtest Observations
Local server at http://localhost:8765. Fresh localStorage state (prior cached session data from testing).

1. **Tutorial fires at step 1, game starts with papers=25** (screenshot: play-01-start.png). Top bar shows all 5 currencies. Welcome modal appears correctly. Tutorial progression feels smooth after 16 iters of fixes.

2. **After first compile (compute=112): Mission = "Buy Batch Size", Goals = "Unlock Translator READY!"** (screenshot: play-02-mid.png). Both are visible simultaneously on the editor screen. The Goals card shows a green "READY!" badge with urgency styling, competing directly with the Mission card's step-by-step guide. Player has no clear hierarchy for which to follow first.

3. **Challenge button dominates the editor screen visually** (screenshot: play-03-end.png). It appears above the code content, styled as btn-primary (green), labeled "Challenge (Free (3 left))". No context about what a challenge involves until clicking. The "Win → +Papers +Compute" hint below is easy to miss.

## Triangulation
GA is completely silent — zero signal from analytics. Code review and Playtest converge strongly on the same root issue: **mid-game guidance failure after first compile**. Playtest confirmed the Mission/Goals conflict in exactly one compile. Code review identified 4 additional issues (challenge prominence, compile mode ambiguity, manual rep rate display, challenge discoverability). Code is the dominant signal this iter; Playtest validates it. No GA signal to weigh against.

## Candidates Per Lens

### UI
- **Candidate**: Move Challenge area below editor body (currently first element above tab bar) — Score: 7/10 / Evidence: Playtest (play-03-end.png, challenge btn most prominent element), Code (main.js:708-710)

### UX
- **Candidate**: Dynamic compile button label showing current output mode ("→ Compute" or "→ Papers") based on active tab — Score: 7/10 / Evidence: Code (production.js:101-116 silent mode switch, index.html:65 static label), Playtest (no visual diff between tab modes)

### 기획자
- **Candidate**: Fix Mission/Goals card guidance conflict — reorder `getNextGoalItems()` to Career > GPU > Model-unlock, suppress model-unlock from Goals when Mission is guiding earlier steps — Score: 8/10 / Evidence: Playtest (play-02-mid.png confirms conflict), Code (main.js:14-43, 80-108)

### 개발자
- **Candidate**: Add manual rep rate estimate to Career "Advance In" — when Orchestrator=0, show estimated time based on a 1,500 Rep/hr baseline (30 compiles/hr × 50 Rep) instead of `--` — Score: 6/10 / Evidence: Code (career.js:25-43, getRepRate returns null for all new players)

### 게이머
- **Candidate**: Challenge discoverability — add one-time hint banner after tutorial completion pointing to challenge, show challenge type name on button — Score: 6/10 / Evidence: Playtest (challenge btn visible but unexplained), Code (no tutorial/mission step for challenges)

## Lens Choice Reasoning
All 5 candidates score >= 5, all go to implementation queue. Last 5 iters (12-16) covered all lenses; no single lens is overrepresented. Anti-stagnation: pick based on impact scoring, not rotation. 기획자 (8) is Primary — deterministic mid-game friction hitting every player post-tutorial. UI (7) and UX (7) are fast-wins with high player surface area. 개발자 (6) and 게이머 (6) address specific UX gaps.

## Implementation Queue

| # | Lens | Title | Score | Files (예상) |
|---|---|---|---|---|
| 1 | 기획자 | Fix Mission/Goals card guidance conflict | 8/10 | `js/main.js` |
| 2 | UI | Move Challenge area below editor body | 7/10 | `js/main.js` |
| 3 | UX | Dynamic compile button mode label | 7/10 | `index.html`, `js/main.js` |
| 4 | 개발자 | Manual rep rate estimate in Career Advance In | 6/10 | `js/career.js` |
| 5 | 게이머 | Challenge discoverability: hint after tutorial + type label | 6/10 | `js/main.js`, `js/tutorial.js` |

## Primary Improvement (점수 가장 높은 것 상세)
**Lens**: 기획자
**Title**: Fix Mission/Goals card guidance conflict
**Why**: After the first compile (~112 compute), getCurrentMission() returns "Buy Batch Size" (cost: 50) while getNextGoalItems() shows "Unlock Translator READY!" (cost: 100). Two competing CTAs with different priorities create decision paralysis at the most critical moment — the transition from tutorial to free play. Root cause: getNextGoalItems() always puts cheapest locked model first, independent of mission progress.
**Files to change**: `js/main.js`
**Implementation sketch**:
In `getNextGoalItems()`, reorder to Career progress first, GPU second, model-unlock third. Additionally suppress model-unlock from Goals when current mission is one of the early-phase missions (tap/compile/batch/train/research/gpu) — these already guide the player toward models. Only include model-unlock goal when getCurrentMission()?.id is "unlock-*" or null (player has completed basic loop). This way Goals always shows macro targets (career advance, GPU) while Mission handles step-by-step.
**Expected impact**:
- 단기(1h 후): Players post-tutorial see Career Rep progress as the primary Goal. No competing CTA with Mission card.
- 장기(1주 후): Mid-game retention improves as players have a clear long-term anchor (career advance) separate from tactical mission steps.
**Rollback plan**: getNextGoalItems() is pure display logic — revert means restoring original array order

## Considered but Rejected
- **Option A — Tutorial guard add  check**: papers=25 in playtest came from prior cached localStorage achievements, not a bug in tutorial guard logic. Guard correctly lets true new players (papers=20 default, totalCompiles=0, rep=0) see the tutorial. Score < 5.
- **Option B — Remove Goals Card entirely**: Eliminates the conflict but also removes macro-goal visibility that helps players understand long-term progression. Score 3/10 — too destructive for a feature players benefit from once the ordering is fixed.
