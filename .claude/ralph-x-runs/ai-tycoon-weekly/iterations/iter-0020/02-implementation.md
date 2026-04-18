# Iter 20 Implementation (multi-candidate)

Queue length: 5

## Candidate 1 — 기획자 (score 9/10)
**Title**: Challenge rewards scale with prestigeMultiplier
**Files changed**:
- `js/challenge.js`: Added prestige = gameState.prestigeMultiplier || 1; applied to locReward, computeReward, repReward

**Commit**: ad3c19e
**LOC**: +4/-3
**Status**: committed

## Candidate 2 — UX (score 8/10)
**Title**: Fix mission card model-unlock sub-text + screen routing
**Files changed**:
- `js/main.js`: sub changed to Research with Papers; screen changed to research; progress bar removed

**Commit**: 63c35de
**LOC**: +1/-1
**Status**: committed

## Candidate 3 — 개발자 (score 8/10)
**Title**: Fix offline modal blocked by tutorial step-4 overlay
**Files changed**:
- `js/main.js`: startTutorial() deferred via MutationObserver until offline modal dismissed

**Commit**: e0c74a0
**LOC**: +12/-1
**Status**: committed

## Candidate 4 — UI (score 7/10)
**Title**: Fix Coming Next misleading Compute label
**Files changed**:
- `js/main.js`: locked-model-cost changed to Unlock via Research (Papers)

**Commit**: 90f0a11
**LOC**: +1/-1
**Status**: committed

## Candidate 5 — 게이머 (score 7/10)
**Title**: Raise free challenges 3->5, add token recharge hint
**Files changed**:
- `js/challenge.js`: DAILY_FREE_CHALLENGES 3->5
- `js/main.js`: recharge midnight hint added

**Commit**: b870abb
**LOC**: +4/-2
**Status**: committed

## Summary
- Attempted: 5
- Committed: 5
- Skipped (conflict): 0
- Skipped (build fail): 0
- Total LOC: +22/-8

## Files Modified This Iter
- `js/challenge.js` (candidate 1, 5)
- `js/main.js` (candidate 2, 3, 4, 5)

## Push status
- success
