# Iter 7 Implementation (lens: UX)

## Files changed
- `js/ui.js`: Add tutorialStep guard in `checkDailyBonus()` to suppress modal and show toast instead when tutorial is not yet complete

## Git diff summary
```
 js/ui.js | 4 ++++
 1 file changed, 4 insertions(+)
```

## Full diff (key hunks)
```diff
diff --git a/js/ui.js b/js/ui.js
index 4c10aa3..ecb9c1d 100644
--- a/js/ui.js
+++ b/js/ui.js
@@ -566,6 +566,10 @@ function checkDailyBonus() {
       </div>
     </div>
   `;
+  if (gameState.tutorialStep < (typeof TUTORIAL_STEPS !== 'undefined' ? TUTORIAL_STEPS.length : 10)) {
+    if (typeof showToast === 'function') showToast(`+${papers} Papers (Daily Bonus)`, 'success');
+    return;
+  }
   showModalHtml('Daily Bonus!', streakHtml, [{ text: 'Collect!', primary: true }]);
   if (typeof SFX !== 'undefined' && SFX.levelUp) SFX.levelUp();
 }
```

## Commit
- Hash: 7ed4525b9f63adb82bc217f602518729f0f332ac
- Message: feat: [ralph iter 7/UX] Suppress Daily Bonus modal during tutorial — defer to toast

## Risk notes
- Guard uses `gameState.tutorialStep < TUTORIAL_STEPS.length` (persistent state) rather than `isTutorialActive()` (runtime flag) — intentional: `tutorialActive` is still `false` at startup when `checkDailyBonus()` runs before `startTutorial()`.
- Returning players (tutorial already complete) are unaffected — they still see the full modal.
- Papers are granted immediately regardless of tutorial state; only the modal is suppressed.

## Push status
- success
