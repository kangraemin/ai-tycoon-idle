# Step 6: main.js — 게임 루프

## 테스트 케이스

### TC-1: gameLoop() 호출 produceTick + autoCompileTick
- 검증: `grep "produceTick\|autoCompileTick" js/main.js`
- 결과: ✅ produceTick(dt) + autoCompileTick(dt) 확인

### TC-2: startGame() 초기화
- 검증: `grep "renderEditorScreen\|renderModelsScreen\|renderUpgradeScreen" js/main.js`
- 결과: ✅ 3개 함수 호출 확인

### TC-3: renderModelsScreen() 모델 그리드
- 검증: `grep "function renderModelsScreen" js/main.js`
- 결과: ✅ line 139

### TC-4: renderEditorScreen() 에디터 UI
- 검증: `grep "function renderEditorScreen" js/main.js`
- 결과: ✅ line 108

### TC-5: 기존 슬라임 렌더 함수 제거
- 검증: `grep -c "renderRanch\|SLIME_DEFS\|SLIME_ICON" js/main.js`
- 결과: ✅ 0 (슬라임 참조 없음)

## 상태
- [x] TC 정의 완료
- [x] 개발 완료
- [x] 테스트 통과
