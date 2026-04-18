# Iter 19 Analysis (multi-lens)

_Generated: 2026-04-19_

## Snapshot Delta Table
| Metric | Current | Previous | Delta |
|---|---|---|---|
| activeUsers | 0 | 0 | 0 (GA completely silent) |
| newUsers | 0 | 0 | 0 |
| tutorial_step/user | N/A | N/A | N/A |
| challenge_complete_rate | N/A | N/A | N/A |
| upgrade_purchase/user | N/A | N/A | N/A |
| avg_session_sec | N/A | N/A | N/A |

Both snapshots (2026-04-18T1841, 2026-04-18T1951) returned empty arrays. GA completely silent — leaning 100% on Code + Playtest.

## Top 3 GA Findings
1. No active users in 1-day window for both snapshots.
2. No event data — cannot measure tutorial_step, compile rate, or challenge completion.
3. No device/country data.

## Code Fresh-eye Findings

Files reviewed: js/production.js, js/career.js, js/main.js, js/challenge.js, js/events.js, js/model.js, js/state.js, js/research.js, js/tutorial.js

1. js/production.js:50,53 — tapPower scales with prestigeMultiplier (LoC per tap x mult), but Rep gain (+5/tap line 53, +50/compile line 116) is flat hardcoded across all 8 career stages. LoC production scales at 2x/3.5x/6x per stage, but Rep accumulation never increases. Asymmetry creates exponentially harder rep grind with no compensation.

2. js/career.js:3-14 — Rep requirements are strict 10x per stage: 0 -> 2K -> 20K -> 200K -> 2M -> 20M -> 200M -> 2B. With flat +50 rep/compile and 30 compiles/hr, StackUnderflow needs 13.3 hours and Cloudish needs 133 hours of manual play. Only Orchestrator (1500 Compute, auto-compile 6/min = 18K rep/hr) makes post-BugFarm achievable.

3. js/career.js:158-161 — MANUAL_REP_EST = 1500 (30 compiles/hr x 50 rep). An active player at 120 compiles/hr reaches BugFarm in 20 minutes, not 1.3h shown. Conservative estimate may cause premature quit.

4. js/challenge.js:62,293-296 — 3 free challenges/day. S grade: +300 LoC +150 Compute +300 Rep +3 Papers. Three S-grades = 900 Rep/day = 45% of BugFarm from challenges. But Rep reward is absent from challenge button subtext.

5. js/main.js:759-761 — currentChallengeType randomly picked on init if null. Players have zero agency over which challenge type appears.

## Playtest Observations

1. Step 1 (Welcome modal): Clean, no competing modal collision. Daily bonus toast appeared after modal dismiss. (screenshot: play-01-start.png)

2. Step 2-3 progression: Tutorial spotlight on .editor-body correctly blocked non-editor clicks. After tap+compile, tutorial advanced to Step 4. Mission card updated correctly: Write Code! -> Compile! -> Buy Batch Size!. Goals card BugFarm 0% visible as long-term anchor. (screenshot: play-02-mid.png)

3. Step 4 (Auto-Code modal): Compute=144, Rep=55. Challenge button randomly shows Naming (Free 3 left) with no way to switch type. Career screen shows Rep / hr: -- misleadingly. (screenshot: play-03-end.png)

4. Career screen from text dump: Rep / hr: -- with Tap +5 / Compile +50 subtext. The -- implies no active progress even while player is tapping. Misleads.

5. Challenge area: Win -> +Papers +Compute subtext does NOT mention +Rep reward. Players who skip challenges lose 100-300 Rep per attempt unknowingly.

## Triangulation

GA completely silent (second iter in a row). Code review is dominant signal. Strongest convergent: flat Rep gain vs exponential Rep requirements (Code) + misleading Rep / hr: -- (Playtest). Tutorial Step 1-4 flow is clean with no regressions. Code signal drives all 5 candidates.

## Candidates Per Lens

### UI
- Candidate: Challenge button subtext shows Rep reward explicitly: Win -> +Rep +Papers +Compute / Score: 6/10 / Evidence: code+playtest — challenge.js:295 Rep reward (100-300) absent from subtext; players miss major Rep source

### UX
- Candidate: Career Rep/hr card shows real manual estimate instead of -- / Score: 7/10 / Evidence: playtest — -- implies zero earning during active tapping; should display tap+compile rate so player understands progress

### 기획자
- Candidate: Rep gain scales with prestige multiplier (x prestigeMultiplier on tap +5 and compile +50) / Score: 9/10 / Evidence: code — production.js:53,116 flat vs career.js:3-14 10x req curve; prestige loop broken past stage 2 without Orchestrator

### 개발자
- Candidate: Persist currentChallengeType in gameState so returning players see same type / Score: 5/10 / Evidence: code — main.js:759-761 random re-pick on every init; session-bound only

### 게이머
- Candidate: Challenge type cycling — tap button next to challenge to cycle through available types / Score: 7/10 / Evidence: playtest — Naming randomly selected with no way to switch; player agency = 0

## Lens Choice Reasoning

- 기획자 (9/10): PASS — systemic prestige loop asymmetry. Highest score, structural fix.
- UX (7/10): PASS — -- in active rep card misleads players about their progress.
- 게이머 (7/10): PASS — challenge type agency. Engagement lever.
- UI (6/10): PASS — Rep reward invisible on challenge button.
- 개발자 (5/10): PASS — borderline but consistent UX improvement.

Last 5 iters (14-18) all ran all 5 lenses. No anti-stagnation adjustment needed.

## Implementation Queue

| # | Lens | Title | Score | Files |
|---|---|---|---|---|
| 1 | 기획자 | Rep gain scales with prestige multiplier | 9/10 | js/production.js |
| 2 | UX | Career Rep/hr shows real manual estimate | 7/10 | js/career.js |
| 3 | 게이머 | Challenge type cycling button | 7/10 | js/main.js, js/challenge.js |
| 4 | UI | Challenge subtext shows Rep reward | 6/10 | js/main.js |
| 5 | 개발자 | Persist currentChallengeType in gameState | 5/10 | js/main.js, js/state.js |

## Primary Improvement

**Lens**: 기획자
**Title**: Rep gain scales with prestige multiplier
**Why**: production.js:53 gives +5 Rep/tap flat and line 116 gives +50 Rep/compile flat. But tapPower already multiplies by prestigeMultiplier. Career rep requirements are 10x per stage. A BugFarm (2x mult) player needs 20K rep for StackUnderflow but gains at same rate as NullPointer. Without Orchestrator: 13.3 hours. With rep scaling: ~6.7h manual, ~33min with Orchestrator.

**Files to change**: js/production.js (lines 53, 116)

**Implementation sketch**:
- tapEditor() line 53: gameState.reputation += 5 * gameState.prestigeMultiplier;
- compileData() line 116: gameState.reputation += 50 * gameState.prestigeMultiplier;
- Update floating text to show actual rep amount (not hardcoded +5 Rep)

**Expected impact**:
- 1h after: BugFarm players see rep bar fill 2x faster. Advance In for StackUnderflow drops from ~13h to ~6.7h.
- 1 week after: Career prestige loop achievable mid-game without Orchestrator dependency. Session retention improves at prestige wall.

**Rollback plan**: Revert production.js lines 53 and 116 to hardcoded +5 and +50.

## Considered but Rejected

- Option A -- Lower rep requirements for mid-stages: Rebalancing CAREER_STAGES affects late-game pacing. Scaling gain is safer and preserves prestige aspiration while proportionally reducing grind.
- Option B -- Add Rep from daily login bonuses: Requires new state tracking and UI. Prestige multiplier scaling is a 2-line fix with equivalent structural impact.
