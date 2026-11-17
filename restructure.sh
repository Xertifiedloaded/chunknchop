#!/usr/bin/env bash
set -e
cd "$(git rev-parse --show-toplevel)"

APP=app
[ -d src/app ] && APP=src/app

rm -f "$APP/(shop)/layout.tsx" "$APP/account/layout.tsx"

[ -d "$APP/(shop)/shop" ] && git mv "$APP/(shop)/shop" "$APP/(store)/shop"
[ -d "$APP/(shop)/products" ] && git mv "$APP/(shop)/products" "$APP/(store)/products"
[ -d "$APP/account" ] && git mv "$APP/account" "$APP/(store)/account"

rmdir "$APP/(shop)" 2>/dev/null || true
rm -rf components/shop components/account

echo "Reverted."