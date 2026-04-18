# Iter 21 Implementation (multi-candidate)

Queue length: 5

## Candidate 1 — 기획자 (score 8/10)
**Title**: Add fusion goal to getNextGoalItems() + fix hint suppression
**Files changed**:
- `js/main.js`: Added fusion-first goal item (step 4) when discoveredFusions empty and player owns both recipe ingredients
- `js/hints.js`: Suppression moved into loop — only skips hints pointing to same screen as active mission

**Commit**: e6ed5f9
**LOC**: +21/-5
**Status**: committed

## Candidate 2 — 게이머 (score 7/10)
**Title**: Fusion screen per-recipe ownership status
**Files changed**:
- `js/fusion.js`: Undiscovered codex entries show accent ??? for owned ingredients + N/2 hint

**Commit**: 6e40746
**LOC**: +7/-1
**Status**: committed

## Candidate 3 — UX (score 7/10)
**Title**: Lower career nav unlock 5000->2000 rep
**Files changed**:
- `js/ui.js`: Career nav unlock threshold 5000 -> 2000 rep

**Commit**: 3123438
**LOC**: +1/-1
**Status**: committed

## Candidate 4 — 개발자 (score 6/10)
**Title**: Fix getRepRate() formula off by 5x
**Files changed**:
- `js/career.js`: getRepRate returns firesPerHour*50*prestigeMultiplier (was *10)

**Commit**: 3c70233
**LOC**: +1/-1
**Status**: committed

## Candidate 5 — UI (score 6/10)
**Title**: Show first-pull pity guarantee on research screen
**Files changed**:
- `js/research.js`: Pity banner Uncommon 70% / Rare 30% shown before first pull

**Commit**: 6861cd7
**LOC**: +4/-0
**Status**: committed

## Summary
- Attempted: 5
- Committed: 5
- Skipped (conflict): 0
- Skipped (build fail): 0
- Total LOC: +34/-8

## Files Modified This Iter
- `js/main.js` (from candidate 1)
- `js/hints.js` (from candidate 1)
- `js/fusion.js` (from candidate 2)
- `js/ui.js` (from candidate 3)
- `js/career.js` (from candidate 4)
- `js/research.js` (from candidate 5)

## Push status
- success
