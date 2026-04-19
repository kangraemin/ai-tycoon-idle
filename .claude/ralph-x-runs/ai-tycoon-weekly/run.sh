#!/bin/bash
# Ralph-X Auto-generated Loop — AI Tycoon 1시간 자동 개선
# Pipeline (per iter): (1) ga-analyze 스킬로 스냅샷+델타 분석 → (2) 개선 구현+커밋+푸시 → (3) 빌드체크+배포
# 성공 시 1h sleep, 실패 시 즉시 재시도 (마커 파일로 판정)
# 5관점 순환: UI → UX → 기획자 → 개발자 → 게이머 → UI ...
# Iterations: 1000 (빌드/배포 실패 재시도 버퍼 포함)
# macOS 자동 sleep 방지 — caffeinate로 self-wrap

set -u  # NOT set -e: continue on step failure

# ─── Self re-exec under caffeinate so the Mac can't sleep during the loop ──
if [ -z "${CAFFEINATED:-}" ]; then
  if command -v caffeinate >/dev/null 2>&1; then
    exec caffeinate -i -s env CAFFEINATED=1 bash "$0" "$@"
  else
    echo "⚠ caffeinate not found (not macOS?). Continuing without." >&2
    export CAFFEINATED=1
  fi
fi

RUN_DIR=".claude/ralph-x-runs/ai-tycoon-weekly"
MODEL="sonnet"
LOG_FILE="$RUN_DIR/log.md"
CHECKLIST_FILE="$RUN_DIR/checklist.md"
STATUS_FILE="$RUN_DIR/run.log"
MAX_ITER=1000
START_ITER=${START_ITER:-1}
SLEEP_SUCCESS=3600
SLEEP_FAIL=0

if [ ! -f "$LOG_FILE" ]; then
  cat > "$LOG_FILE" << 'LOGEOF'
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

LOGEOF
fi

if [ ! -f "$CHECKLIST_FILE" ]; then
  cat > "$CHECKLIST_FILE" << 'CHECKEOF'
# Loop Checklist
루프는 MAX_ITER(1000)까지 계속 돌아갑니다. 이 파일 건드리지 말 것.

- [ ] (DO NOT CHECK) MAX_ITER 도달
CHECKEOF
fi

PROMPT_DIR=$(mktemp -d)

# ─────────────────────────────────────────────────────────────────────
# STEP 1 — ANALYZE (ga-analyze 스킬 사용)
# ─────────────────────────────────────────────────────────────────────
cat > "$PROMPT_DIR/step1.txt" << 'S1EOF'
You are in a ralph loop for AI Tycoon game improvement.

Working directory: /Users/ram/programming/vibecoding/game

**Step 1 — Analyze (3-way triangulation: GA + Code fresh-eye + Direct playtest)**

GA alone is noisy at this traffic level. You MUST triangulate with code review and direct play.

### Procedure

1. **Read recent history** — read last 200 lines of `{RUN_DIR}/log.md`. Note what past iters tried. Avoid repeating exact changes within last 10 iters.

2. **Signal A — GA data** (via `ga-analyze` skill at `~/.claude/skills/ga-analyze/SKILL.md`):
   ```
   python3 scripts/ga-snapshot.py --days 7
   ```
   Read the 2 most recent snapshot JSON files in `analytics/snapshots/` and compute key deltas.
   If only 1 snapshot exists, use it as baseline.

3. **Signal B — Code fresh-eye review**:
   Read a diverse sample of 5-8 source files spanning all 5 lenses (UI/CSS, UX/tutorial, balance/economy, infrastructure/main, reward loops). You'll evaluate all lenses in step 5 so you need visibility across the codebase, not just one area.
   - UI/UX → `css/*.css`, `js/ui.js`, `js/tutorial.js`, `index.html`
   - 기획자 → `js/career.js`, `js/events.js`, `js/upgrade.js`, `js/research.js`, balance constants
   - 개발자 → 아무 파일 고르되 최근 수정된 hot spots + `js/main.js`, error paths
   - 게이머 → 핵심 루프 (`js/production.js`, `js/main.js`, reward paths)

   Note specific smells / inconsistencies / incomplete systems / obvious UX issues visible in source.

4. **Signal C — Direct playtest via browse skill** (NOTE: playtest is lens-agnostic — observe everything, map to lenses in step 5 below):
   ```bash
   # Start local server in background
   python3 -m http.server 8765 --directory /Users/ram/programming/vibecoding/game >/dev/null 2>&1 &
   SERVER_PID=$!
   sleep 1

   BROWSE=/Users/ram/programming/vibecoding/gstack/browse/dist/browse
   $BROWSE goto http://localhost:8765
   $BROWSE text                                    # capture initial state
   $BROWSE screenshot {ITER_DIR}/play-01-start.png

   # Play as a real user for ~2 minutes. Based on PERSPECTIVE, focus on:
   # - UI: read every label, check contrast, spacing
   # - UX: click through tutorial, note friction at each step
   # - 기획자: buy upgrades, track resource flow, see if loop feels rewarding
   # - 개발자: open browser devtools in output; look for console errors
   # - 게이머: just play naturally, note what's boring/confusing/fun

   # Perform 5-10 realistic actions. Capture text + screenshot at milestones:
   $BROWSE click '.editor-body'
   $BROWSE click '.editor-body'
   $BROWSE click '.editor-body'
   $BROWSE click '.compile-btn-mini'
   $BROWSE text
   $BROWSE screenshot {ITER_DIR}/play-02-mid.png

   # Continue exploring — buy upgrades, try tabs, trigger events if possible
   # Take final screenshot
   $BROWSE screenshot {ITER_DIR}/play-03-end.png

   # Stop server
   kill $SERVER_PID 2>/dev/null
   ```

   Write observations: what felt good, what felt broken, what was unclear, what UI elements were confusing.

5. **Evaluate from ALL 5 lenses** — no forced rotation. From the 3 signals (GA + Code + Playtest), score candidate improvements under each of these lenses:
   - **UI** → 가독성, 색·대비, 정보 계층, 버튼 위치/크기, 폰트, 여백
   - **UX** → 플로우 마찰, 튜토리얼 UX, 클릭 동선, 애니메이션 타이밍, 피드백 가시성
   - **기획자** → 게임 밸런스, 보상감, 루프 설계, 경제 곡선, 난이도, 컨텐츠 깊이
   - **개발자** → 코드 품질, 버그, 성능, 기술 부채, 에러 핸들링, 리팩토링
   - **게이머** → 재미, 중독성, 숨겨진 즐거움, 리드아웃, 몰입감, 체감 보상

   Produce at minimum ONE candidate per lens (even if weak) so the analysis file shows cross-lens coverage. Mark each candidate with its primary lens tag.

6. **Triangulate** the 3 signals across the 5 lenses. The best improvements match BOTH what GA/history suggests AND what code review / playtest reveals. If GA is silent (too few users), lean more on B + C.

7. **Anti-stagnation rule**: Review the last 5 iterations' chosen lenses in `{RUN_DIR}/log.md`. If the same lens was picked 3+ times in a row, you SHOULD pick a different lens this iter unless there's a truly critical cross-cutting issue. Diversity over the long run, not dogmatic rotation.

8. **Decide ONE improvement** that:
   - Matches the perspective
   - Has scope appropriate to the problem — small polish for minor issues, system-level rework for systemic issues. Do NOT artificially cap LOC. If the right fix needs 800 lines across 6 files, do 800 lines. If it needs 30, do 30.
   - Not tried in last 10 iters
   - Clear hypothesized impact tied to a metric in the snapshot delta table
   - Real problems for an idle/tycoon game at this stage often require system-level work — prestige loops, economy rebalance, new content types, onboarding rewrites, feature additions. Do NOT default to tiny CSS polish unless that's genuinely the highest-impact change.

### Output — write to `{ITER_DIR}/01-analysis.md` with this EXACT structure:

```markdown
# Iter {ITER} Analysis (multi-lens)

_Generated: <date>_

## Snapshot Delta Table
| Metric | Current | Previous | Delta |
|---|---|---|---|
| activeUsers | N | N | ±N (±X%) |
| newUsers | N | N | ±N |
| tutorial_step/user | N.NN | N.NN | ±N.NN |
| challenge_complete_rate | NN% | NN% | ±NN%p |
| upgrade_purchase/user | N.NN | N.NN | ±N.NN |
| avg_session_sec | N | N | ±N |
| (눈에 띄는 국가/디바이스별 1-2개 추가) | | | |

## Top 3 GA Findings
1. <numeric finding with before/after>
2. <numeric finding>
3. <numeric finding>

## Code Fresh-eye Findings
이번 관점에서 읽은 파일 목록 + 구체적 관찰 (최소 3개):
1. `<file>:<line>` — <관찰 내용>
2. `<file>:<line>` — <관찰 내용>
3. `<file>:<line>` — <관찰 내용>

## Playtest Observations
browse 스킬로 직접 플레이하며 발견한 것 (스크린샷 파일 경로 포함, 최소 3개):
1. <관찰> (screenshot: play-01-start.png)
2. <관찰> (screenshot: play-02-mid.png)
3. <관찰> (screenshot: play-03-end.png)

## Triangulation
3 신호가 어떻게 수렴하는지 한 문단. GA / Code / Playtest 중 어느 쪽이 가장 강한 신호를 줬는지 명시.

## Candidates Per Lens
각 렌즈별 최소 1개 후보. 찾은 신호에 근거. 점수는 1-10 (영향도 × 구현가능성).

### UI
- **Candidate**: <title> / Score: N/10 / Evidence: <GA/code/playtest 중 어디서>

### UX
- **Candidate**: <title> / Score: N/10 / Evidence: <...>

### 기획자
- **Candidate**: <title> / Score: N/10 / Evidence: <...>

### 개발자
- **Candidate**: <title> / Score: N/10 / Evidence: <...>

### 게이머
- **Candidate**: <title> / Score: N/10 / Evidence: <...>

## Lens Choice Reasoning
각 렌즈 후보 중 score ≥ 5 인 것들을 **전부 이번 iter에 구현**한다 (선택 아니라 다 시도). 최근 5 iters 이력 참조하여 같은 렌즈가 과하게 반복되지 않도록 점수 경계 케이스(정확히 5/10) 판단. 이 섹션은 이제 "각 후보가 왜 통과 또는 컷오프됐는지" 설명.

## Implementation Queue
아래 순서대로 Step 2에서 구현한다. Primary를 우선, 나머지는 점수 내림차순. 각 항목은 별도 commit.

| # | Lens | Title | Score | Files (예상) |
|---|---|---|---|---|
| 1 | <lens> | <title> | N/10 | `path1`, `path2` |
| 2 | <lens> | <title> | N/10 | `path3` |
| 3 | <lens> | <title> | N/10 | `path4` |

(Score < 5 인 후보는 이 표에 넣지 않음. "Considered but Rejected" 섹션에 이동.)

## Primary Improvement (점수 가장 높은 것 상세)
**Lens**: <UI | UX | 기획자 | 개발자 | 게이머>
**Title**: <한 줄>
**Why**: <findings와 논리적 연결>
**Files to change**: <실제 존재하는 파일 경로 목록>
**Implementation sketch**: <어떻게 바꿀지. 핵심 함수명/셀렉터/상수 언급.>
**Expected impact**:
- 단기(1h 후): <지표 X가 Y 방향으로>
- 장기(1주 후): <지표 Z가 W 방향으로>
**Rollback plan**: <안 되면 어떻게 되돌릴지>

## Considered but Rejected
- **Option A — <title>**: <왜 기각>
- **Option B — <title>**: <왜 기각>
(최소 2개)
```

### Log append — append to `{RUN_DIR}/log.md`:
```
## Iter {ITER} — <chosen-lens> — <timestamp>
- [ANALYZE] <selected title>
- Delta: activeUsers <N>→<N>, tutorial/user <X>→<X>
- Lens choice reasoning: <한 줄 — 왜 이 렌즈를 골랐는지>
```

**DO NOT modify game source code this step.** Analysis only.
Work autonomously. No questions. Missing data → note and proceed.
S1EOF

# ─────────────────────────────────────────────────────────────────────
# STEP 2 — IMPLEMENT + COMMIT + PUSH
# ─────────────────────────────────────────────────────────────────────
cat > "$PROMPT_DIR/step2.txt" << 'S2EOF'
You are in a ralph loop for AI Tycoon game improvement.

Working directory: /Users/ram/programming/vibecoding/game

**Step 2 — Implement ALL candidates in Implementation Queue + per-candidate commit + push**

### Procedure

1. Read `{ITER_DIR}/01-analysis.md` → **Implementation Queue** table. If queue empty or analysis missing, write `SKIPPED` to `{ITER_DIR}/02-implementation.md` and stop.

2. **Track which files each candidate touches in this iter** to detect conflicts:
   ```
   FILES_MODIFIED_THIS_ITER = set()
   ```

3. For each candidate in queue (order = as listed in table, Primary first):

   a. **Conflict check**: read the candidate's "Files (예상)" column. If any file is already in `FILES_MODIFIED_THIS_ITER` AND the change would overlap in the same function/region, **skip this candidate** and log `[SKIP-CONFLICT]`. (Different files → proceed. Same file but clearly separate regions → proceed. Same region → skip.)

   b. Implement the candidate — read only the files needed, make the change focused on this candidate's scope. Do NOT scope-creep into other candidates.

   c. **Syntax check per-file**: `node --check <file>` for each `.js` edited. If any fails, revert this candidate's changes (git checkout -- <files>) and log `[SKIP-BUILDFAIL] <reason>`. Proceed to next candidate.

   d. Stage files individually (NEVER `git add -A`):
      ```
      git add <path1> <path2>
      ```

   e. Commit with HEREDOC using this candidate's lens:
      ```bash
      git commit -m "$(cat <<'EOF'
      feat: [ralph iter {ITER}/<lens> #<k>] <short title>

      - <change line 1>
      - <change line 2>
      EOF
      )"
      ```
      where `<k>` = 1-based position in queue.

   f. Add each edited file to `FILES_MODIFIED_THIS_ITER`.

   g. Track commit hash for this candidate.

4. After all candidates processed: `git push origin main` (single push for whole iter).

### Output — `{ITER_DIR}/02-implementation.md`:

```markdown
# Iter {ITER} Implementation (multi-candidate)

Queue length: N

## Candidate 1 — <lens> (score N/10)
**Title**: <title>
**Files changed**:
- `path`: <1-line summary>

**Commit**: <full hash>
**LOC**: +<a>/-<d>
**Status**: committed | skipped-conflict | skipped-buildfail
**Notes**: <if skipped, why>

## Candidate 2 — <lens> (score N/10)
(same structure)

## Candidate N — ...

## Summary
- Attempted: N
- Committed: M
- Skipped (conflict): K
- Skipped (build fail): L
- Total LOC: +<a>/-<d>

## Files Modified This Iter
- `file1` (from candidate 1, 2)
- `file2` (from candidate 3)

## Push status
- success | fail: <reason>
```

### Log append to `{RUN_DIR}/log.md`:
```
- [IMPLEMENT-SUMMARY] Attempted N, Committed M, Skipped K+L
- [IMPLEMENT 1/N] <lens> <short_hash> — <title> (LOC +a/-d)
- [IMPLEMENT 2/N] <lens> <short_hash> — <title>
- [SKIP-CONFLICT N/N] <lens> <title> — reason
```

Work autonomously. No questions.
S2EOF

# ─────────────────────────────────────────────────────────────────────
# STEP 3 — BUILD CHECK + DEPLOY
# ─────────────────────────────────────────────────────────────────────
cat > "$PROMPT_DIR/step3.txt" << 'S3EOF'
You are in a ralph loop for AI Tycoon game improvement.

Working directory: /Users/ram/programming/vibecoding/game

**Step 3 — Build Check + Deploy**

### Procedure

1. Read `{ITER_DIR}/02-implementation.md`. Check the **Summary** section:
   - If `Committed: 0`, write `SKIPPED — no candidates committed` to `{ITER_DIR}/03-deploy.md` and stop. **Do NOT create the `deploy-success` marker**.
   - If `Committed: ≥1`, proceed with build+deploy. Even partial iter (some skipped) is worth deploying.

2. **Full syntax check**: For every `.js` under `js/`, `node --check <file>`. Collect failures.

3. **Asset sanity**: index.html exists and >1KB.

4. If syntax errors or asset missing:
   - Write to `{ITER_DIR}/03-deploy.md`:
     ```markdown
     # Iter {ITER} Deploy — BUILD FAILURE

     ## Syntax errors
     - `<file>`: <error>

     ## Asset checks
     - index.html: <status>
     ```
   - Append `- [BUILD_FAIL] <short reason>` to `{RUN_DIR}/log.md`
   - **Do NOT create marker. Stop.**

5. **Deploy**: `bash scripts/deploy-itch.sh 2>&1 | tee /tmp/ralph-deploy-{ITER}.log`. Capture exit code.

6. If deploy fails (exit != 0 or no "배포 완료" string):
   - Write to `{ITER_DIR}/03-deploy.md`:
     ```markdown
     # Iter {ITER} Deploy — DEPLOY FAILURE

     ## Build Check
     - Syntax: OK (<N> files)
     - index.html: <size> bytes

     ## Deploy Attempt
     - Exit code: <code>
     - Error summary: <short>

     ## Full deploy log
     \`\`\`
     <paste /tmp/ralph-deploy-{ITER}.log>
     \`\`\`
     ```
   - Append `- [DEPLOY_FAIL] <reason>` to `{RUN_DIR}/log.md`
   - **Do NOT create marker. Stop.**

7. If deploy succeeds:
   - Write to `{ITER_DIR}/03-deploy.md`:
     ```markdown
     # Iter {ITER} Deploy — SUCCESS

     ## Build Check
     - Syntax: OK (<N> files)
     - index.html: OK (<size> bytes)

     ## Deploy
     - Exit code: 0
     - URL: https://ramang.itch.io/ai-tycoon
     - Timestamp: <time>

     ## Full deploy log
     \`\`\`
     <paste>
     \`\`\`
     ```
   - Append `- [DEPLOY] success — https://ramang.itch.io/ai-tycoon` to `{RUN_DIR}/log.md`
   - **Create marker**: `touch {ITER_DIR}/deploy-success`
     The loop reads this file: present = 1h sleep, absent = immediate retry.

Work autonomously. No questions.
S3EOF

# ─────────────────────────────────────────────────────────────────────
# MAIN LOOP
# ─────────────────────────────────────────────────────────────────────
for i in $(seq $START_ITER $MAX_ITER); do
  ITER_NUM=$(printf '%04d' $i)
  ITER_DIR="$RUN_DIR/iterations/iter-$ITER_NUM"
  mkdir -p "$ITER_DIR"

  echo "━━━ Iter $i/$MAX_ITER — $(date '+%Y-%m-%d %H:%M') — multi-lens ━━━" | tee -a "$STATUS_FILE"

  render() {
    sed \
      -e "s|{ITER}|$i|g" \
      -e "s|{ITER_DIR}|$ITER_DIR|g" \
      -e "s|{RUN_DIR}|$RUN_DIR|g" \
      "$1"
  }

  echo "[$i] Step 1: Analyze" | tee -a "$STATUS_FILE"
  claude -p --model "$MODEL" --dangerously-skip-permissions \
    "$(render "$PROMPT_DIR/step1.txt")" \
    >> "$STATUS_FILE" 2>&1 || echo "[$i] Step 1 errored (continuing)" | tee -a "$STATUS_FILE"

  echo "[$i] Step 2: Implement" | tee -a "$STATUS_FILE"
  claude -p --model "$MODEL" --dangerously-skip-permissions \
    "$(render "$PROMPT_DIR/step2.txt")" \
    >> "$STATUS_FILE" 2>&1 || echo "[$i] Step 2 errored (continuing)" | tee -a "$STATUS_FILE"

  echo "[$i] Step 3: Deploy" | tee -a "$STATUS_FILE"
  claude -p --model "$MODEL" --dangerously-skip-permissions \
    "$(render "$PROMPT_DIR/step3.txt")" \
    >> "$STATUS_FILE" 2>&1 || echo "[$i] Step 3 errored (continuing)" | tee -a "$STATUS_FILE"

  if [ -f "$ITER_DIR/deploy-success" ]; then
    echo "[$i] ✅ success — sleeping ${SLEEP_SUCCESS}s" | tee -a "$STATUS_FILE"
    [ $i -lt $MAX_ITER ] && sleep $SLEEP_SUCCESS
  else
    echo "[$i] ❌ failure/skip — immediate retry (sleep ${SLEEP_FAIL}s)" | tee -a "$STATUS_FILE"
    [ $SLEEP_FAIL -gt 0 ] && sleep $SLEEP_FAIL
  fi
done

rm -rf "$PROMPT_DIR"
echo "🏁 Ralph-X finished $MAX_ITER iterations at $(date)" | tee -a "$STATUS_FILE"
