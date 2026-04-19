# Iter 27 Implementation (multi-candidate)

Queue length: 4

## Candidate 1 — 기획자 (score 9/10)
**Title**: Offline earnings: LoC award on load + welcome-back modal
**Status**: skipped-preexisting
**Notes**: applyOfflineEarnings() already fully implemented in js/offline.js (prior iter). showOfflineModal() in js/ui.js. Called from main.js:660.

## Candidate 2 — 게이머 (score 7/10)
**Title**: Challenge cooldown live countdown on button
**Files changed**:
- js/main.js: changed cooldown button from hourglass+Xs to Play again in Xs

**Commit**: e4ea571
**LOC**: +3/-3
**Status**: committed

## Candidate 3 — 기획자/개발자 (score 7/10)
**Title**: Passive Rep from model LPS in produceTick()
**Files changed**:
- js/production.js: passiveRep = lps * dt * 0.05 inside produceTick()

**Commit**: a2c0b08
**LOC**: +4/-0
**Status**: committed

## Candidate 4 — UX (score 6/10)
**Title**: Post-tutorial what's next checklist modal
**Files changed**:
- js/tutorial.js: added showModalHtml(What's Next?) in endTutorial(), 3-item checklist

**Commit**: 01b9379
**LOC**: +33/-1
**Status**: committed

## Summary
- Attempted: 4
- Committed: 3
- Skipped (preexisting): 1
- Skipped (conflict): 0
- Skipped (build fail): 0
- Total LOC: +40/-4

## Files Modified This Iter
- js/main.js (candidate 2)
- js/production.js (candidate 3)
- js/tutorial.js (candidate 4)

## Push status
- success
