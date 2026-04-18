# Iter 10 Implementation (lens: 기획자)

## Files changed
- `js/career.js`: Add getRepRate() + getTimeToAdvance() helpers; extend renderCareerScreen() to render 2 new stat cards (Rep/hr, Advance In) in the existing 2-col grid
- `js/production.js`: Show fixed-position '+10 Rep' floating text near top-bar rep-display on every compile in compileData()

## Git diff summary
```
 .claude/ralph-x-runs/ai-tycoon-weekly/run.log |  2 ++
 js/career.js                                  | 30 +++++++++++++++++++++++++++
 js/production.js                              | 16 ++++++++++++++
 3 files changed, 48 insertions(+)
```

## Full diff (key hunks)
```diff
diff --git a/js/career.js b/js/career.js
+function getRepRate() {
+  const orchLevel = gameState.upgrades?.teamAgent?.orchestrator || 0;
+  if (orchLevel === 0) return null;
+  const speedMult = 1 + orchLevel * 0.15;
+  const firesPerHour = (3600 / BASE_AUTO_COMPILE_INTERVAL) * speedMult;
+  return Math.round(firesPerHour * 10);
+}
+
+function getTimeToAdvance(repRate) {
+  const next = getNextCareer();
+  if (!next || !repRate || repRate <= 0) return null;
+  const repNeeded = next.repReq - gameState.reputation;
+  if (repNeeded <= 0) return 'Ready!';
+  const hoursNeeded = repNeeded / repRate;
+  if (hoursNeeded < 1 / 60) return '<1m';
+  if (hoursNeeded < 1) return '~' + Math.round(hoursNeeded * 60) + 'm';
+  if (hoursNeeded < 24) return '~' + hoursNeeded.toFixed(1) + 'h';
+  return '~' + Math.round(hoursNeeded / 24) + 'd';
+}

+  const repRate = getRepRate();
+  const timeToAdv = next ? getTimeToAdvance(repRate) : null;
+  // Rep/hr and Advance In cards added to .career-cards 2x2 grid

diff --git a/js/production.js b/js/production.js
+  const _repEl = document.getElementById('rep-display');
+  if (_repEl) {
+    const _rect = _repEl.getBoundingClientRect();
+    const _ft = document.createElement('div');
+    _ft.className = 'floating-text';
+    _ft.textContent = '+10 Rep';
+    _ft.style.position = 'fixed';
+    _ft.style.left = (_rect.left + _rect.width / 2) + 'px';
+    _ft.style.top = (_rect.bottom + 2) + 'px';
+    _ft.style.transform = 'translateX(-50%)';
+    _ft.style.color = 'var(--reputation)';
+    _ft.style.fontSize = '13px';
+    document.body.appendChild(_ft);
+    setTimeout(() => _ft.remove(), 1000);
+  }
```

## Commit
- Hash: da2a7a066859c9f473d55f4a929c39d48acd7478
- Message: feat: [ralph iter 10/기획자] Career progression velocity — Rep/hr + compile rep feedback

## Risk notes
- Floating text uses `position: fixed` on body — no conflict with existing showFloatingText (anchored to #screen-editor); cleaned up after 1000ms.
- getRepRate references BASE_AUTO_COMPILE_INTERVAL from production.js; load order in index.html confirms production.js loads before career.js.
- Career cards grid is already `grid-template-columns: 1fr 1fr` — 4 cards wrap into 2 rows with no CSS change.
- Tap-generated +1 rep/tap not counted in rate (minor underestimate for active players).

## Push status
- success
