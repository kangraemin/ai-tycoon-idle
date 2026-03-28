#!/bin/bash
# Android release keystore 생성 스크립트
# 사용법: bash scripts/gen-keystore.sh
set -e

echo "=== Android Release Keystore 생성 ==="
echo ""

read -p "Key alias (예: aitycoon-key): " KEY_ALIAS
read -s -p "Store password (최소 6자): " STORE_PASSWORD
echo ""
read -s -p "Key password (최소 6자): " KEY_PASSWORD
echo ""

OUTPUT="release.keystore"

keytool -genkeypair \
  -v \
  -keystore "$OUTPUT" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "$STORE_PASSWORD" \
  -keypass "$KEY_PASSWORD" \
  -dname "CN=AI Tycoon, OU=Game, O=AI Tycoon, L=Seoul, ST=Seoul, C=KR"

echo ""
echo "✅ keystore 생성 완료: $OUTPUT"
echo ""
echo "━━━━ GitHub Secrets에 추가할 값들 ━━━━"
echo ""
echo "ANDROID_KEYSTORE_BASE64 (아래 전체 복사):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
base64 -i "$OUTPUT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "KEYSTORE_STORE_PASSWORD: $STORE_PASSWORD"
echo "KEYSTORE_KEY_ALIAS:      $KEY_ALIAS"
echo "KEYSTORE_KEY_PASSWORD:   $KEY_PASSWORD"
echo ""
echo "⚠️  keystore 파일과 비밀번호를 반드시 안전한 곳에 백업하세요."
echo "   잃어버리면 앱 업데이트가 영구적으로 불가능합니다."
echo ""
echo "⚠️  release.keystore는 절대 git에 커밋하지 마세요."
