#!/usr/bin/env bash
set -e

GAME_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ZIP=/tmp/ai-tycoon-deploy.zip
TARGET="ramang/ai-tycoon:html"

echo "📦 패키징..."
rm -f "$ZIP"
cd "$GAME_DIR"
zip "$ZIP" index.html privacy-policy.html
zip -r "$ZIP" css/ js/ assets/

echo "🚀 itch.io 배포 중..."
butler push "$ZIP" "$TARGET"

echo "✅ 배포 완료: https://ramang.itch.io/ai-tycoon"
