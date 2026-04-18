# Ralph Loop 구조 변경 이력

루프가 어떻게 진화해왔는지 추적. 각 변경마다 적용 iter, 이유, 무엇이 바뀌었는지.

## v1 — 초기 세팅 (iter 1~5)

**적용 기간**: 2026-04-18 09:15 ~ 14:30

**구조**:
- 5관점 고정 rotation — Iter N % 5 로 UI → UX → 기획자 → 개발자 → 게이머
- Step 1: GA 단독 분석 (`ga-snapshot.py`)
- Step 2: 단일 개선안 1개 구현
- Step 3: itch.io 배포
- 실패 시 0초 sleep (즉시 재시도), 성공 시 1h sleep
- **암묵적 LOC 캡: 200 라인** (내 프롬프트에 박힘 — 사용자 의도 아님)

**결과**: 평균 LOC 54/iter, 모두 UI 폴리싱 성격. 의미 있는 버그 수정(iter 2: 모달 중첩) 1건.

## v2 — 3-signal 전환 (iter 6~6) · commit `c479e6b`

**적용 기간**: 2026-04-18 14:30 ~ 15:32

**계기**: 사용자가 "언제 200LOC를 넣었냐"고 지적 — 내가 부당한 제약을 박은 걸 교정.

**변경**:
- ❌ `<200 LOC` 캡 제거 → "문제 심각도에 맞는 스코프로" 로 교체
- ✅ Step 1에 **3-signal 추가**: GA + Code Fresh-eye + Playtest (browse skill)
- ✅ Playtest 단계 추가 — 로컬 서버 띄우고 browse로 실제 플레이, 스크린샷 3장 저장
- ✅ Triangulation 섹션 — 3 신호가 어떻게 수렴하는지 명시
- 관점은 여전히 rotation

**결과**: iter 6 (UI) 스코프는 여전히 작았으나 품질 상승. 이후 iter 7에 바로 iter 8 결실로 이어짐.

## v3 — Multi-lens 분석 (iter 7~11) · commit `cad31e7`

**적용 기간**: 2026-04-18 15:32 ~ 19:51

**계기**: 사용자가 관점을 번갈아 쓰지 말고 한번에 보라고 요청 — rotation 제약 교정.

**변경**:
- ❌ 관점 rotation 제거 — Iter N → UX 같은 강제 없음
- ✅ 매 iter **5 렌즈 전부 평가** → `Candidates Per Lens` 섹션에 후보 5개 + 점수
- ✅ Anti-stagnation 규칙 — 같은 렌즈 3번 연속 시 다른 렌즈 고려
- ✅ Code review 파일도 per-lens 제한 해제, 5-8개 다양하게 읽기
- 구현은 여전히 Primary 1개만

**결과**: 렌즈 다양성 자동 확보 (UX → 기획자 → 기획자 → 기획자 → UX). Auto-Compile 기획자 버그(iter 8) 같은 **시스템 버그 발견** 시작.

## v4 — Multi-candidate 구현 (iter 12~) · commit `00c3f46`

**적용 기간**: 2026-04-18 19:51 ~ (현재)

**계기**: 사용자 "선택을 왜 하는거야? 다섯개 다 보면안되나?" — 단일 구현 제약 교정.

**변경**:
- ❌ Primary 1개 구현 → **score 5/10 이상 전부 구현**
- ✅ Step 1에 `Implementation Queue` 테이블 추가 (점수 내림차순)
- ✅ Step 2: Queue 순회하며 후보별 별도 commit (`feat: [ralph iter N/lens #k]`)
- ✅ 충돌 감지: 같은 파일 같은 영역 재편집 시 뒤 후보 skip
- ✅ 빌드 실패 격리: 실패 후보만 `git checkout`, 다음 후보 계속 진행
- ✅ 부분 iter 허용: 1개라도 committed 되면 배포 진행

**기대 효과**: iter당 구현 개수 1개 → 3~5개. 낭비되는 분석 제거.

---

## 기록 원칙

앞으로 run.sh 구조 변경 시 여기에 **반드시 추가**. 각 변경마다:
- 버전 태그 (v1, v2, ...)
- 적용 iter 범위
- 변경 commit 해시
- 계기 (사용자 요청 인용 포함)
- 구체적 변경사항 체크리스트
- 관찰된 결과 (가능하면)
