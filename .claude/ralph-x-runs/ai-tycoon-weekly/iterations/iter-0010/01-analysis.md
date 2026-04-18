# Iter 10 Analysis (multi-lens)

_Generated: 2026-04-18_

## Snapshot Delta Table
| Metric | Current | Previous | Delta |
|---|---|---|---|
| activeUsers | 1 | 1 | 0 (0%) |
| newUsers | 1 | 1 | 0 |
| sessions | 1 | 1 | 0 |
| avg_session_sec | 2.29 | 2.29 | 0 |
| game_events/user | 0 | 0 | 0 |
| engagementRate | 0% | 0% | 0 |
| tutorial_step/user | N/A | N/A | N/A (no game events) |
| upgrade_purchase/user | 0 | 0 | 0 |
| (1 user, Cyprus, desktop, direct) | | | |

## Top 3 GA Findings
1. Zero game events in 7 days — the single visitor bounced in 2.29s with only system events (session_start, first_visit, page_view, scroll). No game interaction at all.
2. Most recent snapshot (2026-04-18T15:32) is entirely empty — 0 activeUsers in the 1-day window. Traffic has gone completely cold.
3. All acquisition is direct/none — no organic or referral traffic. The product has no discovery mechanism.

## Code Fresh-eye Findings
Files read: js/career.js, js/production.js, js/upgrade.js, js/events.js, js/main.js, js/tutorial.js, js/research.js, js/state.js

1. `js/career.js:135-141` — Career stat cards show only Multiplier and Reputation (raw number). No rep rate, no velocity, no time-to-advance. A player seeing "11 / 10,000 Rep" has zero information about whether this takes 1 hour or 1 month.
2. `js/production.js:115` — compileData() adds gameState.reputation += 10 silently. No floating text, no toast. The +10 Rep from each compile is completely invisible to players.
3. `js/main.js:14-18` — getCurrentMission() opens with if (!st.stats || st.stats.totalTaps < 10). Old saves with null stats or low totalTaps get stuck at "Write some Code!" even with 10K+ Compute. Returning players see stale guidance.
4. `js/career.js:117-133` — Progress bar for reputation shows but has NO rate indicator. Nothing tells players HOW they're earning rep or how to speed it up.
5. `js/production.js:31-44` — Orchestrator auto-compile fires every 10s at Lv.1, giving +10 rep per fire = 360 rep/hour. This is the key idle mechanic for career advancement but completely hidden from the player.
6. `js/upgrade.js:11` — Orchestrator description says "Lv.1+: Auto-Compile every 10s" but doesn't mention it generates Rep. The rep-from-compile connection is broken from an info architecture perspective.

## Playtest Observations
Browse-based playtest at http://localhost:8765 (loaded from localStorage savestate from previous iters).

1. Career screen shows "11 / 10.0K Rep" with a near-invisible sliver of progress bar, no rate, no estimate, no guidance on earning rep faster. (screenshot: play-03-end.png)
2. Daily Bonus modal blocks the entire screen on load for returning players (tutorial complete). Must click Collect! before seeing any game content. (screenshot: play-02-mid.png)
3. Mission card showed "Write some Code! Tap the editor to start" alongside "You can afford an upgrade!" — stats.totalTaps < 10 branch fired despite 10K+ Compute in the save. (screenshot: play-02-mid.png)
4. Five manual compileData() calls raised reputation 11->21 (+10 per compile) but only the rep counter in the top bar changed — no floating text, no toast. Players never see rep accumulating from compiles.
5. Editor tap clicks timed out in browse tool but game loop otherwise functioned — LoC ticking, Enterprise Deal event showing correctly, Flow State meter visible.

## Triangulation
GA is completely silent (one bounce, zero game events) — provides no actionable signal beyond "not being discovered." All signal comes from Code + Playtest. Both converge on the same gap: the career/prestige loop is completely opaque. Players see a reputation number that barely moves, have no feedback that compiling builds rep, and get no estimate of when they'll advance. Code confirms: renderCareerScreen() renders no rate/velocity info, and compileData() fires reputation += 10 with zero UI feedback. Playtest confirms: career screen with "11 / 10,000 Rep" and 0.1% progress bar conveys nothing actionable. Playtest signal is strongest here. GA is silent so we lean heavily on B + C.

## Candidates Per Lens

### UI
- **Candidate**: Add "+10 Rep" floating text near Reputation display on compile / Score: 7/10 / Evidence: Playtest — compile rep gain is completely invisible; code shows no showFloatingText call for rep in compileData()

### UX
- **Candidate**: Auto-dismiss Daily Bonus modal after 3s or add backdrop-click / Score: 6/10 / Evidence: Playtest — modal blocks full screen on every session open for returning players; iter 7 only suppressed during tutorial

### 기획자
- **Candidate**: Career progression velocity — add Rep/hr rate + time-to-advance estimate to career screen, plus +Rep floating feedback on compile / Score: 9/10 / Evidence: Code (no rate in renderCareerScreen) + Playtest (career screen dead-end with no velocity info) + Logic (idle game players quit when they cannot perceive forward progress)

### 개발자
- **Candidate**: Fix stale mission card for old saves — handle null stats or low totalTaps with resource-based fallback / Score: 7/10 / Evidence: Code main.js:14 — !st.stats || st.stats.totalTaps < 10 can fire at 10K+ compute; Playtest saw "Write some Code!" alongside "You can afford an upgrade!"

### 게이머
- **Candidate**: Make auto-compile feel tangible — pulse animation on editor when auto-compile fires, showing rep tick accruing / Score: 7/10 / Evidence: Playtest — Orchestrator auto-compile is silent and invisible; players do not realize idle mode is building rep toward career advance

## Lens Choice Reasoning
Recent 5 iter completed lenses: 게이머 (5), UI (6), UX (7), 기획자 (8), 게이머-SKIPPED (9). No lens used 3+ times in a row — anti-stagnation rule not triggered. 기획자 scores 9/10 vs next-best 개발자 7/10 and UI 7/10. The career velocity gap is the #1 systemic problem in an idle game at this stage: players who cannot perceive their progress toward prestige quit. Iter 8's 기획자 work fixed the auto-compile mechanic (infrastructure). This iter unlocks the payoff: making that mechanic's contribution visible. Choosing 기획자.

## Selected Improvement
**Lens**: 기획자
**Title**: Career Progression Velocity — Rep rate display + compile rep feedback
**Why**: Reputation growth is invisible. Players see "11 / 10,000 Rep" with no rate, no estimate. compileData() silently adds +10 Rep per call, and with Orchestrator auto-compile every 10s that is 360 rep/hour — enough to reach BugFarm in ~28 hours idle. But players have NO idea. This directly explains the GA bounce: no sense of forward progress. Making rep velocity visible + giving compile rep feedback teaches the core loop and creates motivation to buy Orchestrator to increase rep/hour.

**Files to change**:
- js/career.js — add getRepRate() + getTimeToAdvance() functions; modify renderCareerScreen() career-cards section to show Rep/hr and Est. advance time
- js/production.js — add showFloatingText for +Rep near rep-display element in compileData()
- css/style.css — update .career-cards grid to accommodate 4 cards (2x2) if needed

**Implementation sketch**:
1. getRepRate() in career.js: if orchLevel > 0, rate = (3600 / (BASE_AUTO_COMPILE_INTERVAL / (1 + orchLevel * 0.15))) * 10 rep/hr. If orchLevel=0, return null (show "--").
2. getTimeToAdvance(repRate) in career.js: if repRate > 0 and next exists, return (next.repReq - gameState.reputation) / (repRate / 3600) seconds, formatted as "~2.8h" or "~12h".
3. renderCareerScreen() career-cards: add 2 more cards — "Rep/hr" and "Advance In" after existing Multiplier and Reputation cards. Grid: 2 cols x 2 rows.
4. compileData() in production.js: after reputation += 10, showFloatingText near rep-display with "+10 Rep" in gold/star color.
5. CSS .career-cards: verify 4 cards wrap naturally in 2-col grid.

**Expected impact**:
- 단기(1h 후): Players visiting career screen understand velocity. "+10 Rep" on each compile visually connects compile → career advance. Compile frequency may increase.
- 장기(1주 후): Players motivated to buy Orchestrator to raise rep/hr. upgrade_purchase/user rises. Prestige loop becomes a visible goal vs. a mystery counter.

**Rollback plan**: renderCareerScreen() fully rebuilds innerHTML each call — revert 2 new career-card HTML blocks and remove getRepRate/getTimeToAdvance. The floating text in compileData() is a 4-line addition with no side effects.

## Considered but Rejected
- **Option A — Fix stale mission card (개발자)**: Real bug, but affects only returning players with old saves. New players (the conversion problem) have fresh stats and are unaffected. Lower conversion impact than career visibility.
- **Option B — Daily Bonus modal auto-dismiss (UX)**: Real friction but one-tap cost. Standard idle game pattern. UX used 3 iters ago (iter 7). Career visibility gap is deeper.
- **Option C — Orchestrator description mentions rep (개발자/UI)**: Only helps players who read upgrade descriptions. Smaller audience than the career screen itself.
