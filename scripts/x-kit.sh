#!/bin/sh
# Renders the X kit images to docs/x-kit/images (2x PNG).
# Needs the web dev server on localhost:3000 and Google Chrome.
# Usage: sh scripts/x-kit.sh [slug ...]
set -e
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="$(cd "$(dirname "$0")/.." && pwd)/docs/x-kit/images"
mkdir -p "$OUT"
size() {
  case "$1" in
    article-cover) echo 1500,600 ;;
    banner*) echo 1500,500 ;;
    avatar*) echo 800,800 ;;
    *) echo 1200,675 ;;
  esac
}
SLUGS="${*:-launch before-after phone widgets wallets badges verified referral invite-only customize spotify analytics giveaway invite-codes claim tiers article-cover banner banner-card banner-moves banner-drag banner-mix banner-url banner-pink avatar avatar-pink avatar-glow avatar-gradient avatar-ring avatar-grid avatar-sparkle avatar-neon avatar-white avatar-pink-glow}"
for s in $SLUGS; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --window-size="$(size "$s")" --virtual-time-budget=10000 \
    --screenshot="$OUT/$s.png" "http://localhost:3000/x-kit/$s" >/dev/null 2>&1
  echo "$OUT/$s.png"
done
