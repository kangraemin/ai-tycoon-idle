# Step 8: sound.js — 키보드/컴파일 음

## 테스트 케이스

### TC-1: tap() 키보드 타이핑 사운드 (노이즈 기반)
- 검증: `grep "tap()" js/sound.js`
- 결과: ✅ playNoise + 랜덤 click tone

### TC-2: sell() → compile 성공음
- 검증: `grep "sell()" js/sound.js`
- 결과: ✅ 상승형 디지털 차임 (880→1760Hz)

### TC-3: 기존 SFX 메서드 유지 (buy, error, navigate, achievement, gachaPull, prestige, levelUp)
- 검증: `grep -c "buy()\|error()\|navigate()\|achievement()\|gachaPull()\|prestige()\|levelUp()" js/sound.js`
- 결과: ✅ 7개 메서드 모두 존재

### TC-4: Web Audio API 기반 (AudioContext)
- 검증: `grep "AudioContext" js/sound.js`
- 결과: ✅ AudioContext 사용

## 상태
- [x] TC 정의 완료
- [x] 개발 완료
- [x] 테스트 통과
