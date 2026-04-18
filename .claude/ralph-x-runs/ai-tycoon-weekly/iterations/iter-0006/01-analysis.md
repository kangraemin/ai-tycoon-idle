# Iter 6 Analysis — UI

_Generated: 2026-04-18_

## Snapshot Delta Table
| Metric | Current | Previous | Delta |
|---|---|---|---|
| activeUsers | 1 | N/A | baseline |
| newUsers | 1 | N/A | baseline |
| sessions | 1 | N/A | baseline |
| avg_session_sec | 2.29 | N/A | baseline |
| userEngagementDuration | 0s | N/A | — |
| engagementRate | 0% | N/A | — |
| tutorial_step/user | ~2 (baseline) | ~2 (baseline) | no change |
| game_events/user | 0 | 0 | stuck |
| country | Cyprus | — | 1 user |
| device | desktop | — | 1 desktop |

## Top 3 GA Findings
1. **0% engagement rate**: 1 user, 2.29s session, 0 engagement seconds — user bounced before any game interaction registered.
2. **0 game events**: Only session_start, first_visit, page_view, scroll. No tap_editor, compile, or tutorial_step events. Players are not getting past the welcome screen.
3. **GA essentially silent**: 7-day window shows only 1 user total. Sample too small; leaning heavily on Code + Playtest signals.

## Code Fresh-eye Findings
1. css/style.css:73 .top-bar { z-index: 10 } + css/style.css:1137 .tutorial-overlay { z-index: 1000 } — Critical stacking context bug: .top-bar is position: sticky with z-index: 10, creating a stacking context. Tutorial step got-loc sets .compile-btn-mini (inside .top-bar) to z-index: 1001 via tutorial.js:148, but this z-index is scoped within .top-bars stacking context. Effective root z-order = 10 for button, overlay = 1000. Overlay wins, button unclickable.
2. css/style.css:887 .bottom-nav { z-index: 10 } — Same problem for tutorial steps go-upgrade (spotlights nav upgrade button) and go-research (spotlights nav models button). 3 of 10 tutorial steps are completely unclickable due to stacking context inheritance.
3. js/tutorial.js:147-148 — Target lifting target.style.zIndex = 1001 works for elements not inside a stacking-context parent, but silently fails for elements inside .top-bar and .bottom-nav. 100% of players hit this at step 3.
4. css/style.css:1227-1230 — keyframes tutorialFadeIn uses translate(-50%,-50%) for both from/to, but spotlight-mode bubbles use translateX(-50%) set inline. During fade-in the bubble briefly jumps vertically — visible jank on every spotlight transition.
5. css/style.css:131 .currency-label { font-size: 8px; opacity: 0.6 } — Near-invisible on mobile. Genuine WCAG AA violation.

## Playtest Observations
1. Welcome modal appeared and was clickable — Lets Build! button worked. Tutorial advanced to step 2 spotlight on .editor-body (not inside a stacking-context parent, so click worked). (screenshot: play-01-start.png)
2. Editor tap worked once, then tutorial advanced to Step 3 — After one editor tap, tutorial advanced to Tap Compile spotlight on .compile-btn-mini. Spotlight visual appeared correctly on button, but every click attempt timed out (5s each). Compute stayed at 0. Complete blocking wall. (screenshot: play-02-mid.png)
3. Tutorial blocked at Step 3 — Only escape is tiny Skip text (12px muted). No feedback that button is broken. Players assume the game is broken and leave. Session ends ~2.29s — matching GA data exactly. (screenshot: play-03-end.png)

## Triangulation
GA is silent (1 user, 0 game events, 2.29s). Code review and playtest both converge with 100% confidence: tutorial spotlight steps targeting elements inside .top-bar/.bottom-nav (z-index:10) are unclickable because the overlay (z-index:1000) covers them. Playtest confirmed in real-time — click timed out at Step 3. Code review explains exactly why and identifies 3 affected steps. Playtest and code review are the dominant signals; GA adds indirect confirmation.

## Perspective Rotation Reason
This iterations perspective is UI. Despite being a CSS/JS stacking context mechanism, it manifests as a pure UI failure: the spotlight looks correct visually but the interaction is broken. A UI-perspective review reads z-index values, checks stacking contexts, and verifies visual affordances match actual interactability — which is exactly what uncovered this. The GA signal (0 game events) + playtest (click timeout at step 3) connect directly: the unclickable highlighted button is the specific drop point causing 100% tutorial abandonment.

## Selected Improvement
**Title**: Fix tutorial spotlight stacking context — lift ancestor z-indexes for .top-bar and .bottom-nav targets

**Why**: Tutorial steps 3 (compile), 5 (go-upgrade), and 8 (go-research) spotlight elements inside .top-bar/.bottom-nav (z-index:10) which are below the tutorial overlay (z-index:1000). Spotlight looks correct but overlay blocks all clicks. 100% of players hit this wall at step 3. 0 game events in GA confirms nobody gets past the tutorial gate.

**Files to change**:
- js/tutorial.js

**Implementation sketch**:
Add two helpers:
  function liftAncestorStackingContexts(target) {
    let el = target.parentElement;
    while (el and el !== document.body) {
      const zi = parseInt(window.getComputedStyle(el).zIndex);
      if (!isNaN(zi) and zi > 0 and zi < 1000) {
        el.dataset.tutorialZSave = el.style.zIndex;
        el.style.zIndex = 1002;
      }
      el = el.parentElement;
    }
  }
  function restoreAncestorStackingContexts() {
    document.querySelectorAll([data-tutorial-z-save]).forEach(el => {
      el.style.zIndex = el.dataset.tutorialZSave;
      delete el.dataset.tutorialZSave;
    });
  }
Call liftAncestorStackingContexts(target) after target.style.zIndex = 1001 in showTutorialStep. Call restoreAncestorStackingContexts() at the top of advanceTutorial, skipTutorial, and endTutorial.

**Expected impact**:
- Short term (1h): Tutorial steps 3, 5, 8 become clickable; players complete tutorial; compile and navigate events appear in GA
- Long term (1 week): tutorial_complete rate rises from ~0%; avg_session_sec increases from 2.29s to 60s+; game events/user increases

**Rollback plan**: git revert the tutorial.js commit. dataset approach is non-destructive.

## Considered but Rejected
- **Option A — Fix tutorialFadeIn vertical jump**: keyframes uses translate(-50%,-50%) but spotlight bubbles only need translateX(-50%), causing brief vertical jump per transition. Real UI issue but minor jank vs complete interaction block. Fix the gate first.
- **Option B — Improve currency-label contrast (8px, 0.6 opacity)**: Labels at 8px x 60% opacity violate WCAG AA. Genuine UI quality issue, but players never reach game UI because they are stuck at tutorial step 3. Fix the gate first.
