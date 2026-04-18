# Iter 4 Implementation — 개발자

## Files changed
- `js/ui.js`: updateUpgradeButtonStates() 함수 추가 — .upgrade-card[data-category] 순회하며 compute 비교 후 locked 클래스·btn-disabled·disabled 속성·lock-hint 텍스트 incremental 업데이트
- `js/main.js`: renderUpgradeScreen()의 upgrade-card에 data-category/data-id 속성 추가(GPU 포함), gameLoop()에 currentScreen === 'upgrade' 조건부 호출 추가

## Git diff summary
```
 js/main.js |  5 +++--
 js/ui.js   | 52 ++++++++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 55 insertions(+), 2 deletions(-)
```

## Full diff (key hunks)
```diff
diff --git a/js/main.js b/js/main.js
@@ -590 gameLoop()
+  if (currentScreen === 'upgrade' && typeof updateUpgradeButtonStates === 'function') updateUpgradeButtonStates();

@@ -965 renderUpgradeScreen() upgrade-card
-  <div class="upgrade-card cat-${catId} ${canBuy ? '' : 'locked'}">
+  <div class="upgrade-card cat-${catId} ${canBuy ? '' : 'locked'}" data-category="${catId}" data-id="${id}">

@@ -995 GPU card
-  <div class="upgrade-card cat-infra">
+  <div class="upgrade-card cat-infra" data-category="gpu">

diff --git a/js/ui.js b/js/ui.js
@@ +141 new function
+function updateUpgradeButtonStates() {
+  document.querySelectorAll('.upgrade-card[data-category]').forEach(card => {
+    // compute vs cost comparison, toggle locked/btn-disabled/lock-hint
+  });
+}
```

## Commit
- Hash: fe59d7af79af557977955d9a90a72e0509e0b5b1
- Message: feat: [ralph iter 4/개발자] 게임루프에서 upgrade 버튼 canBuy 상태 incremental 업데이트 추가

## Risk notes
- gameLoop() 100ms마다 querySelectorAll('.upgrade-card[data-category]') 호출 — upgrade 탭 open 시에만 실행(currentScreen guard)하므로 성능 영향 최소
- renderUpgradeScreen() 전체 재호출 없이 DOM 패치만 하므로 포커스/모달 상태 영향 없음
- data-category/data-id 속성 추가는 기존 렌더링 로직 변경 없음(사이드 이펙트 없음)

## Push status
- success
