# Iter 16 Analysis (multi-lens)

_Generated: 2026-04-19_

## Snapshot Delta Table
| Metric | Current | Previous | Delta |
|---|---|---|---|
| activeUsers | 0 | 0 | 0 |
| newUsers | 0 | 0 | 0 |
| tutorial_step/user | N/A | N/A | N/A |
| challenge_complete_rate | N/A | N/A | N/A |
| upgrade_purchase/user | N/A | N/A | N/A |
| avg_session_sec | N/A | N/A | N/A |

Both snapshots (2026-04-18T18:41 and 2026-04-18T19:51) are completely empty. Traffic is zero.

## Top 3 GA Findings
1. Zero traffic in both snapshots. All analysis relies on Code + Playtest.
2. N/A
3. N/A

## Code Fresh-eye Findings
Files read: js/events.js, js/career.js, js/production.js, js/main.js, js/upgrade.js, js/research.js, js/ui.js

1. js/events.js:45 - stale lastEventTime clamping bug: lastEventTime = now - EVENT_SPAWN_MAX * 1000 sets elapsed=300s which always satisfies elapsed >= threshold (threshold in [120,300)). First event fires immediately on any new game or returning player. Confirmed by playtest.
2. js/career.js:165 - wrong rep rate text: shows Tap +1 / Compile +10 but production.js:53 gives +5 per tap and +50 per compile. Iter 15 changed values but career.js was not updated.
3. js/events.js:39 - eventTick() has no isTutorialActive() guard. Combined with bug 1, negative event fired at tutorial step 3.
4. js/career.js:33-35 - getRepRate() returns null without Orchestrator. Advance In shows -- for all new players.
5. js/tutorial.js - step 7 spotlight targets Tool Use upgrade card, not train.js tab.

## Playtest Observations
1. Immediate negative event during tutorial (play-01-start.png -> play-02-mid.png): New Regulation fired after first compile. Demoralizing start.
2. Career Advance In: -- for all new players (play-03-end.png): Sub-text says +1/+10 which is 5x wrong.
3. Tutorial spotlight mismatch at step 7 (play-03-end.png): Step 7 says Switch to train.js but spotlight on Tool Use card.
4. Batch Size purchasable immediately: 259 Compute from first compile, Batch Size (50) purchased. Good UX.
5. Enterprise Deal event fired ~3-4 minutes in. Normal timing. Positive but obscured by modal.

## Triangulation
GA silent. Code found two deterministic bugs (rep text, lastEventTime clamp) and structural issue (no tutorial guard). Playtest confirmed all three. Code signal strongest - bugs are deterministic, affecting 100% of players.

## Candidates Per Lens

### UI
- Candidate: Fix career rep-rate subtext +1/+10 to +5/+50 / Score: 8/10 / Evidence: code

### UX
- Candidate: Suppress events during active tutorial / Score: 8/10 / Evidence: playtest + code

### 기획자
- Candidate: Show rep velocity hint for manual players on career screen / Score: 6/10 / Evidence: code + playtest

### 개발자
- Candidate: Fix stale lastEventTime clamp: SPAWN_MAX -> SPAWN_MIN / Score: 9/10 / Evidence: code + playtest

### 게이머
- Candidate: Fix tutorial step 7 spotlight target / Score: 6/10 / Evidence: playtest

## Lens Choice Reasoning
Last 5 iters: Iter12=개발자, Iter13=UX/개발자, Iter14=UX/기획자+개발자+UI, Iter15=all5. All 5 candidates score >= 5, all enter queue.

## Implementation Queue
| # | Lens | Title | Score | Files |
|---|---|---|---|---|
| 1 | 개발자 | Fix stale lastEventTime clamp: SPAWN_MAX -> SPAWN_MIN | 9/10 | js/events.js |
| 2 | UX | Suppress events during active tutorial | 8/10 | js/events.js |
| 3 | UI | Fix career rep-rate subtext +1/+10 -> +5/+50 | 8/10 | js/career.js |
| 4 | 기획자 | Career screen rep velocity hint for manual players | 6/10 | js/career.js |
| 5 | 게이머 | Fix tutorial step 7 spotlight -> train.js tab | 6/10 | js/tutorial.js |

## Primary Improvement
Lens: 개발자
Title: Fix stale lastEventTime clamp
Why: events.js:44-47 clamps stale lastEventTime to now - EVENT_SPAWN_MAX*1000 (= now - 300s), elapsed=300. threshold in [120,300) so elapsed >= threshold always true. spawnEvent() fires in ~100ms on every load. Playtest confirmed.
Files to change: js/events.js line 45
Implementation sketch: now - EVENT_SPAWN_MAX * 1000 -> now - EVENT_SPAWN_MIN * 1000. Sets elapsed=120 on stale save; first event fires 0-180s after load (avg 90s) not immediately.
Expected impact:
- Short term: 100% of sessions start without immediate punishing event during tutorial
- Long term: Fewer early-session quits
Rollback: Revert line 45

## Considered but Rejected
- Option A - Research shortcut in editor: Goal card already shows READY with arrow. Redundant. Score 4/10.
- Option B - More event timing complexity: Iter 15 already added EARLY_GAME_BLOCKED. Root cause is clamping. Rejected.
