# QA Check Report

> 점검일: 2026-03-08 21:45
> 프로젝트: Slime Ranch Idle
> 스택: HTML5 + Vanilla JS + Capacitor (iOS)

## 요약

| 카테고리 | Critical | Important | Minor |
|----------|----------|-----------|-------|
| 코드 로직 | 2 | 1 | 0 |
| 보안 | 0 | 0 | 0 |
| 설정/환경 | 0 | 1 | 1 |
| 의존성 | 0 | 0 | 1 |
| 코드 품질 | 0 | 0 | 2 |
| **합계** | **2** | **2** | **4** |

## Critical 이슈

### [C-1] SFX 토글 프로퍼티명 불일치 — 사운드 끄기 불가
- **파일**: `js/ui.js:76,80` / `js/sound.js:12` / `js/state.js:40`
- **문제**: `state.js`와 `sound.js`는 `sfxOn`을 사용하지만, `ui.js`의 `showSettings()`는 `sfxEnabled`를 읽고 쓴다. 프로퍼티명이 달라 Settings에서 SFX를 토글해도 실제 사운드에 반영되지 않는다.
- **영향**: 사용자가 사운드를 끌 수 없음
- **수정 제안**: `ui.js`의 `sfxEnabled` → `sfxOn`으로 통일. `SFX.enabled` 할당도 제거.

### [C-2] 가챠 슬롯 풀일 때 젬만 차감되고 슬라임 미지급
- **파일**: `js/gacha.js:35,47-49`
- **문제**: `pullGacha()`에서 젬을 먼저 차감(line 35)한 후, 새 슬라임이고 슬롯이 꽉 찼으면 count를 증가시키지 않는다. 결과적으로 유저가 10젬을 잃고 아무것도 받지 못한다.
- **영향**: 유저 재화 손실, 게임 공정성 훼손
- **수정 제안**: 슬롯 체크를 젬 차감 전에 수행하거나, `slotFull`일 때 젬을 환불한다.

## Important 이슈

### [I-1] switchScreen() null 참조 가능성
- **파일**: `js/ui.js:18`
- **문제**: `document.querySelector([data-screen="${screen}"])` 결과가 null일 때 `.classList.add()` 호출로 TypeError 발생 가능
- **수정 제안**: `if (activeBtn)` 가드 추가

### [I-2] package.json lock 파일 없음
- **파일**: 프로젝트 루트
- **문제**: `package-lock.json`이 없어 `npm install` 시 의존성 버전이 비결정적
- **수정 제안**: `npm install` 실행 후 `package-lock.json` 커밋

## Minor 이슈

### [M-1] resetGame() 미사용 함수
- **파일**: `js/state.js:103-106`
- **내용**: `resetGame()` 함수가 정의되어 있으나 어디서도 호출되지 않음. `showSettings()`에서 `localStorage.removeItem(SAVE_KEY)` + `location.reload()`를 직접 호출하고 있음.

### [M-2] .worklogs/ gitignore 중복
- **파일**: `.gitignore`
- **내용**: `.worklogs/`가 gitignore에 포함되어 있으나, `WORKLOG_GIT_TRACK` 설정과 충돌 가능. 현재는 의도된 동작 (git 미추적).

### [M-3] Capacitor 의존성이 dependencies에 위치
- **파일**: `package.json`
- **내용**: `@capacitor/cli`는 빌드 도구로 `devDependencies`에 있는 것이 적절

### [M-4] main: "index.js" 잘못된 엔트리포인트
- **파일**: `package.json:4`
- **내용**: `"main": "index.js"` — 존재하지 않는 파일. 실질적 영향 없으나 정리 권장.

## TODO/FIXME 목록

없음.

## 점검하지 않은 영역

- CSS 스타일링 검증 (시각적 렌더링)
- iOS 네이티브 빌드 (Capacitor)
- 네트워크/외부 서비스 연동 없음
- 성능 프로파일링 (메모리 누수 등)
