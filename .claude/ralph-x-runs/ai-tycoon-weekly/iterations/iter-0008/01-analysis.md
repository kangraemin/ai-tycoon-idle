# Iter 8 Analysis (multi-lens)

_Generated: 2026-04-18_

## Snapshot Delta Table
| Metric | Current (1d) | Previous (7d) | Delta |
|---|---|---|---|
| activeUsers | 0 | 1 | -1 |
| newUsers | 0 | 1 | -1 |
| sessions | 0 | 1 | -1 |
| avg_session_sec | 0 | 2.29 | -2.29 |
| game_events/user | 0 | 0 | 0 |
| tutorial_step/user | N/A | N/A | N/A |
| upgrade_purchase/user | N/A | N/A | N/A |
| country (7d) | Cyprus | — | 1 visit, 0 engagement |

## Top 3 GA Findings
1. Zero game events from the only session (7d): sole visitor triggered only system events — no game-specific analytics fired at all. Player never reached any in-game action.
2. 1d window is empty: No users in the past 24h. Traffic too sparse; GA not a usable signal this iter.
3. avg_session_sec = 2.29s (7d): unchanged from iter 7, confirming traffic too thin to detect improvements yet.

## Code Fresh-eye Findings

Files read: js/production.js, js/upgrade.js, js/main.js, js/career.js, js/tutorial.js, js/events.js, js/research.js

1. production.js:29-31 — autoCompileTick() is completely empty with comment "Removed: auto-compile was confusing users". Called every 100ms in game loop; does nothing.
2. upgrade.js:11 — Orchestrator description says "Auto-Compile runs 15% faster per level" and getUpgradeEffect returns level * 0.15 — but since autoCompileTick() is empty, the upgrade effect is never applied. Players pay 1500+ compute for a broken upgrade.
3. production.js:2 — let autoCompileTimer = 0; exists as leftover. Infrastructure for auto-compile partially intact (timer variable, function signature, game loop call).
4. career.js:80 — gameState.gpuSlots = 1 on prestige. Iter 3 gave 2 slots at start, but prestige correctly resets to 1. Second-run players face the slot wall earlier.
5. tutorial.js:117-120 — Spotlight steps auto-skip if selector not found. Step 6 selector .upgrade-card:first-child .btn only works when upgrade screen is visible; if not, step silently skips.
6. main.js:629,638-645 — checkDailyBonus() and applyOfflineEarnings() both run BEFORE startTutorial(). showOfflineModal() does NOT save/restore tutorial state, so offline modal stays visible behind tutorial spotlight.

## Playtest Observations

1. Tutorial step 4 modal ("Your AI Models Auto-Code!") renders cleanly, no competing UI. (screenshot: play-01-start.png)
2. Daily Bonus / Offline modal visible behind tutorial step 5 spotlight — after advancing step 4 to 5, the modal becomes visible through tutorial dim overlay. Two interactive elements fight for attention. (screenshot: play-02-mid.png)
3. Upgrade screen shows Orchestrator at Lv.0 — description promises Auto-Compile; buying it delivers nothing (empty function). Tutorial also jumped from step 5 to step 7, skipping "Buy Batch Size" step 6. (screenshot: play-03-end.png)

## Triangulation

GA is silent — all inference from Code review + Playtest. Both signals converge strongly on one broken system: Orchestrator upgrade promises Auto-Compile but delivers nothing (autoCompileTick empty while upgrade infrastructure fully wired). Code review is the dominant signal this iter; playtest confirmed the card is visible and purchasable in normal gameplay.

## Candidates Per Lens

### UI
- Candidate: Add "(disabled)" badge to Orchestrator card at Lv.0 so players understand / Score: 4/10 / Evidence: code review — description gap

### UX
- Candidate: Fix offline modal + tutorial overlap — showOfflineModal does not save/restore tutorial state / Score: 7/10 / Evidence: playtest play-02-mid.png

### 기획자
- Candidate: Re-implement autoCompileTick() gated on Orchestrator level — fix broken upgrade + add core idle mechanic the genre requires / Score: 9/10 / Evidence: code review (empty function, wired timer, broken description) + playtest confirms purchase path works
- Candidate: Add Compile button pulse when LoC > 0 and no compile in 30s / Score: 6/10 / Evidence: code review — manual compile is only path, easily forgotten

### 개발자
- Candidate: Re-use dead autoCompileTimer variable by implementing autoCompileTick() / Score: 8/10 / Evidence: code review
- Candidate: Fix tutorial step 6 selector skip / Score: 5/10 / Evidence: code review + playtest

### 게이머
- Candidate: Orchestrator fix shifts game from clicker to idle builder — zero automatic compute progression currently / Score: 8/10 / Evidence: playtest — manual compile loop repetitive, no sense of automatic progress

## Lens Choice Reasoning

Last 5 iters: 개발자(4) → 게이머(5) → UI(6) → UX(7) → [iter 8]. No 3-in-a-row. UX used 1 iter ago — not ideal to repeat. Highest score candidates: 기획자 (9/10) and 개발자 (8/10). Orchestrator fix spans both but primary value is game-design (making idle genre contract real). 기획자 last used iter 3 (5 iters ago) — strongest case for it now.

## Selected Improvement

**Lens**: 기획자
**Title**: Re-implement Auto-Compile via Orchestrator upgrade — fix broken idle mechanic
**Why**: autoCompileTick() is empty but Orchestrator upgrade actively charges players compute with a promise it cannot keep. Re-implementing it gated on Orchestrator level >= 1 is not confusing (player chooses to buy it), makes the upgrade shop honest, adds the idle mechanic the genre requires, and gives mid-game players a meaningful goal.
**Files to change**:
- js/production.js — implement autoCompileTick(dt) body
- js/upgrade.js — update Orchestrator description to clarify Lv.1+ enables auto-compile

**Implementation sketch**:
BASE_AUTO_COMPILE_INTERVAL = 10 seconds at Orchestrator Lv.1

function autoCompileTick(dt) {
  const orchLevel = gameState.upgrades.teamAgent.orchestrator;
  if (orchLevel === 0) return;              // disabled until bought
  if (isHaltActive()) return;
  if (gameState.loc < 1) return;

  const speedMult = 1 + orchLevel * 0.15;  // Lv.1=1.15x, Lv.5=1.75x
  autoCompileTimer += dt * speedMult;

  if (autoCompileTimer >= BASE_AUTO_COMPILE_INTERVAL) {
    compileData();
    autoCompileTimer = 0;
  }
}

Upgrade description: Lv.1+: enables Auto-Compile every 10s — 15% faster per level

**Expected impact**:
- 단기(1h 후): Players with Orchestrator upgrade see compute accumulate automatically → avg_session_sec should increase
- 장기(1주 후): upgrade_purchase/user should increase (Orchestrator becomes key buy), tutorial completion rate should improve (less manual compile tedium)

**Rollback plan**: Return early in autoCompileTick() — one-line revert. Timer is in-memory only, no state migration needed.

## Considered but Rejected
- Option A — UX: Fix offline modal + tutorial overlap: Valid issue from playtest. Rejected because UX used iter 7 (1 iter ago) and this would be the 3rd consecutive modal-suppression patch.
- Option B — 개발자: Fix tutorial step 6 selector skip: Step 6 silently skips when upgrade screen not visible. Rejected because Orchestrator fix has 3x higher game-feel impact.
