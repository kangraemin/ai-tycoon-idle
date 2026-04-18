# Iter 8 Implementation (lens: 기획자)

## Files changed
- `js/production.js`: Implemented autoCompileTick(dt) — Orchestrator Lv.1+ triggers compileData() every 10s (scaled by 15%/level); added BASE_AUTO_COMPILE_INTERVAL constant
- `js/upgrade.js`: Updated Orchestrator description to "Lv.1+: Auto-Compile every 10s — 15% faster per level"

## Git diff summary
```
 js/production.js | 17 +++++++++++++++--
 js/upgrade.js    |  2 +-
 2 files changed, 16 insertions(+), 3 deletions(-)
```

## Full diff (key hunks)
```diff
diff --git a/js/production.js b/js/production.js
index b7e8663..af7289a 100644
--- a/js/production.js
+++ b/js/production.js
@@ -26,8 +26,21 @@ function produceTick(dt) {
   gameState.totalLoc += produced;
 }
 
-function autoCompileTick() {
-  // Removed: auto-compile was confusing users (LoC silently decreasing)
+const BASE_AUTO_COMPILE_INTERVAL = 10; // seconds at Orchestrator Lv.1
+
+function autoCompileTick(dt) {
+  const orchLevel = gameState.upgrades.teamAgent.orchestrator;
+  if (orchLevel === 0) return;
+  if (typeof isHaltActive === 'function' && isHaltActive()) return;
+  if (gameState.loc < 1) return;
+
+  const speedMult = 1 + orchLevel * 0.15;
+  autoCompileTimer += dt * speedMult;
+
+  if (autoCompileTimer >= BASE_AUTO_COMPILE_INTERVAL) {
+    compileData();
+    autoCompileTimer = 0;
+  }
 }

diff --git a/js/upgrade.js b/js/upgrade.js
index 2661e70..aa727bb 100644
--- a/js/upgrade.js
+++ b/js/upgrade.js
@@ -10,7 +10,7 @@ const UPGRADE_DEFS = {
     orchestrator: { name: 'Orchestrator', baseCost: 1500,
-      description: 'Auto-Compile runs 15% faster per level' },
+      description: 'Lv.1+: Auto-Compile every 10s — 15% faster per level' },
```

## Commit
- Hash: 1309fb366e44c102193b770bd7f9ca6e1708edef
- Message: feat: [ralph iter 8/기획자] Re-implement Auto-Compile via Orchestrator upgrade

## Risk notes
- autoCompileTick(dt) calls compileData() which resets loc to 0 — could startle players watching LoC count; mitigated by description now warning "Auto-Compile every 10s"
- Players mid-tutorial with Orchestrator already purchased will now see auto-compiles fire — safe, tutorial checks compile trigger via getTutorialTrigger() === 'sell'
- No state migration needed; autoCompileTimer is in-memory only

## Push status
- success
