# Iter 14 Analysis (multi-lens)

_Generated: 2026-04-18_

## Snapshot Delta Table
| Metric | Current | Previous | Delta |
|---|---|---|---|
| activeUsers | 0 | 0 | +/-0 |
| newUsers | 0 | 0 | +/-0 |
| tutorial_step/user | N/A | N/A | N/A |
| avg_session_sec | N/A | N/A | N/A |

GA completely silent -- both snapshots (19:51 and 18:41) have zero data. No traffic signal.

## Top 3 GA Findings
1. Zero active users in 1-day window -- all analysis falls on Code + Playtest signals
2. N/A
3. N/A

## Code Fresh-eye Findings
Files: js/hints.js, js/main.js, js/state.js, js/career.js, js/production.js, js/research.js, js/upgrade.js, js/model.js, js/offline.js

1. main.js:23 + hints.js:80 -- Both mission card and hint banner check "papers < 20" for train-tab guidance. But state.js:10 defaults to papers:20. A brand-new player with exactly 20 papers NEVER sees this hint -- condition fires only after spending papers on research. Players who accumulate even 1 bonus paper (21+) are permanently locked out of the train.js discovery hint.

2. career.js:100 -- gameState.gpuSlots = 1 hard-coded on career advance. Iter 3 changed the default starting slots to 2, but career reset was never updated. Every prestige player immediately hits the single-GPU wall again.

3. production.js:53 -- +1 reputation per tap has no floating text feedback. Compile shows +10 Rep float (lines 116-130), but tap shows only +Code. Career screen shows "Advance In: --" with "idle off" label even when rep IS accumulating from taps -- misleading.

4. hints.js:80 -- train-tab hint requires totalCompiles >= 2 AND papers < 20. Double gate. Starting at 20 papers, hint fires only after first research pull then 2 compiles. Delayed discovery for core mechanic.

5. career.js:165 -- "Rep / hr" card shows "--" while sub-text shows "Tap +1 / Compile +10". Value contradicts sub-text.

## Playtest Observations
Local server at http://localhost:8765 -- loaded save state (papers=25).

1. papers < 20 condition NEVER FIRED during entire playtest session (play-01-start.png) -- with 25 papers, neither mission card nor hint banner showed train-tab guidance. Core loop explanation for papers-farming completely suppressed for players with >=20 papers.

2. Tutorial overlay step 2/10 blocked browse tool clicks on editor-body (play-02-mid.png) -- .editor-body clicks timed out 10 consecutive times. Only JS dispatch worked. Tutorial spotlight covers editor. On real mobile touch events go through, but may have edge-case friction.

3. Career screen shows "Advance In: --" with "idle off" (play-03-end.png) -- After earning 11 rep from taps+compile, career screen still shows "--" for advance time. The "idle off" label is misleading since rep IS accruing from tapping. Career goal feels impossibly distant.

## Triangulation
Code review is the dominant signal (GA silent). Both code and playtest independently confirm papers < 20 condition never fires for players at 20+ papers. gpuSlots=1 is code-only finding (no prestige players yet at this traffic level). Career velocity perception gap corroborated by playtest. High confidence in top candidate.

## Candidates Per Lens

### UI
- Candidate: Add "+1 Rep" floating text near rep-display on each editor tap / Score: 5/10 / Evidence: Playtest (career screen static despite rep accruing from taps)

### UX
- Candidate: Fix train-tab hint/mission gate: papers < 20 -> papers < 50 in main.js + hints.js / Score: 9/10 / Evidence: Code (main.js:23, hints.js:80), Playtest (hint never fired with 25 papers)

### Planner (Gihoekja)
- Candidate: Fix train-tab guidance threshold -- game loop comprehension break / Score: 9/10 / Evidence: Core loop (tap->compile->train->research) breaks at train step for 100% of players with >=20 papers
- Candidate: gpuSlots = 2 on career reset to match iter 3 default / Score: 7/10 / Evidence: Code (career.js:100)

### Developer (Gaebalja)
- Candidate: Fix gpuSlots = 1 -> gpuSlots = 2 in career.js:100 / Score: 7/10 / Evidence: Code (doCareerAdvance() sets 1, iter 3 changed createDefaultState() to 2)

### Gamer (Geimeo)
- Candidate: Add "+1 Rep" floating text on each tap for velocity feel / Score: 5/10 / Evidence: Playtest (compile shows +10 Rep, tap shows +Code but no +Rep; career goal feels static)

## Lens Choice Reasoning
Scores >=5 all pass. Recent lenses: iter10=Planner, iter11=UX, iter12=Developer+Gamer, iter13=UX+Developer+Planner+Gamer. No single lens used 3+ in a row as primary. Score-based selection applies.
- UX/Planner (9/10): 2-line fix. Deterministic block on 100% of new players. PASS.
- Developer (7/10): 1-line fix. Affects future prestige players. PASS.
- UI/Gamer (5/10): Minor feedback improvement. Boundary. PASS.

## Implementation Queue

| # | Lens | Title | Score | Files |
|---|---|---|---|---|
| 1 | UX/Planner | Fix train-tab hint/mission gate: papers < 20 -> papers < 50 | 9/10 | js/main.js, js/hints.js |
| 2 | Developer | Fix gpuSlots reset to 2 on career advance | 7/10 | js/career.js |
| 3 | UI/Gamer | Add +1 Rep floating text on each editor tap | 5/10 | js/production.js |

## Primary Improvement
**Lens**: UX / Planner
**Title**: Fix train-tab hint/mission gate -- change papers < 20 to papers < 50
**Why**: state.js:10 defaults papers:20. Both main.js:23 and hints.js:80 check papers < 20, which never fires for fresh players. Players who keep 20+ papers never discover train.js mechanic, breaking the Papers-farming loop.
**Files to change**: js/main.js line 23, js/hints.js line 80
**Implementation sketch**: Change constant from 20 to 50 in each file. No logic restructuring.
**Expected impact**:
- Short-term (1h): Players with 20-49 papers see train-tab mission + hint -> earlier train.js discovery
- Long-term (1w): Papers farming loop completes -> longer sessions, more research pulls
**Rollback plan**: Revert 50 back to 20 in both files.

## Considered but Rejected
- Option A -- Challenge first-time tooltip: Existing "Win -> +Papers +Compute" text is adequate. Score 4/10. Rejected.
- Option B -- Career Rep/hr card sub-text refactor: Iter 13 already added "Tap +1 / Compile +10". Further tweak is noise. Score 4/10. Rejected.
