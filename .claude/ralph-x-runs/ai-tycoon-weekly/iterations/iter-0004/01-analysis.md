# Iter 4 Analysis — 개발자

_Generated: 2026-04-18T12:30_

## Snapshot Delta Table
| Metric | Current | Previous | Delta |
|---|---|---|---|
| activeUsers | N/A (empty) | N/A (empty) | — |
| newUsers | N/A (empty) | N/A (empty) | — |
| tutorial_step/user | N/A | 2.00 (baseline) | — |
| challenge_complete_rate | N/A | N/A | — |
| upgrade_purchase/user | N/A | N/A | — |
| avg_session_sec | N/A | N/A | — |

_Note: 1-day and 7-day GA windows both return empty arrays for all sections. Baseline of activeUsers=45, tutorial/user=2.00 from iter 1 is the last confirmed signal._

## Top 3 GA Findings
1. GA 1-day and 7-day snapshots return empty arrays for all sections (overview, events, purchases, ads) — property 528427024 has no recent data. Baseline of 45 active users from iter 1 is the last confirmed signal.
2. upgrade_purchase/user has no comparison data; given tutorial_step/user=2.00 baseline, most users likely never reached the upgrade purchase step.
3. challenge_complete_rate is unknown. If upgrade buttons appear disabled to users who can afford them, the motivation chain (buy batchSize -> more compute -> challenge reward) breaks before it can be measured.

## Code Fresh-eye Findings
Files read: js/main.js, js/upgrade.js, js/production.js, js/state.js, js/ui.js

1. js/main.js:592-600 — gameLoop() runs every 100ms and calls updateCurrencyDisplay() plus several update helpers, but NEVER calls renderUpgradeScreen(). The upgrade screen is a full innerHTML rebuild that only fires at startGame() and after a successful purchase. Upgrade button enabled/disabled states go stale the moment compute changes.

2. js/main.js:964-987 — renderUpgradeScreen() computes canBuy = gameState.compute >= cost at render time and burns it into static HTML as btn-disabled/btn-primary and the disabled attribute. There is no incremental update path. At game start compute=0, so all upgrade buttons render disabled and stay that way until re-navigation or a post-purchase re-render fires.

3. js/upgrade.js:47-53 — getUpgradeCost() is a pure function reading live state each call, so cost values are always accurate. The bug is that renderUpgradeScreen() only calls it at render time and encodes the result into static HTML. A 100ms game loop tick where compute crosses the threshold does not re-evaluate any button state.

4. js/ui.js:109-139 — updateCurrencyDisplay() patches HUD numbers every 100ms but explicitly does NOT touch upgrade buttons. It only updates the compile button, currency text nodes, and opacity of papers/tokens.

5. js/production.js:74-106 — compileData() calls updateCurrencyDisplay() after adding compute but does NOT call renderUpgradeScreen(). After every compile, the currency number updates in the HUD immediately, but upgrade buttons remain frozen in their initial disabled state.

## Playtest Observations
1. On game load the tutorial modal shows immediately. The upgrade screen renders in background with compute=0, setting all buttons to disabled before any play happens. (screenshot: play-01-start.png)
2. After tapping the editor 15+ times and calling compileData() via JS (compute=100), switching to the Upgrade screen showed ALL infra upgrade buttons still disabled in the aria tree. batchSize costs 50 but compute was 100 — button still showed [disabled]. A manual renderUpgradeScreen() call immediately fixed it. The daily bonus Collect modal also re-appeared when switching screens, adding a second blocking layer. (screenshot: play-02-mid.png)
3. On the Upgrade screen with stale render, batchSize showed 50 as [disabled]. Only after forcing renderUpgradeScreen() via JS did it become clickable. This is deterministic: any player who compiles then immediately visits Upgrade sees all buttons locked, likely interprets the screen as nothing to buy yet, and leaves. (screenshot: play-03-end.png)

## Triangulation
GA data is empty this iteration so Code and Playtest carry the full signal weight. The code review found a structural gap: renderUpgradeScreen() is never called in the 100ms game loop and has no incremental update path. The playtest confirmed this deterministically — after compile, upgrade buttons stayed disabled until a manual re-render. Both signals converge on the same root cause. Code signal is the strongest because the bug is fully deterministic and reproducible from zero state.

## Perspective Rotation Reason
이번 iteration 관점은 개발자. Iter 1(UI), 2(UX), 3(기획자)가 모두 non-technical concerns에 집중한 반면, 개발자 관점만이 코드 로직 버그를 발굴할 수 있다. tutorial_step/user=2.0 신호는 UI/UX 문제로 귀인됐지만, 실제 원인이 "업그레이드 버튼 항상 disabled" 코드 버그일 가능성을 개발자 관점만이 검증한다.

## Selected Improvement
**Title**: 게임루프에서 upgrade 버튼 canBuy 상태 incremental 업데이트 추가

**Why**: renderUpgradeScreen() is called at game start with compute=0 (all buttons disabled). The 100ms game loop never re-renders upgrade buttons. After compile, compute increases but buttons stay disabled until re-navigation or a purchase. Playtest confirmed: a fresh-state player who compiles then visits Upgrade sees all buttons locked including the 50-compute batchSize button they can already afford.

**Files to change**:
- `js/ui.js` — add new updateUpgradeButtonStates() function
- `js/main.js` — add updateUpgradeButtonStates() call in gameLoop(), and add data-category + data-id attrs to upgrade-card divs in renderUpgradeScreen()

**Implementation sketch**:
Add updateUpgradeButtonStates() in js/ui.js:
- Query document.querySelectorAll('.upgrade-card[data-category]')
- For each card, read data-category and data-id attributes
- Call getUpgradeCost(category, id), compare to gameState.compute
- Toggle .locked class, btn-primary/btn-disabled, and disabled attribute on the button inside
- Update lock-hint text (Need X more compute)
- Also handle GPU slot card (data-category="gpu")

In renderUpgradeScreen() (js/main.js:966), add data-category="${catId}" data-id="${id}" to each .upgrade-card div.

In gameLoop() (js/main.js:592), add:
  if (currentScreen === 'upgrade' && typeof updateUpgradeButtonStates === 'function') updateUpgradeButtonStates();

The currentScreen guard avoids wasted DOM work when user is on other screens.

**Expected impact**:
- 단기(1h 후): upgrade screen에서 batchSize 버튼 즉시 활성화 — 첫 구매 전환율 상승
- 장기(1주 후): tutorial_step/user 상승 (batchSize 구매가 tutorial step 4 trigger) + upgrade_purchase/user metric 관측 가능

**Rollback plan**: gameLoop()에서 updateUpgradeButtonStates() 호출 제거 또는 함수 내 early return 추가. 기존 renderUpgradeScreen() 로직 변경 없음. data-category/data-id 속성 추가만으로는 기능 변화 없으므로 사이드 이펙트 없음.

## Considered but Rejected
- **Option A — 게임루프에서 매 틱마다 renderUpgradeScreen() 전체 재호출**: renderUpgradeScreen()은 대형 innerHTML 문자열 빌드 + DOM 교체. 100ms마다 실행하면 렌더링 비용 높고 포커스/모달 상태가 초기화되는 부작용 우려. 기각.
- **Option B — compileData() 이후 renderUpgradeScreen() 추가 호출**: compile 시점에만 호출하므로 idle income(모델이 생산하는 LoC)으로 compute가 서서히 증가하는 케이스는 여전히 stale. 부분적 fix이므로 기각. incremental update가 더 포괄적.
