# Iter 21 Analysis (multi-lens)

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

GA completely silent (both snapshots 2026-04-18T1841 and 2026-04-18T1951 empty for 1-day window).

## Top 3 GA Findings
1. GA still 0 users (consistent since iter 16)
2. No challenge/compile/career/fusion events to analyze
3. Falling back entirely to Code + Playtest signals (B+C fully authoritative)

## Code Fresh-eye Findings
Files read: challenge.js, career.js, production.js, main.js, events.js, fusion.js, research.js, model.js, achievements.js, hints.js, offline.js, ui.js

1. js/hints.js:161-165 - updateHintBanner() suppresses hint when activeMission.screen is truthy. try-fusion hint (fires when owned>=2 models) suppressed by research/gpu/unlock-X/promote missions. Fusion hint almost never visible in practice.

2. js/main.js:78-114 - getNextGoalItems() shows career progress + GPU + next model unlock. Fusion completely absent from goals card even when chatbot+translator owned and first fusion available at 300 compute.

3. js/career.js:24-31 - getRepRate() returns Math.round(firesPerHour * 10). Actual rep per compile = Math.ceil(50 * prestigeMultiplier). At NullPointer: correct = 414x50 = 20700/hr, function returns 4140. Off by 5x. Advance In estimate shows 5x too long for Orchestrator users.

4. js/ui.js:618 - Career nav unlocks at reputation>=5000. First career advance threshold is 2000 rep. Mission CTA navigates to career at 2000 rep via switchScreen bypass, but nav button stays locked until 5000 rep. Confusing inconsistency.

5. js/research.js:22-38 - First-pull pity guarantees 70% uncommon/30% rare but not shown on research screen. Players only see standard rates C40/U30/R20/E8/L2.

6. js/main.js (renderFusionScreen) - Fusion recipes show no per-recipe ownership status. No indicator which models you need to get to unlock a recipe.

## Playtest Observations
State: 25 papers, 0 compute, tutorialStep=0, totalCompiles=0, rep=0 (stale save). localhost:8765.

1. Tutorial fires (tutorialActive=true) with 25 papers. Guard only checks totalCompiles>0||rep>0 - both false. Welcome modal appeared. Career screen showed tutorial overlay at bottom. (screenshot: play-01-start.png)

2. Mission card correctly guided: Compile->Buy Batch Size. Goals card showed BugFarm 2% (50/2K rep). Mission guidance correct for new players. (screenshot: play-02-mid.png)

3. Career screen: Rep/hr 1.50K~ (manual estimate, no Orchestrator), Advance In ~1.3h. Career path timeline (NullPointer->Founder) displayed clearly. Fusion sub-tab still locked (needed 2 models). (screenshot: play-03-career.png)

## Triangulation
GA dead. Code review was strongest signal: 4 concrete fixable issues (hint suppression, missing fusion goal, getRepRate formula 5x off, career nav threshold). Playtest confirmed tutorial guard edge case and validated primary mission routing. Both converge on fusion discoverability as the primary systemic gap.

## Candidates Per Lens

### UI
- **Candidate**: Show first-pull pity guarantee on research screen / Score: 6/10 / Evidence: code (research.js:22-38 pity logic exists but undisplayed)

### UX
- **Candidate**: Lower career nav unlock 5000->2000 rep / Score: 7/10 / Evidence: code (ui.js:618 vs career.js 2000 advance threshold), playtest: nav locked while mission CTA works via bypass

### 기획자
- **Candidate**: Add fusion goal to getNextGoalItems() + fix hint suppression / Score: 8/10 / Evidence: code (main.js no fusion in goals, hints.js try-fusion suppressed), playtest: fusion tab exists but zero persistent guidance

### 개발자
- **Candidate**: Fix getRepRate() formula x10 -> x50xprestige / Score: 6/10 / Evidence: code (career.js:30 5x wrong for Orchestrator users)

### 게이머
- **Candidate**: Fusion screen per-recipe ownership status with ingredient hints / Score: 7/10 / Evidence: code (no ownership feedback in fusion render), playtest: fusion tab shows but no recipe discoverability

## Lens Choice Reasoning
All 5 score >= 5; all in queue. 기획자 primary at 8/10. Last 5 iters: iters 19+20 were 기획자 (2 consecutive, not 3). Anti-stagnation rule not triggered. This iter targets fusion discovery — a systemic content gap not addressed by prior iters (which focused on rep/challenge scaling, career display fixes).

## Implementation Queue

| # | Lens | Title | Score | Files |
|---|---|---|---|---|
| 1 | 기획자 | Add fusion goal to getNextGoalItems() + fix hint suppression | 8/10 | js/main.js, js/hints.js |
| 2 | 게이머 | Fusion screen per-recipe ownership status | 7/10 | js/main.js |
| 3 | UX | Lower career nav unlock 5000->2000 rep | 7/10 | js/ui.js |
| 4 | 개발자 | Fix getRepRate() formula x10 -> x50xprestige | 6/10 | js/career.js |
| 5 | UI | Show first-pull pity guarantee on research screen | 6/10 | js/main.js |

## Primary Improvement
**Lens**: 기획자
**Title**: Add fusion goal to getNextGoalItems() + fix hint suppression
**Why**: Fusion is a core mid-game mechanic (7 recipes, +500 rep/fusion, model power boost) completely invisible in goals card. try-fusion hint suppressed by any active mission with screen CTA. Player with chatbot+translator can fuse at 300 compute but has zero persistent guidance toward it.
**Files to change**: js/main.js (getNextGoalItems), js/hints.js (updateHintBanner suppression)
**Implementation sketch**:
In getNextGoalItems() after GPU slot item, add:
  if (gameState.discoveredFusions.length === 0 && typeof FUSION_RECIPES !== undefined) {
    const availableRecipe = FUSION_RECIPES.find(r => {
      const a = getModelState(r.inputs[0]); const b = getModelState(r.inputs[1]);
      return a && b && a.count > 0 && b.count > 0;
    });
    if (availableRecipe) {
      items.push({ key: fusion-first, icon: merge, label: Try Fusion!,
        getCurrent: () => gameState.compute, required: getFusionCost(availableRecipe),
        screen: fusion, color: var(--accent) });
    }
  }
In updateHintBanner() hints.js:161: change suppression from activeMission.screen to activeMission.screen && activeMission.screen === hint.screen (only suppress if pointing same destination).
**Expected impact**:
- Short term (1h): Players with chatbot+researched_translator see Try Fusion! in goals card
- Long term (1wk): Fusion completion events appear in GA; +500 rep/fusion accelerates career progression
**Rollback plan**: Revert getNextGoalItems() fusion item + revert hint suppression logic

## Considered but Rejected
- **Option A - Tutorial guard papers>20**: Only affects corrupted/stale saves. Real new players start at exactly 20 papers. Score 4/10.
- **Option B - Daily bonus compute scaling**: Daily papers have value throughout game. Not critical. Score 4/10.
