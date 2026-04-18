# Iter 22 Analysis (multi-lens)

_Generated: 2026-04-19_

## Snapshot Delta Table
| Metric | Current | Previous | Delta |
|---|---|---|---|
| activeUsers | 0 | 0 | 0 (silent) |
| newUsers | 0 | 0 | 0 |
| tutorial_step/user | N/A | N/A | N/A |
| challenge_complete_rate | N/A | N/A | N/A |
| upgrade_purchase/user | N/A | N/A | N/A |
| avg_session_sec | N/A | N/A | N/A |
| gachaPulls | N/A | N/A | N/A |

GA completely silent across all 1-day snapshots through 2026-04-19. No traffic data.

## Top 3 GA Findings
1. 0 active users across all 1-day windows
2. All event counts null
3. No device or country data

## Code Fresh-eye Findings
Files read: research.js, career.js, production.js, fusion.js, main.js (lines 980-1010, 860-930)

1. research.js:22 - First-pull pity (gachaPulls === 0) is one-time-ever, not per-prestige. doCareerAdvance() resets models to count=0 but never resets gameState.stats.gachaPulls. Post-prestige players get no pity guarantee on rebuild.

2. research.js:91-131 - When GPU slots are full, the Research button is still rendered active (with GPU full hint below). Clicking triggers 1.5s spinner then auto-redirects. Dead-end flow.

3. research.js:194 - On duplicate pull, reveal text is "Duplicate - now x{count}" with no follow-up action. Level up requires 5 steps: close reveal, nav to Models, find card, tap, tap Level Up.

4. main.js:990-1004 - canLevelUp = model.count >= 2 && compute >= levelUpCost already implements same-fusion in model detail modal. Logic exists but buried behind navigation.

5. career.js:105 - gameState.papers += 10 * careerHistory.length awards papers on advance but shows no toast. Player has no idea how many papers they received.

6. research.js:127 - Pity guarantee banner hides after first pull. No mechanism to show it again after career advance, even though model collection has fully reset.

## Playtest Observations
Headless browser failed with macOS sandbox FATAL error. Playtest conducted via source code + logic simulation.

1. Research reveal dead moment: After pulling a duplicate, only a "Research!" re-pull button shown. No action for the duplicate. Players must navigate 5 steps to act on clear intent. (research.js:194-205)

2. GPU full friction: Research button stays active at GPU capacity. Clicks trigger 1.5s spinner then redirect. CTA should replace the button entirely. (research.js:91-110)

3. Post-prestige pity gap: After career advance, models reset but gachaPulls never resets. First post-prestige research pull uses regular rates despite player rebuilding from scratch. (research.js:22, career.js:doCareerAdvance)

## Triangulation
GA completely silent - zero signal. All analysis weight on Code (B) and simulated Playtest (C). Both produce consistent signals: the research/gacha loop has three discrete friction points that compound. Strongest signal from Code review (B); Playtest (C) confirms through logic simulation.

## Candidates Per Lens

### UI
- Candidate: Research rates panel - add owned/total model count badges per rarity tier / Score: 6/10 / Evidence: Code - rates section only shows % numbers

### UX
- Candidate: GPU full -> replace Research button with "Expand GPU!" CTA / Score: 7/10 / Evidence: Code (research.js:91-110)

### 기획자
- Candidate: Show toast with actual papers earned on career advance / Score: 5/10 / Evidence: Code (career.js:105)

### 개발자
- Candidate: Reset gachaPulls to 0 on career advance (per-prestige pity) / Score: 6/10 / Evidence: Code (career.js:doCareerAdvance vs research.js:22)

### 게이머
- Candidate: "Level Up!" shortcut button in research reveal when duplicate rolled and compute sufficient / Score: 8/10 / Evidence: Code (main.js:990 has logic, research.js:194 lacks shortcut) - 5-step action collapsed to 0 navigation

## Lens Choice Reasoning
Recent 5-iter primaries: 17=기획자, 18=UX/개발자, 19=기획자, 20=기획자, 21=기획자. Anti-stagnation rule triggered: 기획자 used 3 consecutive iters (19-21). 기획자 candidate (5/10) at exactly threshold - included in queue but not as primary per rotation rule. 게이머 (8/10) clear primary. UX (7/10), 개발자 (6/10), UI (6/10) all pass threshold cleanly.

## Implementation Queue
| # | Lens | Title | Score | Files |
|---|---|---|---|---|
| 1 | 게이머 | Level Up shortcut in research reveal for duplicates | 8/10 | js/research.js |
| 2 | UX | GPU full -> Expand GPU CTA replaces Research button | 7/10 | js/research.js |
| 3 | 개발자 | Reset gachaPulls on career advance (per-prestige pity) | 6/10 | js/career.js |
| 4 | UI | Research rates - add owned/total model count per rarity | 6/10 | js/research.js |
| 5 | 기획자 | Career advance toast with actual papers bonus amount | 5/10 | js/career.js |

## Primary Improvement
**Lens**: 게이머
**Title**: Level Up shortcut button in research reveal on duplicate pull
**Why**: After pulling a duplicate model, player has clear intent but must navigate 5 steps to act. Adding inline "Level Up! (N Compute)" button collapses this to 0 navigation steps. Classic idle/merge game pattern: reveal -> instant reward. Logic already exists in doSameFusion() and main.js:990.
**Files to change**: js/research.js
**Implementation sketch**:
- In doResearchPull() setTimeout callback, after building duplicate reveal HTML: check if result.newCount >= 2
- Compute levelUpCost via getModelLevelUpCost(result.modelId)
- If compute sufficient: render btn-primary "Level Up! (N Compute)" calling doSameFusion(result.modelId) then re-render reveal with +Lv.X confirmation
- If compute insufficient: render disabled "Level Up (need N Compute)" to show option exists
- Button appears below rarity-reveal card, above Research re-pull button
**Expected impact**:
- Short-term: Players who get duplicates see immediate action path -> longer sessions
- Long-term: Research loop feels more rewarding (pull -> level up -> stronger model), reducing early drop-off
**Rollback plan**: Button is additive HTML in reveal card. Removing it restores original behavior.

## Considered but Rejected
- Option A - Research bulk-pull (10x): Requires significant UI work + pity system balance tuning, scope too high.
- Option B - Prestige multiplier on research cost: Is 기획자 lens (4th consecutive) - deprioritized per anti-stagnation rule.
