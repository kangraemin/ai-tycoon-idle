# Iter 14 Implementation (multi-candidate)

Queue length: 3

## Candidate 1 — UX/Planner (score 9/10)
**Title**: Fix train-tab hint/mission gate: papers < 20 -> papers < 50
**Files changed**:
- `js/main.js`: raised threshold at line 23 from 20 to 50
- `js/hints.js`: raised threshold at line 80 from 20 to 50

**Commit**: 75b210f
**LOC**: +2/-2
**Status**: committed

## Candidate 2 — Developer (score 7/10)
**Title**: Fix gpuSlots reset to 2 on career advance
**Files changed**:
- `js/career.js`: line 100 gpuSlots changed from 1 to 2

**Commit**: 4ea5df0
**LOC**: +1/-1
**Status**: committed

## Candidate 3 — UI/Gamer (score 5/10)
**Title**: Add +1 Rep floating text on each editor tap
**Files changed**:
- `js/production.js`: added showFloatingText(fx+4, fy+18, '+1 Rep') after +Code float

**Commit**: a187743
**LOC**: +1/-0
**Status**: committed

## Summary
- Attempted: 3
- Committed: 3
- Skipped (conflict): 0
- Skipped (build fail): 0
- Total LOC: +4/-3

## Files Modified This Iter
- `js/main.js` (from candidate 1)
- `js/hints.js` (from candidate 1)
- `js/career.js` (from candidate 2)
- `js/production.js` (from candidate 3)

## Push status
- success
