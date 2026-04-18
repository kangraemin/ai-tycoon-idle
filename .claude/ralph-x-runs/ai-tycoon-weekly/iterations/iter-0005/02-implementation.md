# Iter 5 Implementation — 게이머

## Files changed
- `js/events.js`: updateFlowMeter() 함수 추가, trackTapBehavior()에서 DOM 업데이트 + 3s 자동 리셋 타이머
- `css/style.css`: #flow-meter-wrap / #flow-meter-fill / .flow-meter-hot / .editor-flash-flow 스타일 추가
- `index.html`: #screen-editor에 #flow-meter-wrap 정적 DOM 삽입 (editor-content 외부)

## Git diff summary
```
 css/style.css | 55 +++++++++++++++++++++++++++
 index.html    |  4 ++
 js/events.js  | 37 +++++++++++++++++-
 3 files changed, 95 insertions(+), 1 deletion(-)
```

## Full diff (key hunks)
```diff
diff --git a/js/events.js b/js/events.js
+let _flowMeterResetTimer = null;

+function updateFlowMeter(n) {
+  const wrap = document.getElementById('flow-meter-wrap');
+  if (!wrap) return;
+  if (n <= 0) { wrap.classList.remove('visible', 'flow-meter-hot'); return; }
+  wrap.classList.add('visible');
+  wrap.style.setProperty('--flow-pct', Math.min(n / 20 * 100, 100) + '%');
+  const label = document.getElementById('flow-meter-label');
+  if (label) label.textContent = 'fire 0/20 format';
+  if (n >= 15) wrap.classList.add('flow-meter-hot');
+  else wrap.classList.remove('flow-meter-hot');
+}

 function trackTapBehavior() {
   const now = Date.now();
-  if (now - lastTapTime > 3000) consecutiveTaps = 0;
+  if (now - lastTapTime > 3000) { consecutiveTaps = 0; updateFlowMeter(0); }
   lastTapTime = now;
   consecutiveTaps++;
+  updateFlowMeter(consecutiveTaps);
+  clearTimeout(_flowMeterResetTimer);
+  _flowMeterResetTimer = setTimeout(() => { consecutiveTaps = 0; updateFlowMeter(0); }, 3000);
   if (consecutiveTaps === 20) {
+    clearTimeout(_flowMeterResetTimer);
+    editorBody.classList.add('editor-flash-flow');
     triggerBehaviorEvent('Flow State!', 'keyboard', 'loc', 3, 20);
     consecutiveTaps = 0;
+    updateFlowMeter(0);
   }
 }

diff --git a/index.html b/index.html
+        <div id="flow-meter-wrap">
+          <div id="flow-meter-fill"></div>
+          <span id="flow-meter-label">0/20</span>
+        </div>

diff --git a/css/style.css b/css/style.css
+#flow-meter-wrap { display:none; align-items:center; gap:8px; ... }
+#flow-meter-wrap.visible { display:flex; }
+#flow-meter-fill::after { width: var(--flow-pct, 0%); background: var(--accent); transition: width 0.15s; }
+flow-meter-hot: background:#ff9800; animation:flowPulse 0.4s infinite alternate;
+.editor-flash-flow { animation: editorFlashFlow 0.6s ease-out; }
```

## Commit
- Hash: 3791216e5e125551ded12aa3aa423a8cd4bbfd40
- Message: feat: [ralph iter 5/게이머] Flow State 빌업 미터 추가

## Risk notes
- flow-meter-wrap이 editor-content 바깥에 위치하므로 renderEditorScreen() 재렌더링에 영향 없음
- _flowMeterResetTimer setTimeout이 game loop와 독립 — 백그라운드 시 타이머 지연 가능하나 UX 무해
- node --check js/events.js 통과 확인

## Push status
- success
