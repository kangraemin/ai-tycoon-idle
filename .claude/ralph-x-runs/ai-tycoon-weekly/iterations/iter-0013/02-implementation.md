# Iter 13 Implementation (multi-candidate)

Queue length: 3

## Candidate 1 — UX/개발자 (score 9/10)
**Title**: Fix Research Unlocked modal blocking new players (checkDailyBonus ordering + tutorial guard)
**Files changed**:
- js/main.js: Moved checkDailyBonus() call to after startTutorial() block
- js/tutorial.js: Removed gameState.papers > 20 from returning-player guard

**Commit**: bf8f7aa
**LOC**: +3/-3
**Status**: committed
**Notes**: Root-cause fix. Guard was catching brand-new players on day 1 because checkDailyBonus bumped papers from 20 to 25 before startTutorial ran.

## Candidate 2 — 게이머 (score 6/10)
**Title**: Add reward hint to Challenge button label
**Files changed**:
- js/main.js: Added Win to +Papers +Compute hint below Challenge button when not on cooldown

**Commit**: 4eb1710
**LOC**: +1/-0
**Status**: committed

## Candidate 3 — 기획자 (score 5/10)
**Title**: Show tap/compile rep rate on Career screen
**Files changed**:
- js/career.js: Changed Need Orchestrator to Tap +1 / Compile +10 when no passive rate

**Commit**: 5291de4
**LOC**: +1/-1
**Status**: committed

## Summary
- Attempted: 3
- Committed: 3
- Skipped (conflict): 0
- Skipped (build fail): 0
- Total LOC: +5/-4

## Files Modified This Iter
- js/main.js (from candidate 1, 2)
- js/tutorial.js (from candidate 1)
- js/career.js (from candidate 3)

## Push status
- success
