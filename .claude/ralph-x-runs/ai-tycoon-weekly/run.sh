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

**Step 1 — Analyze (via ga-analyze skill)**

You MUST use the `ga-analyze` skill for data analysis. The skill's full workflow lives at
`~/.claude/skills/ga-analyze/SKILL.md`. Its snapshot script is already installed at
`scripts/ga-snapshot.py` in this project.

### Procedure

1. **Read recent history** — read last 200 lines of `{RUN_DIR}/log.md`. Note which improvements past iterations tried. Avoid repeating the exact same change within the last 10 iters.

2. **Run ga-analyze snapshot**:
   ```
   python3 scripts/ga-snapshot.py --days 1
   ```
   This writes `analytics/snapshots/<timestamp>.json` and a report to `analytics/reports/<date>.md`.

3. **Compute deltas** — read the 2 most recent snapshot JSON files in `analytics/snapshots/`. If only 1 exists, prev values = "-" (baseline).

4. **Perspective this iteration is fixed: {PERSPECTIVE}** (Iter {ITER}).
   Do NOT change it. Definitions:
   - **UI** → 가독성, 색·대비, 정보 계층, 버튼 위치/크기, 폰트, 여백
   - **UX** → 플로우 마찰, 튜토리얼 UX, 클릭 동선, 애니메이션 타이밍, 피드백 가시성
   - **기획자** → 게임 밸런스, 보상감, 루프 설계, 경제 곡선, 난이도, 컨텐츠 깊이
   - **개발자** → 코드 품질, 버그, 성능, 기술 부채, 에러 핸들링, 리팩토링
   - **게이머** → 재미, 중독성, 숨겨진 즐거움, 리드아웃, 몰입감, 체감 보상

5. **Decide ONE improvement** that:
   - Matches the perspective
   - Implementable in <200 lines of change
   - Not tried in last 10 iters
   - Clear hypothesized impact tied to a metric in the snapshot delta table

### Output — write to `{ITER_DIR}/01-analysis.md` with this EXACT structure:

```markdown
# Iter {ITER} Analysis — {PERSPECTIVE}

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

## Perspective Rotation Reason
이번 iteration 관점은 **{PERSPECTIVE}**. 이 관점이 지금 iter에 왜 의미 있는지 한 문단. 위 GA findings과 어떻게 연결되는지 논리 제시.

## Selected Improvement
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
## Iter {ITER} — {PERSPECTIVE} — <timestamp>
- [ANALYZE] <selected title>
- Delta: activeUsers <N>→<N>, tutorial/user <X>→<X>
- Rotation reason: <한 줄>
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

**Step 2 — Implement + Commit + Push**

### Procedure

1. Read `{ITER_DIR}/01-analysis.md`. Focus on Selected Improvement section.

2. If analysis empty or improvement title is "-":
   - Write to `{ITER_DIR}/02-implementation.md`:
     ```markdown
     # Iter {ITER} Implementation — SKIPPED
     Reason: <no analysis / empty / etc.>
     ```
   - Append `- [SKIP] no analysis` to `{RUN_DIR}/log.md` and stop.

3. Implement the improvement in the specified files. Do NOT scope-creep.

4. **Syntax check per-file**: For every `.js` file edited, run `node --check <file>`. Fix before committing.

5. Stage files individually (NEVER `git add -A` / `git add .`):
   ```
   git add <path1> <path2>
   ```

6. Commit with HEREDOC (body = bullet list):
   ```bash
   git commit -m "$(cat <<'EOF'
   feat: [ralph iter {ITER}/{PERSPECTIVE}] <short title>

   - <change line 1>
   - <change line 2>
   EOF
   )"
   ```

7. `git push origin main`.

### Output — `{ITER_DIR}/02-implementation.md`:

```markdown
# Iter {ITER} Implementation — {PERSPECTIVE}

## Files changed
- `path/to/file.js`: <1-line summary>
- `path/to/file.css`: <1-line summary>

## Git diff summary
Paste output of `git diff HEAD~1 --stat`:
\`\`\`
<paste>
\`\`\`

## Full diff (key hunks)
Paste top 150 lines of `git show HEAD`:
\`\`\`diff
<paste>
\`\`\`

## Commit
- Hash: <full hash>
- Message: <title>

## Risk notes
- <risky/untested/side effects>

## Push status
- success | fail: <reason>
```

### Log append to `{RUN_DIR}/log.md`:
```
- [IMPLEMENT] <short_hash> — <title>
- Files: <comma-separated>
- LOC: +<added>/-<deleted>
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

1. Read `{ITER_DIR}/02-implementation.md`. If SKIPPED, write same to `{ITER_DIR}/03-deploy.md` and stop — **do NOT create the `deploy-success` marker**.

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
for i in $(seq 1 $MAX_ITER); do
  ITER_NUM=$(printf '%04d' $i)
  ITER_DIR="$RUN_DIR/iterations/iter-$ITER_NUM"
  mkdir -p "$ITER_DIR"

  PERSP_IDX=$(( (i - 1) % 5 ))
  PERSPECTIVES=("UI" "UX" "기획자" "개발자" "게이머")
  PERSPECTIVE="${PERSPECTIVES[$PERSP_IDX]}"

  echo "━━━ Iter $i/$MAX_ITER — $PERSPECTIVE — $(date '+%Y-%m-%d %H:%M') ━━━" | tee -a "$STATUS_FILE"

  render() {
    sed \
      -e "s|{ITER}|$i|g" \
      -e "s|{PERSPECTIVE}|$PERSPECTIVE|g" \
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
