# Iter 1 Analysis — UI

_Generated: 2026-04-18_

## Snapshot Delta Table
| Metric | Current (30d) | Previous | Delta |
|---|---|---|---|
| activeUsers | 45 | - | baseline |
| newUsers | 45 | - | baseline |
| tutorial_step/user | 2.00 | - | baseline |
| challenge_complete_rate | 87% (27/31) | - | baseline |
| upgrade_purchase/user | 0.18 (8 events, 1 user) | - | baseline |
| avg_session_sec | 125 | - | baseline |
| desktop vs mobile avg_session | 127s vs 3.3s | - | mobile bounce: critical |
| Germany engagement/user | 2334s (8 users) | - | vs US 816s (15 users) |

## Top 3 GA Findings
1. **tutorial_step/user = 2.0** — 29명이 튜토리얼을 시작했지만 평균 2단계에서 멈춤. 튜토리얼이 10단계 이상이라면 80% 이상이 초반에 이탈하는 것.
2. **mobile avg_session = 3.3초** — 모바일 2명이 평균 3.3초만 머물다 이탈. 모바일에서 게임 UI가 사실상 작동하지 않음을 시사.
3. **newUsers = activeUsers = 45 (100%)** — 재방문 유저 0명. 단 45명이 모두 신규. 리텐션이 전무하며, 첫 세션 경험이 재방문 의지를 만들지 못하고 있음.

## Perspective Rotation Reason
이번 iteration 관점은 **UI**. tutorial_step/user = 2.0이라는 수치는 튜토리얼 내용이 어렵다기보다 UI가 다음 단계를 명확히 안내하지 못한다는 신호다. 유저가 무엇을 클릭해야 할지 시각적으로 즉시 파악하지 못하면 2단계 이후에서 포기한다. 또한 리텐션 0%는 첫 세션 경험이 충분한 인상을 남기지 못했다는 뜻이며, 이는 게임 재미 이전에 UI 가독성·정보 계층 문제일 가능성이 크다.

## Selected Improvement
**Title**: 튜토리얼 단계별 시각적 하이라이트 + 진행 표시줄 추가

**Why**: tutorial_step/user = 2.0은 유저가 어디로 가야 할지 모른다는 신호. 현재 튜토리얼은 텍스트 안내만 있고 "지금 이걸 클릭해야 한다"는 강력한 시각 단서(펄싱 애니메이션, 화살표, 진행 바)가 없을 가능성이 높다. 단계 표시줄(Step N of M)을 추가하면 완주 의지도 생김.

**Files to change**:
- 튜토리얼 로직이 있는 JS 파일 (구현 단계에서 확인)
- CSS 스타일 파일 — pulse animation 추가

**Implementation sketch**:
1. 튜토리얼 타겟 엘리먼트에 .tutorial-highlight 클래스 부착 → CSS @keyframes pulse 로 테두리/글로우 효과
2. 튜토리얼 오버레이에 Step N of M 진행 표시줄 삽입
3. 화살표 아이콘을 타겟 엘리먼트 위에 절대 위치로 렌더링
4. 튜토리얼 박스 위치를 타겟 근처로 동적 이동 (getBoundingClientRect 활용)

**Expected impact**:
- 단기(1h 후): tutorial_step/user 2.0 → 3~4로 상승 (다음 단계 유도 시각 단서 제공)
- 장기(1주 후): challenge_complete_rate 유지하며 tutorial 완주율 증가 → 재방문 유저 첫 발생 가능

**Rollback plan**: .tutorial-highlight 클래스 제거 + 진행 표시줄 DOM 삭제. CSS 변경만이므로 git revert 한 커밋으로 즉시 복구.

## Considered but Rejected
- **Option A — 모바일 반응형 레이아웃 수정**: mobile avg_session 3.3초는 심각하지만, 현재 유저 44/46이 데스크탑. 모바일 유입이 적은 지금 시점에 모바일 UI에 투자하면 임팩트 작음. 데스크탑 튜토리얼 개선이 우선.
- **Option B — 첫 화면 비주얼 리디자인 (hero 섹션)**: newUsers = 100%는 첫 인상 문제를 시사하지만, 유저들이 실제로 tutorial_step 이벤트를 발생시키고 있다는 건 첫 화면은 통과했다는 뜻. 이탈은 튜토리얼 진행 도중이므로 첫 화면보다 튜토리얼 UI가 더 급함.
