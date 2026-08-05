#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
mkdir -p dist "$stage/release"
rm -f dist/authorization-required.zip
cp index.html "$stage/release/"
cp -R css js content "$stage/release/"
(
  cd "$stage/release"
  zip -qr "$OLDPWD/dist/authorization-required.zip" .
)
echo "wrote dist/authorization-required.zip"
