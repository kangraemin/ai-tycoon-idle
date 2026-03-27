# QA Check Report

> 점검일: 2026-03-27
> 프로젝트: AI Tycoon
> 스택: HTML5 + Vanilla JS, Capacitor (Android/iOS)

## 요약

| 카테고리 | Critical | Important | Minor |
|----------|----------|-----------|-------|
| 코드 로직 | 0 | 1 | 1 |
| 보안 | 0 | 0 | 1 |
| 설정/환경 | 0 | 0 | 1 |
| 의존성 | 0 | 0 | 0 |
| 코드 품질 | 0 | 1 | 1 |
| **합계** | **0** | **2** | **4** |

---

## ✅ 이전 이슈 (2026-03-15) — 모두 수정됨

- [C-1] Challenge 타이머 미정리 → `closeChallengeOverlay()` 수정 완료
- [C-2] fusion inputs.sort() 원본 변경 → `[...recipe.inputs].sort()` 수정 완료
- [I-1] BGM onended 리스너 미제거 → `current.onended = null` 처리 완료
- [I-2] isFree 판정 순서 오류 → freeChallengesUsed 증가 전 판정으로 수정 완료
- [I-3] Electron catch 빈 블록 → `console.error` 추가 완료
- [I-4] tutorial.js await 누락 → (tutorial.js에서 saveGame 직접 호출 없음, 해당 없음)

---

## Important 이슈

### [I-1] NaN 전파로 gameState.loc 손상 가능
- **파일**: `js/offline.js:15-16`, `js/offline.js:34`
- **문제**: `getLocPerSecond()`가 NaN을 반환할 경우 `offlineLoc = NaN`. `applyOfflineEarnings()`의 가드 `earnings.loc <= 0`은 NaN에 대해 false이므로 통과 → `gameState.loc += NaN`으로 상태 오염.
- **발생 조건**: 손상된 세이브 등으로 `getModelLps()`가 NaN 반환 시
- **수정 제안**: `applyOfflineEarnings()` 조건 강화:
  ```js
  if (!earnings || !Number.isFinite(earnings.loc) || earnings.loc <= 0) return;
  ```

### [I-2] startGame() 재호출 시 timer 누수
- **파일**: `js/main.js:644-645`
- **문제**: `gameLoopId`, `autoSaveId` 재할당 전 이전 인터벌 clear 없음. 앱 재시작 시 인터벌 중복 동작 가능.
- **수정 제안**:
  ```js
  if (gameLoopId) clearInterval(gameLoopId);
  if (autoSaveId) clearInterval(autoSaveId);
  gameLoopId = setInterval(gameLoop, 100);
  autoSaveId = setInterval(saveGame, AUTO_SAVE_INTERVAL);
  ```

---

## Minor 이슈

### [M-1] autoCompileTick 데드 코드
- **파일**: `js/production.js:29-31`
- **내용**: 빈 함수. 호출 여부 확인 후 삭제 권장.

### [M-2] 저장 실패 시 사용자 알림 없음
- **파일**: `js/state.js:96-97`
- **내용**: localStorage 쿼터 초과 등으로 저장 실패 시 `console.warn`만 출력. 유저가 진행 상황 손실을 알 수 없음.
- **수정 제안**: `if (typeof showToast === 'function') showToast('Save failed', 'error');` 추가.

### [M-3] escapeHtml이 따옴표 미처리
- **파일**: `js/main.js:536-538`
- **내용**: `"`, `'` 미이스케이프. 현재는 모든 데이터가 정적이라 XSS 위험 없음. 향후 동적 데이터 사용 시 취약점 가능성.

### [M-4] android/ 디렉토리가 .gitignore에 없음
- **파일**: `.gitignore`
- **내용**: `ios/`는 gitignore에 있으나 `android/`는 없음. 빌드 아티팩트가 커밋될 수 있음.

---

## TODO/FIXME 목록

- `js/main.js:194` — `# TODO: Add memory module` (CODE_LINES 배열 내 표시용 텍스트, 기능 코드 아님)
- `js/production.js:30` — `// Removed: auto-compile was confusing users` (빈 함수 주석)

---

## 점검하지 않은 영역

- Android `build.gradle` / iOS Xcode 프로젝트 설정 (스토어 배포 관련)
- Capacitor 플러그인 권한 설정 (AdMob, Push 등)
- 외부 서비스 연동 (GA4, AdMob)
- CSP(Content Security Policy) 헤더 설정
