# QA Check Report

> 점검일: 2026-03-15
> 프로젝트: AI Tycoon
> 스택: HTML5 + Vanilla JS + Capacitor + Electron

## 요약

| 카테고리 | Critical | Important | Minor |
|----------|----------|-----------|-------|
| 코드 로직 | 2 | 2 | 1 |
| 보안 | 0 | 1 | 1 |
| 설정/환경 | 0 | 0 | 0 |
| 의존성 | 0 | 0 | 0 |
| 코드 품질 | 0 | 1 | 1 |
| **합계** | **2** | **4** | **3** |

---

## Critical 이슈

### [C-1] Challenge 오버레이 닫을 때 타이머 미정리 → 무한 submitChallenge 호출
- **파일**: `js/challenge.js:304-312`
- **문제**: `closeChallengeOverlay()`에서 `challengeTimerId`를 `clearInterval`하지 않음. 결과 UI 표시 후 Close 버튼으로 닫으면 타이머가 계속 동작하며, remaining이 0 이하가 되면 `submitChallenge('')`가 반복 호출됨.
- **영향**: 챌린지 통계 왜곡, 토큰 소모, 보상/패널티 중복 적용 가능
- **수정 제안**:
```javascript
function closeChallengeOverlay() {
  if (challengeTimerId) { clearInterval(challengeTimerId); challengeTimerId = null; }
  // ... 기존 코드
}
```

### [C-2] fusion recipe.inputs.sort()가 원본 FUSION_RECIPES 배열을 변경(mutate)
- **파일**: `js/fusion.js:64`
- **문제**: `recipe.inputs.sort().join('+')` 호출 시 `FUSION_RECIPES` 상수의 `inputs` 배열이 제자리 정렬됨. `const`로 선언했지만 배열 내용은 보호되지 않음.
- **영향**: 첫 퓨전 실행 후 일부 레시피의 inputs 순서가 바뀜. `findRecipe()`가 양방향 체크하므로 즉시 깨지진 않지만, `canFuse()` 등에서 `recipe.inputs[0]`, `[1]` 순서에 의존하는 로직이 예상과 다르게 동작할 수 있음.
- **수정 제안**:
```javascript
const recipeKey = [...recipe.inputs].sort().join('+') + '=' + recipe.result;
```

---

## Important 이슈

### [I-1] BGM 트랙 전환 시 이전 Audio 객체의 ended 리스너 미제거
- **파일**: `js/sound.js:263-271`
- **문제**: `next()`에서 이전 `current` Audio를 `pause()` → `null` 처리하지만, `ended` 이벤트 리스너를 제거하지 않음. 장시간 플레이 시 GC되지 않은 Audio 객체가 누적될 수 있음.
- **수정 제안**: `next()` 시작 부분에서 `if (current) { current.onended = null; current.pause(); current = null; }` 처리.

### [I-2] Challenge isFree 판정이 freeChallengesUsed 증가 이후에 발생
- **파일**: `js/challenge.js:88, 104`
- **문제**: line 88에서 `freeChallengesUsed++` 후 line 104에서 `isFree` 판정. Analytics에 무료/유료 챌린지가 잘못 기록될 수 있음.
- **수정 제안**: `isFree` 판정을 `freeChallengesUsed` 증가 전에 수행.

### [I-3] Electron save-manager 빈 catch 블록
- **파일**: `electron/save-manager.js:20`
- **문제**: 파일 삭제 실패 시 `catch {}` 로 에러를 완전히 무시. 디버깅 불가.
- **수정 제안**: 최소한 `catch (e) { console.error('Delete failed:', e); }` 추가.

### [I-4] tutorial.js에서 async saveGame()을 await 없이 호출
- **파일**: `js/tutorial.js:135, 151`
- **문제**: `saveGame()`은 async 함수이나 await 없이 호출. Electron 환경에서 IPC 완료 전 앱이 닫히면 저장 데이터 유실 가능.
- **수정 제안**: 해당 함수를 async로 변경하고 `await saveGame()` 사용.

---

## Minor 이슈

### [M-1] innerHTML 사용 패턴 (현재 안전, 향후 위험)
- **파일**: `js/events.js:185`, `js/career.js:140`, `js/achievements.js:99-105`, `js/tutorial.js:93,120`
- **내용**: 현재는 모든 데이터가 하드코딩이라 XSS 위험 없음. 그러나 향후 외부 데이터(번역, API 응답 등) 사용 시 escaping 없이 innerHTML에 삽입하면 취약. `escapeHtml()` 유틸이 이미 존재하므로 적용 고려.

### [M-2] challengeTimerId 중복 setInterval 방어 미흡
- **파일**: `js/challenge.js:115`
- **내용**: `startChallengeTimer()` 호출 시 기존 `challengeTimerId`를 clear하지 않고 덮어씀. 빠른 연속 호출 시 이전 interval이 orphan이 될 수 있음.

### [M-3] debug.js produceTick 래핑 다중 호출 시 체이닝
- **파일**: `js/debug.js:246-251`
- **내용**: `debugSetSpeed()` 반복 호출 시 `_originalProduceTick` 체크가 있어 무한 래핑은 방지되지만, multiplier 변경 시마다 새 wrapper가 생성됨. 디버그 전용이라 심각하지 않음.

---

## TODO/FIXME 목록

- `js/main.js:49` — `# TODO: Add memory module` (게임 내 코드 스니펫 텍스트, 실제 TODO 아님)

---

## 점검하지 않은 영역

- iOS 빌드 설정 (`ios/` 디렉토리) — Xcode 프로젝트 파일 미점검
- CSS 파일 — 기능적 버그와 무관하여 제외
- `www/` 디렉토리 — Capacitor 빌드 산출물
- 외부 서비스 연동 (GA4, AdMob) — 런타임 동작 미검증
- 테스트 파일 (`tests/`) — 테스트 자체의 품질 미점검
