#!/usr/bin/env bash
# Fail if hex / #rrggbb color literals appear in registry TSX (token-only aesthetic).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Match #RGB / #RRGGBB / #RRGGBBAA (case-insensitive), not headings or IDs alone.
if rg -n --glob 'registry/**/*.tsx' \
  -e '#[0-9a-fA-F]{3}\b' \
  -e '#[0-9a-fA-F]{6}\b' \
  -e '#[0-9a-fA-F]{8}\b' \
  -e '\bbg-\[[^\]]*#' \
  -e '\btext-\[[^\]]*#' \
  -e '\bborder-\[[^\]]*#' \
  "$ROOT"; then
  echo "assert-no-hex: hex / arbitrary color literals found in registry/**/*.tsx" >&2
  exit 1
fi
echo "assert-no-hex: ok"
