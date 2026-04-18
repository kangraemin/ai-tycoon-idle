# Iter 11 Implementation (lens: UX)

## Files changed
- `js/main.js`: Fix totalTaps gate in getCurrentMission() + READY! badge in goal card render/update
- `js/hints.js`: Suppress hint banner when mission card provides an actionable screen target
- `css/style.css`: Add .goal-pct-ready accent style

## Git diff summary
```
 css/style.css | 6 ++++++
 js/hints.js   | 7 +++++++
 js/main.js    | 7 ++++---
 3 files changed, 17 insertions(+), 3 deletions(-)
```

## Full diff (key hunks)
```diff
diff --git a/js/main.js b/js/main.js
-  if (!st.stats || st.stats.totalTaps < 10)
+  if (!st.stats || (st.stats.totalTaps < 10 && st.compute < 30 && st.loc < 30))

-      <span class="goal-pct" id="gp-${mainItem.key}">${pct}%</span>
+      <span class="goal-pct${pct === 100 ? ' goal-pct-ready' : ''}" id="gp-${mainItem.key}">${pct === 100 ? 'READY!' : pct + '%'}</span>

-    pct_el.textContent = pct + '%';
+    pct_el.textContent = pct === 100 ? 'READY!' : pct + '%';
+    pct_el.classList.toggle('goal-pct-ready', pct === 100);

diff --git a/js/hints.js b/js/hints.js
+  const activeMission = typeof getCurrentMission === 'function' ? getCurrentMission() : null;
+  if (activeMission && activeMission.screen) {
+    banner.style.display = 'none';
+    return;
+  }

diff --git a/css/style.css b/css/style.css
+.goal-pct-ready {
+  color: var(--accent);
+  font-size: 10px;
+  letter-spacing: 0.5px;
+}
```

## Commit
- Hash: 86db3c2f348e8b6f08fc1ce54247b7a3f6dd961a
- Message: feat: [ralph iter 11/UX] Fix mission card staleness + resolve 3-CTA conflict

## Risk notes
- totalTaps gate relaxed: players with 0 taps but compute >= 30 or loc >= 30 (idle-only) now see correct downstream missions immediately — intended.
- Hint banner suppression is broad: any mission with screen silences hint banner. Hints without a competing mission remain unaffected when no actionable mission is present.
- READY! badge triggers at exactly 100% — no fractional issue since Math.floor is already applied upstream.

## Push status
- success
