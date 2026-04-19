# Iter 23 Analysis (multi-lens)

_Generated: 2026-04-19_

## Snapshot Delta Table
| Metric | Current (30d) | Previous (1d) | Delta |
|---|---|---|---|
| activeUsers | 45 | 0 (empty) | N/A |
| newUsers | 45 | 0 | N/A |
| tutorial_step/user | 2.00 | N/A | baseline |
| challenge_complete_rate | 87% (27/31) | N/A | baseline |
| upgrade_purchase/user | 8 events / **1 user** | N/A | critical |
| research_pull users | 9/45 (20%) | N/A | baseline |
| avg_session_sec | 124.9s | N/A | baseline |
| US (15 users) engagement | 54.4s/user avg | N/A | very low |
| Germany (8 users) engagement | 291.8s/user avg | N/A | healthy |

## Top 3 GA Findings
1. **upgrade_purchase: 8 events from 1 user only** — 44 out of 45 users (97.8%) never bought a single upgrade in 30 days. The upgrade economy loop is unreachable for almost all players.
2. **tutorial_step: 2.0/user (29 users)** — Most users stop at step 2 (tap-editor) or step 3 (compile). The 10-step tutorial has estimated <20% completion.
3. **US avg session = 54.4s vs Germany = 291.8s** — First-impression hook diverges 5x by market. 54s is barely enough to dismiss the welcome modal and tap once.

## Code Fresh-eye Findings

Files read: `js/main.js`, `js/career.js`, `js/production.js`, `js/research.js`, `js/challenge.js`, `js/state.js`, `js/tutorial.js`, `css/style.css`

1. `css/style.css:1129-1140` — `.tutorial-overlay` z-index:1000 covers full screen with dark background. Target element gets z-index:1001, but `liftAncestorStackingContexts()` only lifts ancestors with **existing** explicit z-index. Ancestors without z-index are not lifted, so the target's 1001 applies only within its un-lifted stacking context — clicks can still be intercepted by the overlay.
2. `js/tutorial.js:118` — `setTimeout(() => showTutorialStep(step), 50)` for train-tab screen switch. 50ms fires before CSS screen-exit/screen-enter animation completes; spotlight lands on in-transition element.
3. `js/state.js:10` — Default `papers: 20` + daily bonus = 25 papers on first visit. Research costs 10 papers, so players can pull before tutorial reaches step 9 (do-research), shortcircuiting the flow.
4. `js/main.js:17-18` — Mission card advances to "Compile your Code!" when `loc >= 10`. Chatbot at 2 LoC/s triggers this in 5s idle — potentially before tutorial's compile spotlight appears.
5. `js/challenge.js:294` — C-grade challenge reward = 50 compute = exactly Batch Size cost. Players who complete one challenge have upgrade money, yet upgrade_purchase = 1 user.

## Playtest Observations

1. **Welcome modal darkens entire game** (screenshot: play-01-start.png) — Players cannot see the Chatbot producing 2 LoC/s or the 25 Papers already ready for research. The game's value proposition is completely hidden on the first screen.

2. **Editor-body taps blocked during tutorial step 3 spotlight** (screenshot: play-02-mid.png) — After tutorial advanced from step 2 (tap) to step 3 (compile spotlight), 10 consecutive `.editor-body` click attempts timed out. LOC grew 146->518 via idle only (Chatbot). Rep stayed at 5 (only 1 tap total succeeded). The overlay intercepts clicks even when the spotlight moved to `.compile-btn-mini`.

3. **Tutorial step 7 of 10 spotlight mispositioned on upgrade screen** (screenshot: play-03-end.png) — Step 6 (train-tab, selector `.editor-tab:last-child`) spotlights the Tool Use upgrade card text instead of the train.js tab. The 50ms setTimeout fires before screen transition completes.

## Triangulation

All three signals converge: the tutorial overlay blocks user interaction throughout the spotlight sequence. GA shows tutorial_step/user=2.0 — drop at exactly the interaction-blocked step. Code review confirms the z-index gap. Playtest proved it empirically: 10/10 taps blocked. Code + Playtest signals are strongest; GA confirms downstream failure via upgrade_purchase=1 user.

## Candidates Per Lens

### UI
- **Candidate**: Remove dark overlay background for spotlight steps — glow-border only / Score: 8/10 / Evidence: play-01-start.png full blackout; CSS z-index blocking confirmed.

### UX
- **Candidate**: Fix tutorial spotlight interactivity — overlay must not block clicks on spotlighted element / Score: **9/10** / Evidence: 10/10 editor taps blocked in playtest; tutorial_step/user=2.0.

### 기획자
- **Candidate**: "Affordable!" pulse badge on Upgrade nav when compute >= cheapest unlockable / Score: 7/10 / Evidence: upgrade_purchase=1/45 users; players don't navigate to upgrades even with compute.

### 개발자
- **Candidate**: Fix train-tab spotlight timing: 50ms -> 300ms setTimeout / Score: 7/10 / Evidence: play-03-end.png wrong spotlight; tutorial.js:118.

### 게이머
- **Candidate**: First-compile wow: 3x compute burst + screen shake + "First Build!" toast / Score: 7/10 / Evidence: US avg 54s; players leave before any reward loop closes.

## Lens Choice Reasoning

Scores: UX(9) > UI(8) > 기획자(7) = 개발자(7) = 게이머(7). All five >= 5, all in queue.

Anti-stagnation: iter18=UX/개발자, iter19=기획자, iter20=기획자, iter21=기획자, iter22=게이머. No lens is 3+ consecutive now. UX as primary is valid and clearly highest score.

## Implementation Queue

| # | Lens | Title | Score | Files |
|---|---|---|---|---|
| 1 | UX + UI | Fix tutorial spotlight: pointer-events:none overlay + full ancestor z-index lift | 9/10 | `css/style.css`, `js/tutorial.js` |
| 2 | 기획자 | "Affordable!" pulse badge on Upgrade nav | 7/10 | `js/ui.js`, `css/style.css` |
| 3 | 개발자 | Fix train-tab spotlight: 50ms -> 300ms setTimeout | 7/10 | `js/tutorial.js` |
| 4 | 게이머 | First-compile wow: 3x burst + celebration toast | 7/10 | `js/production.js` |
| 5 | UI | Show Chatbot rate in welcome modal body | 6/10 | `js/tutorial.js` |

## Primary Improvement
**Lens**: UX + UI
**Title**: Fix tutorial spotlight — pointer-events:none overlay + ancestor z-index propagation
**Why**: tutorial_step/user=2.0 + 10/10 taps blocked in playtest. `.tutorial-overlay` z-index:1000 intercepts ALL pointer events. `liftAncestorStackingContexts` misses ancestors without existing z-index.

**Files to change**: `css/style.css`, `js/tutorial.js`

**Implementation sketch**:
1. CSS: Add `.tutorial-overlay.spotlight-mode { pointer-events: none; background: transparent; }`. Darkening comes from `.tutorial-spotlight` box-shadow — no visual change, overlay stops blocking.
2. JS `showTutorialStep`: when `s.type === 'spotlight'`, add class `spotlight-mode` to overlay.
3. JS `liftAncestorStackingContexts`: also lift positioned ancestors (position:relative/absolute/fixed) without explicit z-index — set `z-index: 1002` temporarily.

**Expected impact**:
- Short-term (1h): Tutorial spotlight steps become truly clickable; players tap, compile, buy upgrades through tutorial
- Long-term (1 week): tutorial_step/user rises from 2.0 toward 5+; upgrade_purchase 5+ users; US session up from 54s

**Rollback plan**: Remove `.spotlight-mode` CSS and JS toggle in `showTutorialStep`. No game state changes.

## Considered but Rejected
- **Option A — Shorten tutorial to 5 steps**: Root cause (overlay blocking) unchanged. Players still miss upgrades/research. Rejected.
- **Option B — Remove tutorial entirely**: upgrade_purchase=1/45 shows players don't discover features without guidance. Removing tutorial worsens discovery. Rejected.
