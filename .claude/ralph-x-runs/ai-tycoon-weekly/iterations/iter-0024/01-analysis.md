# Iter 24 Analysis (multi-lens)

_Generated: 2026-04-19_

## Snapshot Delta Table
| Metric | Current (30d) | Previous (1d) | Delta |
|---|---|---|---|
| activeUsers | 45 | 0 (empty) | N/A - 1d window empty |
| newUsers | 45 | 0 | N/A |
| tutorial_step/user | 2.00 | N/A | baseline only |
| challenge_complete_rate | 87% (27/31) | N/A | baseline |
| upgrade_purchase/user | 8 events / 1 user | N/A | 0% for 44/45 users |
| avg_session_sec | 124.9s | N/A | baseline |
| Germany engagement | 2334s / 8 users | -- | 291s/user highest quality traffic |
| Mobile users | 2 users / 3.3s avg | -- | near 0% mobile retention |

## Top 3 GA Findings
1. upgrade_purchase = 8 events from 1 user only (44/45 = 97.8% never bought an upgrade). Economy loop never entered.
2. tutorial_step/user = 2.0 (avg step 2 of 10). Most quit after first tap spotlight.
3. challenge completion 87% (14/18 users who started) - great once discovered, but only 40% ever tried.

## Code Fresh-eye Findings
1. tutorial.js:45 - selector .upgrade-card:first-child .btn is a DEAD SELECTOR. #upgrade-content first child is div.screen-desc not .upgrade-card. Browser confirms null match.
2. tutorial.js:146 - if (!target) { advanceTutorial(); return; } - dead selector causes tutorial to silently auto-skip step 5 (buy upgrade) for 100% of users.
3. main.js:1012 - renderUpgradeScreen() renders categories Agent (500+) first, Infra (50+) last. Batch Size (50) is 10th of 13 cards.
4. career.js:6-8 - repReq: 20K to 200K to 2M (10x each). Manual rate ~1500/hr means stage 3 takes 133 hours. Long-term prestige blocker.
5. production.js:53 - Math.ceil(5 * prestigeMultiplier) rep/tap. 400 taps for first career advance at stage 0.

## Playtest Observations
1. Initial state: 25 Papers, 0 Compute, Chatbot 2/s. Returning player guard correctly skips tutorial. Mission: Write some Code! (screenshot: play-01-start.png)
2. After taps + compile: Compute = 412, Rep = 50. Mission switches to Buy Batch Size upgrade!. Goals card: BugFarm 2%. (screenshot: play-02-mid.png)
3. On Upgrade screen: All Agent upgrades locked (Tool Use needs 87 more). Batch Size (50, affordable) requires scrolling past 9 locked cards. Browser: document.querySelector(.upgrade-card:first-child) = null; [data-category=infra][data-id=batchSize] .btn = button(50). (screenshot: play-03-end.png)

## Triangulation
Code review found the smoking gun: .upgrade-card:first-child .btn matches nothing, auto-advancing tutorial past upgrade step for every user. GA shows upgrade_purchase = 0 for 44/45 users as direct downstream consequence. Playtest confirmed layout buries Batch Size behind expensive locked cards. Code review gave strongest signal; GA confirmed consequence; playtest confirmed secondary friction.

## Candidates Per Lens

### UI
- Candidate: Reorder upgrade categories cheapest-first (Infra > Skill > Agent > Team Agent) / Score: 7/10 / Evidence: Playtest confirmed Batch Size is 10th of 13 cards

### UX
- Candidate: Fix tutorial buy-upgrade dead selector to [data-category=infra][data-id=batchSize] .btn / Score: 9/10 / Evidence: Code + browser confirm null selector; GA confirms 44/45 users never buy upgrade

### Planning (Planner)
- Candidate: Add compute readiness guard - delay upgrade tutorial step if player compute < 50 / Score: 6/10 / Evidence: First compile may only yield 10-50 compute

### Developer
- Candidate: Fix dead selector in tutorial.js:45 (overlaps UX) / Score: 9/10 / Evidence: deterministic null querySelector

### Gamer
- Candidate: Add Start Here visual indicator on Batch Size upgrade card during tutorial / Score: 5/10 / Evidence: Playtest shows Batch Size buried; players who find it are rewarded but most dont scroll

## Lens Choice Reasoning
- UX/Developer (9/10): PASS - dead selector causes 100% tutorial skip; root cause of 0% upgrade adoption.
- UI (7/10): PASS - cheapest upgrade buried as 10th card; reorder categories.
- Planner (6/10): PASS - compute guard prevents unaffordable spotlight.
- Gamer (5/10): PASS borderline - visual badge for new player discoverability.
- Anti-stagnation: Planner was primary 3x (iters 19-21), not primary this iter. UX is primary.

## Implementation Queue

| # | Lens | Title | Score | Files |
|---|---|---|---|---|
| 1 | UX/Developer | Fix tutorial buy-upgrade dead selector | 9/10 | js/tutorial.js |
| 2 | UI/Planner | Reorder upgrade categories Infra-first + compute guard | 7/10 | js/main.js |
| 3 | Gamer | Start Here highlight on Batch Size during tutorial | 5/10 | js/main.js, css/style.css |

## Primary Improvement
**Lens**: UX + Developer
**Title**: Fix tutorial buy-upgrade dead selector - target actual Batch Size button
**Why**: tutorial.js:45 selector .upgrade-card:first-child .btn matches nothing (confirmed). showTutorialStep() auto-advances when target is null. 100% of users skip the upgrade tutorial step. GA confirms 44/45 users never bought any upgrade.
**Files to change**: js/tutorial.js (line 45 selector)
**Implementation sketch**:
- Change selector from .upgrade-card:first-child .btn to [data-category=infra][data-id=batchSize] .btn
- Add compute readiness guard for buy-upgrade step: if compute < 50, delay 500ms and recheck
**Expected impact**:
- Short-term (1h): tutorial step 5 fires correctly; upgrade_purchase rises from ~2% toward 30%+
- Long-term (1 week): economy loop engagement unlocked; session length and retention improve
**Rollback plan**: Revert tutorial.js selector; same silent skip as before.

## Considered but Rejected
- Option A - Mobile-specific onboarding: 2 mobile users, 3.3s avg - too low traffic to prioritize over tutorial bug.
- Option B - Challenge discovery: 87% completion is excellent; 40% discovery rate is secondary vs 0% upgrade adoption.
