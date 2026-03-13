# Step 1: 토스트 컨테이너 하단 이동 + 애니메이션 방향 반전

## 변경 사항
1. `#toast-container` top → bottom
2. `flex-direction: column` → `column-reverse`
3. `toastIn` translateY(-12px) → translateY(12px)
4. `toastOut` translateY(-12px) → translateY(12px)

## TC (Test Cases)

| # | 항목 | 기대 결과 | 실제 결과 | 상태 |
|---|------|----------|----------|------|
| TC-1 | 토스트 위치 | bottom 속성 사용, top 속성 없음 | L1253: `bottom: calc(60px + env(safe-area-inset-bottom, 0px))` | ✅ |
| TC-2 | flex-direction | column-reverse 적용 | L1258: `flex-direction: column-reverse` | ✅ |
| TC-3 | toastIn 방향 | translateY(12px) — 아래에서 진입 | L1294: `translateY(12px)` | ✅ |
| TC-4 | toastOut 방향 | translateY(12px) — 아래로 퇴장 | L1300: `translateY(12px)` | ✅ |

## 실행출력

```
css/style.css:1253:  bottom: calc(60px + env(safe-area-inset-bottom, 0px));
css/style.css:1258:  flex-direction: column-reverse;
css/style.css:1294:  0% { opacity: 0; transform: translateY(12px); }
css/style.css:1300:  100% { opacity: 0; transform: translateY(12px); }
```
