# Iter 3 Analysis — 기획자

_Generated: 2026-04-18_

## Snapshot Delta Table
| Metric | Current (1-day) | Previous (1-day) | Delta |
|---|---|---|---|
| activeUsers | 0 | 0 | 0 (GA empty — 1-day window too narrow) |
| newUsers | 0 | 0 | 0 |
| **30-day baseline** | **value** | | |
| activeUsers (30d) | 45 | — | baseline |
| newUsers (30d) | 45 | — | 100% new, 0 returning |
| sessions (30d) | 46 | — | 1.02 sessions/user |
| avg_session_sec (30d) | 125s | — | ~2 min |
| research_pull reach | 9/45 users (20%) | — | 80% never reach gacha |
| gpu_expansion reach | 7/45 users (15.6%) | — | 84% blocked at GPU wall |
| upgrade_purchase reach | 1/45 users (2.2%) | — | 98% never buy an upgrade |
| tutorial_step/user | 2.0 (58 steps/29 users) | 2.0 (iter 2) | 0.00 |

## Top 3 GA Findings
1. **Research gacha reach: only 20%** — 9/45 users ever fired research_pull, averaging 8.67 pulls each. The 80% who never pulled all hit the GPU wall (chatbot fills the only slot at start). The 7 users who expanded GPU drove virtually all 78 pulls.
2. **Upgrade system invisible to 98%** — only 1/45 users bought an upgrade despite the "You can afford an upgrade!" mission hint. That 1 power-user bought 8 upgrades, proving once discovered upgrades are sticky — but the screen never gets opened by 98%.
3. **0 returning users in 30 days** — sessions (46) ≈ users (45). Sessions/user = 1.02. Nobody comes back. The daily bonus (checkDailyBonus in ui.js) exists but never fires for returning players because no players return.

## Code Fresh-eye Findings
기획자 관점으로 읽은 파일: js/state.js, js/research.js, js/production.js, js/upgrade.js, js/model.js, js/events.js, js/main.js

1. `js/state.js:39` — `gpuSlots: 1` + chatbot count=1 at start means GPU is immediately full. `getOwnedModels()` returns 1, maxSlots=1, so `owned >= maxSlots` = true on research.js line 58. Every new player hits GPU full wall before a single research pull. The research mission in main.js line 26 guides players to research once papers>=10, but the destination is always blocked.

2. `js/research.js:54-63` — The slotFull check only triggers for new models (modelState.count === 0). Chatbot duplicates bypass it since chatbot is already count=1. So 5% of pulls are hallucinations (refunded), 40% are common (mostly chatbot duplicate — LPS gain = sqrt(2) ≈ 1.41x, nearly invisible), and only 60% would need a free slot. Players spending 10 scarce Papers on chatbot duplicates while their first real discovery is blocked is a doubly bad experience.

3. `js/upgrade.js:3-25` — INFRA category (Batch Size baseCost=50) is the 4th and last category rendered. Players arriving with 300-400 compute see AGENT (500/800/1200), TEAM AGENT (1000/1500/2000), SKILL (300/600/1000) first — all "Need X more compute." INFRA's 50-compute Batch Size is below the fold. Explains 98% upgrade-miss rate despite the affordability hint.

4. `js/ui.js:484-518` — `checkDailyBonus()` exists and fires on load. But rewards are Papers-only: [5, 8, 12, 15], capping at day 4. No Compute rewards (the actual bottleneck resource), no 7-day arc, no "come back tomorrow" preview. Even if players return, the bonus is too weak to reinforce the habit.

5. `js/events.js:23` — `EVENT_SPAWN_MIN = 120s`. First event fires at 2-5 min. With avg session = 125s, roughly 50% of sessions end before any event fires. Players never experience the fix-event engagement loop.

## Playtest Observations

1. **Research immediately blocked on fresh start** — every new game starts with GPU full (chatbot fills slot 1/1). Research screen first shows "GPU full — Go to Upgrades (500 Compute)". With 2 LPS production, earning 500 compute takes multiple compiles over several minutes. Players never experience the gacha discovery hook in session 1. (screenshot: play-01-start.png)

2. **Upgrade screen shows only locked messages on first view** — visiting with 357 compute shows Tool Use (Need 192 more), Memory (Need 492 more), Planning (Need 892 more). All locked. INFRA Batch Size (50 compute, affordable) is below the fold. Players interpret "all locked" and leave. (screenshot: play-03-end.png)

3. **Tutorial modal re-triggered over upgrade screen** — navigating to upgrades mid-session triggered "Step 1 of 10 — Welcome to AI Tycoon!" modal over content, blocking the screen. (screenshot: play-02-mid.png)

## Triangulation

GA is the strongest signal: the 20% research-reach stat directly maps to the gpuSlots=1 structural wall found in code review, and playtest confirms it viscerally — the first action in Research is a "GPU full" dead end. All 3 signals converge: the game's most exciting feature (gacha discovery) is inaccessible to 80% of players. The upgrade-invisibility finding (98% miss rate) is a secondary signal rooted in the same issue: critical economy systems are buried below the fold in a 2-minute session.

## Perspective Rotation Reason

기획자 is the right lens for iter 3 because the problem is loop design, not visual polish (UI) or interaction friction (UX). The core idle arc is: tap → compile → research → new model → more production → repeat. This loop is broken at step 3 for 80% of players because of a balance decision (gpuSlots=1). That's a 기획자 problem: starting economy conditions sabotage the intended progression arc. The 9 users who reached research averaged 8.67 pulls — proof the mechanic is compelling once accessible. Unblocking it for new players is precisely the loop-design fix that belongs to the 기획자 perspective.

## Selected Improvement
**Title**: Start with 2 GPU slots + soft pity on first research pull

**Why**: GA shows 80% of players never reach research because gpuSlots=1 (chatbot fills it immediately). The 20% who expanded GPU averaged 8.67 research pulls — proof the mechanic is compelling once accessible. Starting with 2 slots costs nothing balance-wise (players still work for slot 3 at 500 compute) but ensures every new player can discover their first non-chatbot model in session 1. A soft pity on pull #1 (skip hallucination, guarantee uncommon+ model) prevents the demotivating "Duplicate — now x2" first experience.

**Files to change**:
- `js/state.js` — change `gpuSlots: 1` to `gpuSlots: 2`
- `js/research.js` — add first-pull pity: if `gameState.stats.gachaPulls === 0`, skip hallucination and guarantee rarity >= uncommon

**Implementation sketch**:
- `state.js line 39`: `gpuSlots: 2`
- `research.js rollResearch()`: before the normal roll, check `if (gameState.stats && gameState.stats.gachaPulls === 0)` — skip hallucination, force rarity to 'uncommon' or 'rare' (weight 70/30), return a candidate from those rarities.
- Pity applies only once: gachaPulls === 0 check runs before `gameState.stats.gachaPulls++` in pullResearch().
- No new UI needed — existing "New model discovered!" reveal flow handles the celebration.

**Expected impact**:
- 단기(1h 후): research_pull reach rate rises from 20% toward 60%+ (any player following the mission card now gets through); first pull gives an exciting new model instead of chatbot duplicate
- 장기(1주 후): avg_session_sec likely moves from 125s toward 200s+ as players stay to explore their new model; challenge/upgrade engagement may follow as players are deeper in the loop

**Rollback plan**: Revert `gpuSlots: 2 → 1` in state.js and remove the pity check in `rollResearch()`. Existing save files keep gpuSlots: 2 (no harm), only new games are affected. Zero migration needed.

## Considered but Rejected
- **Option A — Sort upgrade screen to surface affordable items first**: Addresses 98% upgrade-miss but is secondary — even with upgrades accessible, players still hit the GPU wall. Fix GPU wall first; upgrade screen sort can be iter 4.
- **Option B — Daily Bonus Overhaul (add Compute rewards, 7-day streak)**: Relevant for D7 retention, but retention requires compelling session 1 first. Daily bonus only fires for returning players; if nobody returns, nothing to optimize. Fix the first-session hook first.
