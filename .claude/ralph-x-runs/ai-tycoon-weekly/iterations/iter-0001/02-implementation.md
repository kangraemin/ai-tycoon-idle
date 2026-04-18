# Iter 1 Implementation — UI

## Files changed
- `js/tutorial.js`: Step label + progress bar HTML injected into both modal and spotlight modes; directional arrow (up/down) added to spotlight bubbles
- `css/style.css`: .tutorial-spotlight pulse animation (blue glow, 1.5s); progress, step-label, arrow styles added

## Git diff summary
```
 css/style.css  | 47 +++++++++++++++++++++++++++
 js/tutorial.js |  9 +++--
 3 files changed, 54 insertions(+), 2 deletions(-)
```

## Commit
- Hash: 9038e4620c9623ce9a2cbd1c1b41c20cf5a9576e
- Message: feat: [ralph iter 1/UI] 튜토리얼 진행 표시줄 + 스포트라이트 펄스 + 방향 화살표 추가

## Risk notes
- Arrow color uses var(--bg-card) — matches bubble in both light/dark themes
- Modal step label shows "Step 1 of 10" on welcome; acceptable expectation-setting
- Spotlight border animation resets cleanly on each step re-render

## Push status
- success
