# Iter 17 Implementation (multi-candidate)

Queue length: 5

## Candidate 1 - 기획자 (score 8/10)
**Title**: Fix Mission/Goals card guidance conflict
**Files changed**:
- js/main.js: Reordered getNextGoalItems() - Career first, GPU second, model-unlock third. Suppressed model-unlock when mission.id is early-phase (tap/compile/batch/train/research/gpu).

**Commit**: be0cfcb
**LOC**: +22/-17
**Status**: committed

## Candidate 2 - UI (score 7/10)
**Title**: Move Challenge area below editor body
**Files changed**:
- js/main.js: Moved editor-challenge-area from before tab-bar to after status-bar. Also inlined challenge type name into button label.

**Commit**: d2cb4fd
**LOC**: +22/-22
**Status**: committed

## Candidate 3 - UX (score 7/10)
**Title**: Dynamic compile button mode label
**Files changed**:
- js/main.js: Added updateCompileBtn() - sets .compile-btn-mini to Compile to Papers or Compile to Compute based on active tab. Called from renderEditorScreen().

**Commit**: 4320a78
**LOC**: +8/-0
**Status**: committed

## Candidate 4 - 개발자 (score 6/10)
**Title**: Manual rep rate estimate in Career Advance In
**Files changed**:
- js/career.js: When repRate null, Advance In uses 1500 Rep/hr estimate. Shows est. at 30 compiles/hr sub-label.

**Commit**: ead21c4
**LOC**: +6/-2
**Status**: committed

## Candidate 5 - 게이머 (score 6/10)
**Title**: Challenge discoverability: hint after tutorial + type label
**Files changed**:
- js/hints.js: Added discover-challenge hint after tutorial completion when player never played a challenge.

**Commit**: 7462519
**LOC**: +12/-0
**Status**: committed

## Summary
- Attempted: 5
- Committed: 5
- Skipped (conflict): 0
- Skipped (build fail): 0
- Total LOC: +70/-41

## Files Modified This Iter
- js/main.js (candidates 1, 2, 3)
- js/career.js (candidate 4)
- js/hints.js (candidate 5)

## Push status
- success
