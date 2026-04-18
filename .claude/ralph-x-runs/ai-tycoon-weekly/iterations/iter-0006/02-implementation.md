# Iter 6 Implementation — UI

## Files changed
- `js/tutorial.js`: Added liftAncestorStackingContexts / restoreAncestorStackingContexts helpers; called at spotlight activation and all exit paths

## Git diff summary
```
 .claude/ralph-x-runs/ai-tycoon-weekly/run.log |  6 ++++++
 js/tutorial.js                                | 23 +++++++++++++++++++++++
 2 files changed, 29 insertions(+)
```

## Full diff (key hunks)
```diff
diff --git a/js/tutorial.js b/js/tutorial.js
index a02f91e..2d8e7fb 100644
--- a/js/tutorial.js
+++ b/js/tutorial.js
@@ -147,10 +147,31 @@ function showTutorialStep(step) {
     target.style.position = 'relative';
     target.style.zIndex = '1001';
     target.dataset.tutorialTarget = 'true';
+    liftAncestorStackingContexts(target);
   }
 }
 
+function liftAncestorStackingContexts(target) {
+  let el = target.parentElement;
+  while (el && el !== document.body) {
+    const zi = parseInt(window.getComputedStyle(el).zIndex);
+    if (!isNaN(zi) && zi > 0 && zi < 1000) {
+      el.dataset.tutorialZSave = el.style.zIndex;
+      el.style.zIndex = '1002';
+    }
+    el = el.parentElement;
+  }
+}
+
+function restoreAncestorStackingContexts() {
+  document.querySelectorAll('[data-tutorial-z-save]').forEach(el => {
+    el.style.zIndex = el.dataset.tutorialZSave;
+    delete el.dataset.tutorialZSave;
+  });
+}
+
 function advanceTutorial() {
+  restoreAncestorStackingContexts();
 
 function skipTutorial() {
+  restoreAncestorStackingContexts();
 
 function endTutorial() {
+  restoreAncestorStackingContexts();
```

## Commit
- Hash: b94a37017bb9d889214a308b955a430bd1a34660
- Message: feat: [ralph iter 6/UI] Fix tutorial spotlight stacking context bug

## Risk notes
- Non-destructive: dataset.tutorialZSave saves/restores original inline z-index values
- Ancestors without inline z-index get empty string restored — same as original state
- JS-only; rollback is git revert b94a370

## Push status
- success
