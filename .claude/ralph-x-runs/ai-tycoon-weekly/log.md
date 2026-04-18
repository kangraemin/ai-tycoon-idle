# AI Tycoon 자동 개선 루프 — Work Log

## 관점 Rotation
Iter N의 관점 = ["UI", "UX", "기획자", "개발자", "게이머"][(N-1) mod 5]

- **UI** — 가독성, 색·대비, 정보 계층, 버튼 위치/크기, 폰트, 여백
- **UX** — 플로우 마찰, 튜토리얼 UX, 클릭 동선, 애니메이션 타이밍, 피드백 가시성
- **기획자** — 게임 밸런스, 보상감, 루프 설계, 경제 곡선, 난이도, 컨텐츠 깊이
- **개발자** — 코드 품질, 버그, 성능, 기술 부채, 에러 핸들링, 리팩토링
- **게이머** — 재미, 중독성, 숨겨진 즐거움, 리드아웃, 몰입감, 체감 보상

## 기록 구조
각 iteration마다 `iterations/iter-NNN/` 아래:
- `01-analysis.md` — 스냅샷 델타 수치표 + 선정 개선안 + 기각된 대안 + 관점 선택 이유
- `02-implementation.md` — 변경 파일 + git diff + 커밋 해시 + 리스크
- `03-deploy.md` — 빌드 체크 결과 + 배포 output + URL
- `deploy-success` (marker) — 존재 시 성공 → 1h sleep, 없으면 즉시 재시도

## 실행 로그 (iteration별 요약)

---


## Iter 1 — UI — 2026-04-18T09:15
- [ANALYZE] 튜토리얼 단계별 시각적 하이라이트 + 진행 표시줄 추가
- Delta: activeUsers baseline=45, tutorial/user baseline=2.00
- Rotation reason: tutorial_step/user=2.0 → UI가 다음 단계 안내 실패. 리텐션 0%는 첫 세션 UI 인상 부족 신호.
- [IMPLEMENT] 9038e46 — feat: [ralph iter 1/UI] 튜토리얼 진행 표시줄 + 스포트라이트 펄스 + 방향 화살표 추가
- Files: js/tutorial.js, css/style.css
- LOC: +54/-2
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 2 — UX — 2026-04-18T10:15
- [ANALYZE] Suppress unlock fanfare modals during active tutorial (modal-on-modal collision fix)
- Delta: activeUsers N/A->N/A (GA empty), tutorial/user 2.00->N/A (baseline only)
- Rotation reason: Double-modal collision on step 1 is deterministic UX failure affecting 100% of new players; tutorial_step/user=2.0 baseline is consistent with this being the drop cause

- [IMPLEMENT] 92cdeff — feat: [ralph iter 2/UX] suppress unlock fanfare during active tutorial
- Files: js/ui.js
- LOC: +5/-0
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 3 — 기획자 — 2026-04-18T11:04
- [ANALYZE] Start with 2 GPU slots + soft pity on first research pull
- Delta: activeUsers 45->N/A (1-day GA empty), research_pull reach 20% (9/45 users), gpu_expansion reach 15.6% (7/45 users)
- Rotation reason: loop broken at step 3 for 80% of players — gpuSlots=1 structural wall confirmed by GA (20% reach) + code review + playtest

- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 4 — 개발자 — 2026-04-18T12:30
- [ANALYZE] 게임루프에서 upgrade 버튼 canBuy 상태 incremental 업데이트 추가
- Delta: activeUsers N/A (GA empty), tutorial/user 2.00->N/A (baseline only)
- Rotation reason: 코드 로직 버그(업그레이드 버튼 stale disabled) — 개발자 관점만이 검증 가능한 deterministic 전환 킬러

- [IMPLEMENT] fe59d7a — feat: [ralph iter 4/개발자] 게임루프에서 upgrade 버튼 canBuy 상태 incremental 업데이트 추가
- Files: js/ui.js, js/main.js
- LOC: +55/-2
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 5 — 게이머 — 2026-04-18T13:30
- [ANALYZE] Flow State 빌업 미터 — 연속 탭 진행도를 에디터 UI에 시각화
- Delta: activeUsers 0->1 (1 bounce 2.29s, 0 game events), avg_session_sec 0->2.29
- Rotation reason: 탭 루프가 단조로움 — Flow State 보상이 완전히 숨겨져 있음. 게이머 관점만이 발견 가능한 체험적 신호.

- [IMPLEMENT] 3791216 — feat: [ralph iter 5/게이머] Flow State 빌업 미터 추가
- Files: js/events.js, css/style.css, index.html
- LOC: +95/-1
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 6 — UI — 2026-04-18T14:36
- [ANALYZE] Fix tutorial spotlight stacking context — lift ancestor z-indexes for .top-bar and .bottom-nav targets
- Delta: activeUsers 0->1 (1 bounce, 2.29s, 0 game events), game_events/user stuck at 0
- Rotation reason: Tutorial steps 3/5/8 unclickable (z-index:10 parent < overlay z-index:1000) — UI perspective catches visual-vs-interactive discrepancy

- [IMPLEMENT] b94a370 — Fix tutorial spotlight stacking context (lift .top-bar/.bottom-nav z-index above overlay)
- Files: js/tutorial.js
- LOC: +23/-0
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 7 — UX — 2026-04-18T15:32
- [ANALYZE] Suppress Daily Bonus modal during tutorial — defer to toast
- Delta: activeUsers 1->0 (1d window empty), tutorial/user N/A (0 game events from only visitor)
- Lens choice reasoning: Daily Bonus + Tutorial modal collision confirmed by playtest (play-02-mid.png) — affects 100% of day-1 users; UX last used iter 2, 5 iters ago
- [IMPLEMENT] UX | 7ed4525 — Suppress Daily Bonus modal during tutorial — defer to toast
- Files: js/ui.js
- LOC: +4/-0

## Iter 8 — 기획자 — 2026-04-18T16:00
- [ANALYZE] Re-implement Auto-Compile via Orchestrator upgrade — fix broken idle mechanic
- Delta: activeUsers 1->0 (1d empty), game_events/user stuck at 0
- Lens choice reasoning: 기획자 — Orchestrator upgrade charges compute but autoCompileTick() is empty; idle mechanic promise broken. 기획자 last used iter 3 (5 iters ago). UX avoided (used iter 7).

- [IMPLEMENT] 기획자 | 1309fb3 — Re-implement Auto-Compile via Orchestrator upgrade
- Files: js/production.js, js/upgrade.js
- LOC: +16/-3
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 9 — 게이머 — 2026-04-18T17:08
- [SKIPPED] 02-implementation.md 없음 — 구현 단계 미완료

## Iter 10 — 기획자 — 2026-04-18T18:00
- [ANALYZE] Career Progression Velocity — Rep rate display + compile rep feedback
- Delta: activeUsers 1->1 (no change), game_events/user 0->0 (still silent), avg_session_sec 2.29->2.29
- Lens choice reasoning: 기획자 — career screen shows 11/10,000 Rep with zero velocity info; compileData() adds +10 rep silently; idle game players quit when they cannot perceive progress. 기획자 last completed iter 8, highest candidate score 9/10.

- [IMPLEMENT] 기획자 | da2a7a0 — Career progression velocity: Rep/hr + compile rep feedback
- Files: js/career.js, js/production.js
- LOC: +46/-0
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 11 — UX — 2026-04-18T19:00
- [ANALYZE] Fix mission card staleness — remove totalTaps gate + resolve three competing CTAs
- Delta: activeUsers 0→0 (GA silent), tutorial/user N/A→N/A
- Lens choice reasoning: UX — main.js:14의 totalTaps < 10 게이트가 idle 유저의 올바른 미션 안내 전면 차단. Code + Playtest 양측 확인. 기획자 2회 연속 후 UX 전환.
- [IMPLEMENT] UX | 86db3c2 — Fix mission card staleness + resolve 3-CTA conflict
- Files: js/main.js, js/hints.js, css/style.css
- LOC: +17/-3
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 12 — 개발자 — 2026-04-18T20:00
- [ANALYZE] Fix save/load: persist shownUnlockModals + dailyStreak + tutorial re-trigger guard
- Delta: activeUsers 0→0 (GA silent), tutorial/user N/A→N/A
- Lens choice reasoning: 개발자 — three confirmed save/load bugs (shownUnlockModals reset, dailyStreak reset, tutorialStep:0 re-triggers welcome modal for returning players). Last used iter 4 (8 iters ago). Playtest confirmed tutorial modal firing for player with 28 papers.
- [IMPLEMENT-SUMMARY] Attempted 2, Committed 2, Skipped 0+0
- [IMPLEMENT 1/2] 개발자 7643e01 — Fix save/load persistence + tutorial re-trigger guard (LOC +12/-1)
- [IMPLEMENT 2/2] 게이머 55ae566 — Flow State 20-tap milestone: hold meter + FLOW! label 1s (LOC +29/-1)
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 13 - UX/개발자 - 2026-04-18T21:15
- [ANALYZE] Fix Research Unlocked modal blocking new players: reorder checkDailyBonus after startTutorial + remove papers > 20 tutorial guard
- Delta: activeUsers 0->0 (GA silent), tutorial/user N/A->N/A
- Lens choice reasoning: UX/개발자 - checkDailyBonus() before startTutorial() causes papers=25 > 20 guard to skip tutorial; without isTutorialActive()=true, Research Unlocked modal blocks 100% of new players before first tap. Deterministic failure confirmed by code + playtest. Impl queue: UX(9) + 개발자(8) unified, 게이머(6), 기획자(5).
- [IMPLEMENT-SUMMARY] Attempted 3, Committed 3, Skipped 0+0
- [IMPLEMENT 1/3] UX/개발자 bf8f7aa — Fix Research Unlocked modal: reorder checkDailyBonus + fix tutorial guard (LOC +3/-3)
- [IMPLEMENT 2/3] 게이머 4eb1710 — Add reward hint to Challenge button label (LOC +1/-0)
- [IMPLEMENT 3/3] 기획자 5291de4 — Show tap/compile rep rate on Career screen (LOC +1/-1)
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 14 -- UX/기획자 -- 2026-04-18T22:30
- [ANALYZE] Fix train-tab hint/mission gate: papers < 20 -> papers < 50 (main.js + hints.js)
- Delta: activeUsers 0->0 (GA silent), tutorial/user N/A->N/A
- Lens choice reasoning: papers < 20 gate in both main.js:23 and hints.js:80 blocks 100% of players starting with >=20 papers from seeing train.js guidance -- confirmed by code + playtest. Developer gpuSlots=2 fix and Gamer +1 Rep float also in queue.
- [IMPLEMENT-SUMMARY] Attempted 3, Committed 3, Skipped 0+0
- [IMPLEMENT 1/3] UX/Planner 75b210f — Fix train-tab hint/mission gate papers<20->papers<50 (LOC +2/-2)
- [IMPLEMENT 2/3] Developer 4ea5df0 — Fix gpuSlots reset to 2 on career advance (LOC +1/-1)
- [IMPLEMENT 3/3] UI/Gamer a187743 — Add +1 Rep floating text on each editor tap (LOC +1/-0)
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 15 -- 기획자/UI/UX/개발자/게이머 -- 2026-04-18T23:30
- [ANALYZE] Primary: Rebalance Rep gain rate (+5/tap +50/compile, repReq 10K->2K) — career prestige loop unreachable at current rates
- Delta: activeUsers 0->0 (GA silent), tutorial/user N/A->N/A
- Lens choice reasoning: 기획자(9) — career advance requires 67+ sessions at current rep rate; systemic balance blocker. UI/개발자(8) — rep-display DOM element missing, compile floating text silently broken. UX(7) — hallucination event fires within 60s on stale lastEventTime. 개발자+게이머(5) — first-compile paper bug + flow meter dead state. All 5 lenses scored >=5, all in queue.
- [IMPLEMENT-SUMMARY] Attempted 5, Committed 5, Skipped 0+0
- [IMPLEMENT 1/5] 기획자 5ce3692 — Rebalance Rep gain: +5/tap +50/compile, repReq 5x reduction (LOC +12/-12)
- [IMPLEMENT 2/5] UI/개발자 9ca7889 — Add rep-display slot to top-bar HUD (LOC +7/-0)
- [IMPLEMENT 3/5] UX 489d761 — Fix stale lastEventTime + hallucination early-game guard (LOC +8/-3)
- [IMPLEMENT 4/5] 개발자 e7a4d8b — Fix first-compile paper bonus off-by-one (LOC +2/-2)
- [IMPLEMENT 5/5] 게이머 d44cb18 — Hide flow meter label when consecutiveTaps=0 (LOC +2/-0)
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 16 - 개발자/UX/UI/기획자/게이머 - 2026-04-19T00:47
- [ANALYZE] Primary: Fix stale lastEventTime clamp (events.js:45) - immediate event fires on every load
- Delta: activeUsers 0->0 (GA silent), tutorial/user N/A->N/A
- Lens choice reasoning: 개발자(9) - deterministic bug: New Regulation fires within 60s on every session. UX(8) - no isTutorialActive guard in eventTick. UI(8) - career.js:165 shows +1/+10 but iter15 changed to +5/+50 (5x wrong). 기획자(6) - career Advance In shows -- for all new players. 게이머(6) - step 7 spotlight targets wrong element.
- [IMPLEMENT-SUMMARY] Attempted 5, Committed 5, Skipped 0+0
- [IMPLEMENT 1/5] 개발자 c534dc0 — Fix stale lastEventTime clamp SPAWN_MAX->SPAWN_MIN (LOC +1/-1)
- [IMPLEMENT 2/5] UX 23b2e84 — Suppress events during active tutorial (LOC +1/-0)
- [IMPLEMENT 3/5] UI 6a254e1 — Fix career rep-rate subtext +1/+10->+5/+50 (LOC +1/-1)
- [IMPLEMENT 4/5] 기획자 089cbe0 — Career Advance-In hint for manual players (LOC +1/-1)
- [IMPLEMENT 5/5] 게이머 98ec5c2 — Fix tutorial step 7 spotlight target (LOC +4/-0)
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 17 — 기획자/UI/UX/개발자/게이머 — 2026-04-19T
- [ANALYZE] Fix Mission/Goals card guidance conflict (Primary: 기획자 8/10)
- Delta: activeUsers 0->0 (GA completely silent both snapshots), tutorial/user N/A->N/A
- Lens choice reasoning: 기획자(8) — getNextGoalItems() independent of getCurrentMission() causes "Buy Batch Size" vs "Unlock Translator READY!" conflict after first compile; confirmed by playtest. UI(7)+UX(7)+개발자(6)+게이머(6) all >= 5, all in queue. Last 5 iters covered all lenses, no rotation needed.
- [IMPLEMENT-SUMMARY] Attempted 5, Committed 5, Skipped 0+0
- [IMPLEMENT 1/5] 기획자 be0cfcb — Fix Mission/Goals card guidance conflict (LOC +22/-17)
- [IMPLEMENT 2/5] UI d2cb4fd — Move Challenge area below editor body (LOC +22/-22)
- [IMPLEMENT 3/5] UX 4320a78 — Dynamic compile button mode label (LOC +8/-0)
- [IMPLEMENT 4/5] 개발자 ead21c4 — Manual rep rate estimate in Career Advance In (LOC +6/-2)
- [IMPLEMENT 5/5] 게이머 7462519 — Challenge discoverability: hint after tutorial (LOC +12/-0)
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 18 — UX/개발자/기획자/UI/게이머 — 2026-04-19T03:44
- [ANALYZE] Tutorial step 7 spotlight timing fix (primary: UX/개발자 9/10)
- Delta: activeUsers 0->0 (GA completely silent), tutorial/user N/A->N/A
- Lens choice reasoning: UX/개발자(9) — tutorial step 7 spotlight mispositioned on upgrade screen (currentScreen guard + setTimeout fix needed); UX(8) — hint banner shows during tutorial (missing isTutorialActive guard); 기획자(7) — compile-code hint duplicates mission card; UI(6) — token display ambiguous; 게이머(6) — bestGrade unused in challenge button. All 5 lenses >= 5, all in queue.
- [IMPLEMENT-SUMMARY] Attempted 5, Committed 5, Skipped 0+0
- [IMPLEMENT 1/5] UX/개발자 ff3621f — Tutorial step 7 currentScreen guard + setTimeout (LOC +5/-1)
- [IMPLEMENT 2/5] UX 388c7d2 — Hint banner isTutorialActive suppress during tutorial (LOC +5/-0)
- [IMPLEMENT 3/5] 기획자 14810cf — Suppress compile-code hint when mission compile active (LOC +5/-1)
- [IMPLEMENT 4/5] UI fbed71b — Token display N/10 format + hide countdown at max (LOC +3/-2)
- [IMPLEMENT 5/5] 게이머 5091549 — Challenge button show bestGrade after first play (LOC +4/-1)
- [DEPLOY] success — https://ramang.itch.io/ai-tycoon

## Iter 19 — 기획자 — 2026-04-19T
- [ANALYZE] Rep gain scales with prestige multiplier (primary: 기획자 9/10)
- Delta: activeUsers 0->0 (GA completely silent both snapshots), tutorial/user N/A->N/A
- Lens choice reasoning: 기획자(9) — production.js flat +5/+50 rep vs career.js 10x req curve; prestige loop broken past stage 2. UX(7)+게이머(7)+UI(6)+개발자(5) all >=5, all in queue. Playtest confirmed tutorial clean Step 1-4, misleading Rep/hr -- on career screen.
- [IMPLEMENT-SUMMARY] Attempted 5, Committed 5, Skipped 0+0
- [IMPLEMENT 1/5] 기획자 d006a17 — Rep gain scales with prestige multiplier (LOC +7/-5)
- [IMPLEMENT 2/5] UX d3fdbd3 — Career Rep/hr shows real manual estimate instead of -- (LOC +4/-4)
- [IMPLEMENT 3/5] 게이머 7e4ce88 — Challenge type cycling button + Rep in subtext (LOC +14/-1)
- [IMPLEMENT 4/5] UI 7e4ce88 — Challenge subtext shows Rep reward (included in 3/5)
- [IMPLEMENT 5/5] 개발자 922cdac — Persist currentChallengeType in gameState (LOC +8/-2)
