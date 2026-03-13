# Step 1: tapEditor() event null 처리 + 키보드 폴백

## 변경 사항
1. `if (event)` 가드 제거
2. event가 null이면 `document.getElementById('screen-editor')`로 폴백
3. 플로팅 텍스트 위치: event 있으면 클릭 좌표, 없으면 랜덤 위치

## TC (Test Cases)

| # | 항목 | 기대 결과 | 실제 결과 | 상태 |
|---|------|----------|----------|------|
| TC-1 | event null 시 editorEl | screen-editor 요소 참조 | L69: `event ? event.currentTarget : document.getElementById('screen-editor')` | ✅ |
| TC-2 | tap-active 클래스 | event null에서도 토글됨 | L71-74: `if (editorEl)` 블록 안에서 무조건 실행 | ✅ |
| TC-3 | 플로팅 텍스트 (event null) | 랜덤 위치에 표시 | L83-84: `Math.random() * clientWidth/Height` 폴백 | ✅ |
| TC-4 | 플로팅 텍스트 (event 있음) | 클릭 위치에 표시 (기존 동작 유지) | L78-81: `event.clientX - rect.left` 유지 | ✅ |

## 실행출력

```
js/production.js L68-88:
  {
    const editorEl = event ? event.currentTarget : document.getElementById('screen-editor');
    if (editorEl) {
      editorEl.classList.remove('tap-active');
      void editorEl.offsetWidth;
      editorEl.classList.add('tap-active');
      setTimeout(() => editorEl.classList.remove('tap-active'), 150);

      if (typeof showFloatingText === 'function') {
        let fx, fy;
        if (event) {
          const rect = editorEl.getBoundingClientRect();
          fx = event.clientX - rect.left;
          fy = event.clientY - rect.top - 20;
        } else {
          fx = Math.random() * (editorEl.clientWidth * 0.6) + editorEl.clientWidth * 0.2;
          fy = Math.random() * (editorEl.clientHeight * 0.4) + editorEl.clientHeight * 0.2;
        }
        showFloatingText(fx, fy, '+' + formatNumber(tapPower) + ' LoC');
      }
    }
  }
```
