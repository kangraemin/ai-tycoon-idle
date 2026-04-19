# Iter 28 Analysis (multi-lens)

_Generated: 2026-04-19_

## Snapshot Delta Table
| Metric | Current (1d) | Previous (30d) | Delta |
|---|---|---|---|
| activeUsers | 0 | 45 | -45 (1d window empty — no traffic today) |
| newUsers | 0 | 45 | -45 |
| sessions/user | N/A | 46/45 = 1.02 sessions | baseline |
| session_start events/user | N/A | 93/45 = 2.07 | baseline |
| tutorial_step/user | N/A | 58/29 = 2.00 | baseline |
| upgrade_purchase/user | N/A | 8/1 user (1/45 = 2.2%) | baseline |
| challenge_start/user | N/A | 31/18 = 1.72 | baseline |
| challenge_complete rate | N/A | 27/31 = 87% | baseline |
| research_pull reach | N/A | 9/45 = 20% | baseline |
| avg_session_sec | N/A | 124.9s | baseline |
| Germany engagement | N/A | 8 users, 291s avg | vs USA 15 users, 54s avg |
| Mobile users | N/A | 2 users, 3.3s avg | near-zero mobile engagement |

## Top 3 GA Findings
1. **Session/user ~2.07**: 45 users over 30 days, only ~2 sessions per player. For an idle game whose core promise is "come back later," near-zero return visits is the critical retention failure.
2. **upgrade_purchase = 1/45 users (2.2%)**: Only one player bought any upgrade. Baseline data (pre-iter-23 tutorial fixes), but confirms the economy loop is barely reached by most players.
3. **Germany vs USA disparity**: German players average 291s/session vs USA 54s. 8 German users account for disproportionate engagement.

## Code Fresh-eye Findings
Files read: `js/production.js`, `js/career.js`, `js/state.js`, `js/main.js`, `js/tutorial.js`, `js/offline.js`, `js/upgrade.js`, `js/challenge.js`, `js/ui.js`

1. `js/offline.js:3-16` — Offline earnings (iter-27) works correctly (50% efficiency, 8h cap). But the system only surfaces when RETURNING — no outbound hook shows players what they will earn while away before they close the tab.
2. `js/main.js:26-43` — `getCurrentMission()` falls through to "Unlock Translator!" when `owned >= maxSlots && compute < getGpuSlotCost()`. Post-tutorial players have 2/2 GPU slots, ~300 compute, and get directed to research more models they cannot run. Correct mission should be "Save compute for GPU expansion."
3. `js/career.js:3-13` — Rep requirements jump 10x per stage (2K->20K->200K->2M). With passive rep at `lps * dt * 0.05`, chatbot at 2 LPS earns ~360 rep/hr. Reaching 2K takes ~5.5h idle; 20K takes ~55h — a major wall.
4. `js/production.js:29-30` — Passive rep correctly implemented. The values are reasonable but nowhere in the editor UI do players see "your models earn X Rep/hr" — invisible idle progress.
5. `js/upgrade.js:7` — Memory upgrade (+1h offline time/level) is directly synergistic with offline earnings but its description never mentions offline earnings. Players don't connect these two systems.

## Playtest Observations
Full 10-step tutorial completed via browse skill.

1. **Step 1 modal** (play-01-start.png): Welcome modal shows cleanly. LPS=2 LoC/s displayed. BugFarm career progress bar shows "0%" in editor — the game's best existing retention hook.
2. **Upgrade step** (play-02-mid.png): After 8 taps + compile, player has 373 Compute. Mission card shows "Buy Batch Size." Tutorial spotlight correctly targets it. First-compile 3x bonus gave substantial compute.
3. **Tutorial completion** (play-03-end.png): "You're Ready!" modal correctly shows discovered model ("Summarizer"). Player is on Models screen with 2/2 GPU slots full. LOC=2.82K — idle accumulation working. After dismissing, next mission will be "Unlock Translator!" (confusing — GPU is full, cannot run additional models without GPU expansion first).

## Triangulation
Code and Playtest deliver the strongest signals; GA is silent (1d empty, 30d baseline only). Three convergent findings: (1) offline earnings exist but the outbound experience shows nothing about return rewards — `applyOfflineEarnings()` only fires on load; (2) post-tutorial mission sends players toward "Unlock Translator" when GPU is full — Playtest confirms this exact post-tutorial state; (3) passive rep and LPS are working but invisible in the editor — no in-editor "X Rep/hr from models" display. GA Germany/USA disparity shows motivated players engage deeply — the game works for those who try it, but the session-end experience gives no reason to return.

## Candidates Per Lens

### UI
- **Candidate**: Enhance BugFarm career progress bar in editor — increase % text visibility, add milestone label at 50%/80%/Ready / Score: 7/10 / Evidence: Playtest (bar text very small); code (main.js renderMissionCard supports sub-elements).

### UX
- **Candidate**: Fix GPU-full post-tutorial mission — when `owned >= maxSlots && compute < gpuSlotCost`, show "Earn [N] more Compute to expand GPU" instead of "Unlock Translator!" / Score: 6/10 / Evidence: Code (main.js:26-43) + Playtest (end state: 2/2 GPU, ~300 compute, Translator mission would show).

### 기획자
- **Candidate**: Memory upgrade description links to offline earnings — add "(earn more Code offline)" sub-hint to make the Memory->offline synergy legible to players. / Score: 5/10 / Evidence: Code (upgrade.js:7 + offline.js:3) — two systems designed to work together but never connected for players.

### 개발자
- **Candidate**: No critical bugs found. offline.js, state.js, tutorial.js all correct. / Score: 4/10 / Evidence: Full code review.

### 게이머
- **Candidate**: Idle earnings forecast panel in editor — persistent banner below mission card showing "+X Code/hr while away" and "+X Rep/hr while away" based on current LPS. / Score: 8/10 / Evidence: GA (2 sessions/user in 30d = core retention failure for idle game); Code (offline.js:16 already calculates `lps * elapsed * 0.5` — can show preview instantly); Playtest (no in-editor "you're earning while away" signal visible anywhere).

## Lens Choice Reasoning
- **게이머 8/10** -> PASS. Primary. Retention is the defining metric for an idle game. GA confirms 2 sessions/user over 30 days. Outbound experience gives zero indication of future rewards. Highest-leverage change.
- **UI 7/10** -> PASS. BugFarm progress bar is already a good retention element; making it more visible costs little.
- **UX 6/10** -> PASS. Post-tutorial mission flow is a deterministic confusion point for 100% of tutorial-completing players.
- **기획자 5/10** -> PASS (borderline). Memory/offline synergy is a real gap worth closing with minimal LOC.
- **개발자 4/10** -> CUT. Below threshold.

Anti-stagnation: Last 5 completed iters primary lens — 23:UX/UI, 24:UX/Dev, 26:기획자, 27:기획자. 기획자 primary 2x consecutive (not 3x). 게이머 not primary since iter-22 (6 iters ago). Organic pick by score.

## Implementation Queue
| # | Lens | Title | Score | Files (예상) |
|---|---|---|---|---|
| 1 | 게이머 | Idle earnings forecast panel in editor | 8/10 | `js/main.js`, `index.html`, `css/style.css` |
| 2 | UI | BugFarm career bar visibility boost | 7/10 | `js/main.js` |
| 3 | UX | Fix GPU-full post-tutorial mission | 6/10 | `js/main.js` |
| 4 | 기획자 | Memory upgrade offline synergy hint | 5/10 | `js/upgrade.js` |

## Primary Improvement (가장 높은 점수 상세)
**Lens**: 게이머
**Title**: Idle earnings forecast panel in editor
**Why**: sessions/user ~2 in 30d is the core problem for an idle game. Players see no signal that their AI models earn for them while away. Adding a persistent "+X Code/hr | +X Rep/hr while away" banner makes the idle promise tangible and creates a specific reason to return.
**Files to change**:
- `js/main.js` — add `renderIdleForecast()` + call in game loop
- `index.html` — add `<div id="idle-forecast">` below `#mission-card`
- `css/style.css` — style forecast panel
**Implementation sketch**:
- `renderIdleForecast()`: call `getLocPerSecond()` -> multiply by 3600 * 0.5 (OFFLINE_EFFICIENCY) -> format as "~7.2K Code/hr while away". Passive rep: `lps * 0.05 * 3600` -> Rep/hr. Show only when lps > 0.
- Visual: small muted banner with sleep icon, two stat pills. Color: var(--text-muted) bg, var(--loc) and var(--reputation) values.
- Update on game tick. Position: below mission card, above editor body.
**Expected impact**:
- 단기(1h 후): Players idling see exact payoff of returning. Reduces "nothing is happening" perception.
- 장기(1주 후): sessions/user increases from 2.07 toward 3+; avg_session_sec increases.
**Rollback plan**: Remove `<div id="idle-forecast">` from index.html and `renderIdleForecast()` call. Zero risk to core loop.

## Considered but Rejected
- **Option A — Rep curve rebalance (10x->7x per stage)**: Requires validating with active user data. With only 45 baseline users and no 1d traffic, no signal on where mid-game churn happens. Premature without evidence.
- **Option B — Push notification system**: Would address outbound retention more forcefully. But requires FCM/service worker infrastructure — too large for one iter.
