# Step 7: upgrade.js — AI 기술 트리

## 테스트 케이스

### TC-1: UPGRADE_DEFS 13개 정의 (agent 3 + teamAgent 3 + skill 3 + infra 4)
- 검증: `grep "baseCost" js/upgrade.js | wc -l` → 14 (13 defs + 1 usage)
- 결과: ✅ 13개 업그레이드 정의 확인

### TC-2: getUpgradeCost(category, id) 2-param 시그니처
- 검증: `grep "function getUpgradeCost" js/upgrade.js`
- 결과: ✅ function getUpgradeCost(category, id)

### TC-3: buyUpgrade(category, id) compute 기반 구매
- 검증: `grep "gameState.compute" js/upgrade.js`
- 결과: ✅ compute 차감 로직 4곳 (buyUpgrade + buyGpuSlot)

### TC-4: getGpuSlotCost() + buyGpuSlot() 존재
- 검증: `grep "function getGpuSlotCost\|function buyGpuSlot" js/upgrade.js`
- 결과: ✅ 두 함수 모두 존재

### TC-5: 기존 슬라임 함수 제거
- 검증: `grep -c "buySlime\|levelUpSlime\|buyRanchSlot\|getRanchSlotCost\|SLIME_DEFS" js/upgrade.js`
- 결과: ✅ 0 (슬라임 참조 없음)

## 상태
- [x] TC 정의 완료
- [x] 개발 완료
- [x] 테스트 통과
