# Iter 22 Implementation (multi-candidate)

Queue length: 5

## Candidate 1 — 게이머 (score 8/10)
**Title**: Level Up shortcut in research reveal for duplicates
**Files changed**:
- `js/research.js`: Added doResearchRevealLevelUp() + inline Level Up button in duplicate reveal

**Commit**: c53a88e
**LOC**: +39/-0
**Status**: committed
**Notes**: Button enabled/disabled based on compute. Confirm text replaces button after success.

## Candidate 2 — UX (score 7/10)
**Title**: GPU full -> Expand GPU CTA replaces Research button
**Files changed**:
- `js/research.js`: Replaced Research button with Expand GPU! CTA when GPU slots full

**Commit**: 857fd5e
**LOC**: +13/-7
**Status**: committed
**Notes**: Eliminates 1.5s spinner dead-end. Navigates directly to Upgrades.

## Candidate 3 — 개발자 (score 6/10)
**Title**: Reset gachaPulls on career advance (per-prestige pity)
**Files changed**:
- `js/career.js`: Added stats.gachaPulls = 0 in doCareerAdvance()

**Commit**: 7a63ec5
**LOC**: +1/-0
**Status**: committed
**Notes**: Restores pity guarantee for every new prestige cycle.

## Candidate 4 — UI (score 6/10)
**Title**: Research rates add owned/total model count per rarity tier
**Files changed**:
- `js/research.js`: Rate circles display owned/total badge per rarity

**Commit**: e6b3a38
**LOC**: +7/-3
**Status**: committed
**Notes**: Computed live from MODEL_DEFS and gameState.models.

## Candidate 5 — 기획자 (score 5/10)
**Title**: Career advance toast with actual papers bonus amount
**Files changed**:
- `js/career.js`: Shows toast with exact papersBonus after advance

**Commit**: 73e0111
**LOC**: +5/-1
**Status**: committed
**Notes**: papersBonus = 10 x careerHistory.length after push.

## Summary
- Attempted: 5
- Committed: 5
- Skipped (conflict): 0
- Skipped (build fail): 0
- Total LOC: +65/-11

## Files Modified This Iter
- `js/research.js` (candidates 1, 2, 4)
- `js/career.js` (candidates 3, 5)

## Push status
- success (ef163a0..73e0111 -> main)
